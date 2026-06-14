import { createSignal } from 'solid-js';
import { settings } from './settings';

const [localAvailable, setLocalAvailable] = createSignal(false);

export { localAvailable };

export async function probeLocal(): Promise<void> {
  const localUrl = settings().local_base_url.trim();
  if (!localUrl || settings().local_base_url_disable) {
    setLocalAvailable(false);
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);

  try {
    const resp = await fetch(`${localUrl.replace(/\/$/, '')}/ready`, {
      signal: controller.signal,
    });
    setLocalAvailable(resp.ok);
  } catch {
    setLocalAvailable(false);
  } finally {
    clearTimeout(timeout);
  }
}

export function resetLocalAvailable(): void {
  setLocalAvailable(false);
}
