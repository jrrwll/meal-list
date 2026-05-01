import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Divider, Input, Popover, Tag as AntTag } from 'antd';
import { TagsOutlined, SearchOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import { fetchTagList, type TagItem } from '../services/api';

interface TagFilterProps {
  value: string[];
  onChange: (tags: string[]) => void;
  onSearch: () => void;
}

export default function TagFilter({ value, onChange, onSearch }: TagFilterProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    if (!open || tags.length > 0) return;
    fetchTagList().then(setTags).catch(() => setTags([]));
  }, [open]);

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [adding]);

  const toggleTag = useCallback(
    (name: string) => {
      if (value.includes(name)) {
        onChange(value.filter((t) => t !== name));
      } else {
        onChange([...value, name]);
      }
    },
    [value, onChange],
  );

  const confirmAddTag = useCallback(() => {
    const v = newTag.trim();
    if (v && !value.includes(v)) {
      onChange([...value, v]);
    }
    setNewTag('');
    setAdding(false);
  }, [newTag, value, onChange]);

  const popoverContent = (
    <div className="tag-popover">
      <div className="tag-popover-header">
        <div className="tag-popover-label">已选标签</div>
        <Button
          size="small"
          type="primary"
          icon={<SearchOutlined />}
          className="tag-search-btn"
          onClick={() => {
            onSearch();
            setOpen(false);
          }}
          disabled={value.length === 0}
        >
          搜索
        </Button>
      </div>
      {value.length > 0 ? (
        <div className="tag-popover-tags">
          {value.map((t) => (
            <AntTag
              key={t}
              color="blue"
              onClick={() => toggleTag(t)}
              style={{ cursor: 'pointer' }}
            >
              {t}
            </AntTag>
          ))}
        </div>
      ) : (
        <div className="tag-empty-mini">暂无已选标签</div>
      )}

      <Divider style={{ margin: '8px 0' }} />

      <div className="tag-popover-label">可选标签</div>
      <div className="tag-popover-tags tag-scroll-area">
        <div
          className={`tag-item-add ${adding ? 'tag-item-add-active' : ''}`}
          onClick={() => !adding && setAdding(true)}
        >
          {adding ? (
            <Input
              ref={inputRef}
              size="small"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onPressEnter={confirmAddTag}
              onBlur={confirmAddTag}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setAdding(false);
                  setNewTag('');
                }
              }}
            />
          ) : (
            <AntTag style={{ cursor: 'pointer' }}>
              + 添加标签
            </AntTag>
          )}
        </div>
        {tags.map((t) => (
          <AntTag
            key={t.name}
            onClick={() => toggleTag(t.name)}
            style={{ cursor: 'pointer' }}
          >
            {t.name}
            <span className="tag-count-badge">{t.count}</span>
          </AntTag>
        ))}
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      overlayClassName="tag-popover-overlay"
    >
      <Badge count={value.length} size="small" offset={[-4, 4]}>
        <Button icon={<TagsOutlined />} className="toolbar-tag-btn" />
      </Badge>
    </Popover>
  );
}
