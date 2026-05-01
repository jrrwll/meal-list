import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, message, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { createMeal } from '../services/api';
import ImageUploader from '../components/ImageUploader';
import TagEditor from '../components/TagEditor';

export default function Create() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  const handlePublish = async () => {
    if (!name.trim()) {
      message.error('请输入餐单名称');
      return;
    }
    const uploaded = fileList.filter((f) => f.status === 'done');
    if (uploaded.length === 0) {
      message.error('请至少上传一张图片');
      return;
    }
    const uploading = fileList.some((f) => f.status === 'uploading');
    if (uploading) {
      message.warning('图片正在上传中，请稍候');
      return;
    }
    const urls = uploaded
      .map((f) => f.response)
      .filter((u): u is string => typeof u === 'string');
    if (urls.length === 0) {
      message.error('图片上传失败，请重新上传');
      return;
    }
    setSubmitting(true);
    try {
      await createMeal({
        name: name.trim(),
        description: description.trim() || null,
        images: urls,
        tags,
      });
      message.success('发布成功');
      navigate('/');
    } catch {
      message.error('发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Spin spinning={submitting}>
      <div className="create-page">
        <div className="create-header">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} className="back-btn">
            返回
          </Button>
          <Button type="primary" onClick={handlePublish} className="publish-btn">
            发布
          </Button>
        </div>

        <div className="create-body">
          <TagEditor value={tags} onChange={setTags} />

          <Input
            placeholder="请输入餐单名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="create-name"
            maxLength={50}
            showCount
          />

          <Input.TextArea
            placeholder="请输入描述"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="create-desc"
            autoSize={{ minRows: 2 }}
            maxLength={500}
            showCount
          />

          <ImageUploader
            fileList={fileList}
            onChange={setFileList}
          />
        </div>
      </div>
    </Spin>
  );
}
