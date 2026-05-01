import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Spin, Empty, Button, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { fetchMealList, type MealItem } from '../services/api';
import TagFilter from '../components/TagFilter';

const currentYear = new Date().getFullYear();
const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = String(currentYear - 2 + i);
  return { value: y, label: y };
});
YEAR_OPTIONS.unshift({ value: 'ALL', label: 'ALL' });

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const m = (i + 1).toString().padStart(2, '0');
  return { value: m, label: `${m}月` };
});
MONTH_OPTIONS.unshift({ value: 'ALL', label: 'ALL' });

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<MealItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [year, setYear] = useState(currentYear.toString());
  const [month, setMonth] = useState(currentMonth);
  const [tags, setTags] = useState<string[]>([]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMealList({ search, year, month, tags });
      setList(res.data.items);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [search, year, month, tags]);

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setSearch(searchText);
  };

  const handleYearChange = (val: string) => {
    setYear(val);
    setSearch(searchText);
  };

  const handleMonthChange = (val: string) => {
    setMonth(val);
    setSearch(searchText);
  };

  return (
    <div className="home-page">
      <div className="home-toolbar">
        <Input.Search
          placeholder="搜索餐单"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={handleSearch}
          className="toolbar-search"
        />
        <TagFilter value={tags} onChange={setTags} onSearch={loadList} />
        <Select
          value={year}
          onChange={handleYearChange}
          options={YEAR_OPTIONS}
          className="toolbar-year"
          popupMatchSelectWidth={false}
        />
        <Select
          value={month}
          onChange={handleMonthChange}
          options={MONTH_OPTIONS}
          className="toolbar-month"
          popupMatchSelectWidth={false}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          href="/create"
          className="toolbar-add-btn"
        />
      </div>

      <div className="meal-count">共 {loading ? '-' : list.length} 个餐单</div>

      <Spin spinning={loading}>
        {list.length === 0 ? (
          <Empty description="暂无餐单" className="meal-empty" />
        ) : (
          <ul className="meal-list">
            {list.map((item) => (
              <li key={item.id} className="meal-item" onClick={() => navigate(`/edit/${item.id}`)}>
                <div className="meal-header">
                  <span className="meal-name">{item.name}</span>
                  <span className="meal-time">{formatDate(item.ctime)}</span>
                </div>
                <ImageWithFallback src={item.images[0]} alt={item.name} />
                {item.tags && item.tags.length > 0 && (
                  <div className="meal-tags">
                    {item.tags.map((t) => (
                      <Tag key={t} color="blue" className="meal-tag">
                        {t}
                      </Tag>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Spin>

      {list.length > 0 && <div className="list-footer">^_^ 不能再往下滑啦~</div>}
    </div>
  );
}

const PLACEHOLDER_IMG = (() => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" fill="none">' +
    '<rect width="100%" height="100%" rx="8" fill="#f0f0f0"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
    'font-family="system-ui,sans-serif" font-size="14" fill="#999">照片加载失败</text></svg>';
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
})();

function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="meal-image">
      <img
        src={failed ? PLACEHOLDER_IMG : src}
        alt={alt}
        className={failed ? 'meal-cover meal-cover-placeholder' : 'meal-cover'}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function formatDate(raw: string) {
  try {
    const d = new Date(raw);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return raw;
  }
}
