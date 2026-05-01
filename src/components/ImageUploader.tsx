import { useCallback, useRef, useState } from 'react';
import { message } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { PhotoSlider } from 'react-photo-view';
import type { UploadFile } from 'antd/es/upload/interface';
import { uploadFile } from '../services/api';
import 'react-photo-view/dist/react-photo-view.css';

const MAX_IMAGES = 9;

interface ImageUploaderProps {
  fileList: UploadFile[];
  onChange: (fileList: UploadFile[]) => void;
}

export default function ImageUploader({ fileList, onChange }: ImageUploaderProps) {
  const [photoVisible, setPhotoVisible] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // Keep a live ref to fileList so async upload loops see latest state.
  const fileListRef = useRef(fileList);
  fileListRef.current = fileList;

  const doneImages = fileList.filter((f) => f.status === 'done');
  const sliderImages = doneImages.map((f) => ({
    key: f.uid,
    src: (f.response as string) || f.url!,
  }));

  const handlePreview = useCallback((index: number) => {
    setPhotoIndex(index);
    setPhotoVisible(true);
  }, []);

  const handleDelete = useCallback(
    (index: number) => {
      const file = doneImages[index];
      onChange(fileListRef.current.filter((f) => f.uid !== file.uid));
    },
    [doneImages, onChange],
  );

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (fileListRef.current.length >= MAX_IMAGES) break;
      if (!file.type.startsWith('image/')) {
        message.error('只能上传图片文件');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        message.error('图片大小不能超过 10MB');
        continue;
      }
      const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const pending: UploadFile = {
        uid,
        name: file.name,
        status: 'uploading',
      };
      const afterAdd = [...fileListRef.current, pending];
      fileListRef.current = afterAdd;
      onChange(afterAdd);

      try {
        const url = await uploadFile(file);
        const next = fileListRef.current
          .filter((f) => f.uid !== uid)
          .concat([{ uid, name: file.name, status: 'done', url, response: url }])
          .slice(0, MAX_IMAGES);
        fileListRef.current = next;
        onChange(next);
      } catch {
        message.error(`${file.name} 上传失败`);
        const next = fileListRef.current.filter((f) => f.uid !== uid);
        fileListRef.current = next;
        onChange(next);
      }
    }
  };

  return (
    <div>
      <div className="image-uploader">
        {doneImages.map((img, i) => (
          <div
            key={img.uid}
            className="image-thumb-wrapper"
            onClick={() => handlePreview(i)}
          >
            <img src={img.url} alt={img.name} className="image-thumb" />
            <button
              className="image-thumb-delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(i);
              }}
            >
              <CloseOutlined />
            </button>
          </div>
        ))}
        {fileList.length < MAX_IMAGES && (
          <>
            <div
              className="image-thumb-wrapper upload-placeholder"
              onClick={() => inputRef.current?.click()}
            >
              <PlusOutlined style={{ fontSize: 24 }} />
              <div style={{ marginTop: 4 }}>上传图片</div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = '';
                await handleFiles(files);
              }}
            />
          </>
        )}
      </div>

      <PhotoSlider
        images={sliderImages}
        visible={photoVisible}
        onClose={() => setPhotoVisible(false)}
        index={photoIndex}
        onIndexChange={setPhotoIndex}
        bannerVisible={false}
        speed={() => 0}
        maskClassName="photo-mask"
        overlayRender={({ index }) => (
          <div className="photo-toolbar">
            <button className="photo-back" onClick={() => setPhotoVisible(false)}>
              ← 返回
            </button>
            <span className="photo-counter">
              {index + 1}/{sliderImages.length}
            </span>
            <button className="photo-delete" onClick={() => handleDelete(index)}>
              <CloseOutlined />
            </button>
          </div>
        )}
      />
    </div>
  );
}
