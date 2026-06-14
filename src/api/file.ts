import { request } from './client';
import { settings } from '../utils/settings';

export async function uploadFile(file: File): Promise<string> {
  const apiKey = settings().s_ee_api_key.trim();

  if (apiKey) {
    // s.ee upload → then /file/upload/hosting to save metadata
    const fd = new FormData();
    fd.append('file', file);

    const uploadResp = await fetch('https://s.ee/api/v1/file/upload', {
      method: 'POST',
      headers: { Authorization: apiKey },
      body: fd,
    });

    if (!uploadResp.ok) {
      throw new Error(`s.ee upload failed: HTTP ${uploadResp.status}`);
    }

    const uploadJson = await uploadResp.json();
    if (uploadJson.code !== 200 || !uploadJson.success) {
      throw new Error(uploadJson.message || 's.ee upload failed');
    }

    const data = uploadJson.data;
    const fingerprint = await computeMd5(file);

    const url = await request<string>('/file/upload/hosting', {
      method: 'POST',
      body: {
        fingerprint,
        kind: 's.ee',
        file_id: data.hash,
        filename: data.filename,
        size: data.size,
        url: data.url,
        extra: data,
      },
    });

    return url;
  }

  // default: upload to local server
  const fd = new FormData();
  fd.append('file', file);
  return request<string>('/file/upload', { method: 'POST', body: fd });
}

async function computeMd5(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('MD5', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
