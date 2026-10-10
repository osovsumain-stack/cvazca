import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, MapPin, Tag as TagIcon, Clock, Eye, ArrowRight, ImageIcon } from 'lucide-react';
import { advertisingRepository } from '@/repositories/featureRepositories';
import type { AdvertisingPlacement, AdvertisingCategory } from '@/types/platform';
import { Badge, SearchInput, PageHeader, Card } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import type { ReactNode } from 'react';

const CATEGORY_LABELS: Record<AdvertisingCategory, string> = {
  outdoor: 'Наружная реклама', mall_indoor: 'ТРЦ и Indoor', business_centers: 'Бизнес-центры',
  transport: 'Транспорт', elevators: 'Лифты', print: 'Печатная реклама',
  promo: 'Промо', internet: 'Интернет', vk: 'VK', telegram: 'Telegram',
  bloggers: 'Блогеры', media: 'СМИ', radio: 'Радио', events: 'Мероприятия',
};

const CATEGORY_GRADIENTS: Record<AdvertisingCategory, string> = {
  outdoor: 'linear-gradient(135deg, #1e3a5f, #2d6a9f)',
  mall_indoor: 'linear-gradient(135deg, #4a3a6b, #7c5ca8)',
  business_centers: 'linear-gradient(135deg, #2d4a3e, #4a8a6e)',
  transport: 'linear-gradient(135deg, #5a3a2d, #9a6a4e)',
  elevators: 'linear-gradient(135deg, #3a3a5a, #6a6a9a)',
  print: 'linear-gradient(135deg, #5a4a2d, #9a8a5e)',
  promo: 'linear-gradient(135deg, #5a2d4a, #9a5e8a)',
  internet: 'linear-gradient(135deg, #2d4a5a, #5e8a9a)',
  vk: 'linear-gradient(135deg, #2d5a7f, #4a8abf)',
  telegram: 'linear-gradient(135deg, #2d5a7f, #3a8acf)',
  bloggers: 'linear-gradient(135deg, #5a2d5a, #8a4a8a)',
  media: 'linear-gradient(135deg, #3a4a5a, #6a7a8a)',
  radio: 'linear-gradient(135deg, #4a3a5a, #7a6a8a)',
  events: 'linear-gradient(135deg, #5a4a3a, #9a7a5a)',
};

export function AdvertisingCatalogPage({ layout = 'platform' }: { layout?: 'platform' | 'none' }) {
  const navigate = useNavigate();
  const [placements, setPlacements] = useState<AdvertisingPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<AdvertisingCategory | 'all'>('all');
  const [city, setCity] = useState<string>('all');

  useEffect(() => {
    advertisingRepository.getAll().then((p) => { setPlacements(p); setLoading(false); });
  }, []);

  const cities = useMemo(() => {
    const set = new Set(placements.map((p) => p.city));
    return Array.from(set).sort();
  }, [placements]);

  const filtered = useMemo(() => {
    return placements.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (city !== 'all' && p.city !== city) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.providerName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [placements, search, category, city]);

  const content: ReactNode = (
      <div className="dashboard-page">
        <div className="dashboard-body" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <PageHeader title="Рекламный каталог" subtitle="Посты, истории и интеграции · ИП Шелопугин Никита Матвеевич" />

          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Поиск по названию, провайдеру..." />
            <select className="form-input" style={{ maxWidth: 200 }} value={category} onChange={(e) => setCategory(e.target.value as AdvertisingCategory | 'all')}>
              <option value="all">Все категории</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="form-input" style={{ maxWidth: 180 }} value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="all">Все города</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {loading ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Загрузка...</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Megaphone size={32} />} title="Ничего не найдено" description="Попробуйте изменить фильтры" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filtered.map((p) => (
                <Card key={p.id} onClick={() => navigate(layout === 'platform' ? `/advertising/${p.id}` : `/business/advertising/${p.id}`)} style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
                  <div className="ad-image-zone" style={{ background: p.imageUrl ? undefined : CATEGORY_GRADIENTS[p.category] }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} />
                    ) : (
                      <div className="ad-image-zone-placeholder">
                        <ImageIcon size={32} style={{ color: 'rgba(255,255,255,0.5)' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Badge color="blue">{CATEGORY_LABELS[p.category]}</Badge>
                      <span className="demo-badge">Пилотный прайс</span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</h3>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: 'var(--muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {p.city}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><TagIcon size={14} /> {p.format}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {p.period}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, flex: 1 }}>{p.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>от</span>
                        <span style={{ fontSize: 18, fontWeight: 700, marginLeft: 4 }}>{p.basePrice.toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Подробнее <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 24, textAlign: 'center' }}>
            Пилотные предложения ИП Шелопугина Никиты Матвеевича. Даты, стоимость и условия размещения подтверждаются после заявки; для ВГУ требуется редакционное согласование.
          </p>
        </div>
      </div>
  );
  return layout === 'platform' ? <PlatformLayout>{content}</PlatformLayout> : content;
}
