import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, message, Spin, Modal } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { fetchMealDetail, updateMeal } from '../services/api';
import ImageUploader from '../components/ImageUploader';
import TagEditor from '../components/TagEditor';

export default function Edit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    fetchMealDetail(id)
      .then((detail) => {
        setName(detail.name);
        setDescription(detail.description || '');
        setTags(detail.tags || []);
        setFileList(
          detail.images.map((url, i) => ({
            uid: `img-${i}`,
            name: `image-${i}`,
            status: 'done',
            url,
            response: url,
          })),
        );
      })
      .catch(() => {
        message.error('加载餐单失败');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = () => {
    Modal.confirm({
      title: '确认更新',
      content: '是否确认更新',
      okText: '是',
      cancelText: '否',
      onOk: doSave,
    });
  };

  const doSave = async () => {
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
      await updateMeal({
        id: id!,
        name: name.trim(),
        description: description.trim() || null,
        images: urls,
        tags,
      });
      message.success('更新成功');
      navigate('/');
    } catch {
      message.error('更新失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Spin spinning={loading || submitting}>
      <div className="create-page">
        <div className="create-header">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className="back-btn">
            返回
          </Button>
          <Button type="primary" onClick={handleSave} className="save-btn" disabled={!hasChanges}>
            保存
          </Button>
        </div>

        <div className="create-body">
          <TagEditor value={tags} onChange={setTags} />

          <Input
            placeholder="请输入餐单名称"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setHasChanges(true);
            }}
            className="create-name"
            maxLength={50}
            showCount
          />

          <Input.TextArea
            placeholder="请输入描述"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setHasChanges(true);
            }}
            className="create-desc"
            autoSize={{ minRows: 2 }}
            maxLength={500}
            showCount
          />

          <ImageUploader
            fileList={fileList}
            onChange={(files) => {
              setFileList(files);
              setHasChanges(true);
            }}
          />
        </div>
      </div>
    </Spin>
  );
}
