import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, ArrowRight, Clock, Wallet } from 'lucide-react';
import { serviceOfferingRepository } from '@/repositories/featureRepositories';
import type { ServiceOffering, ServiceCategory } from '@/types/platform';
import { Badge, SearchInput, PageHeader, Card } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import type { ReactNode } from 'react';

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  marketing: 'Маркетинг', targeted_ads: 'Таргет', context_ads: 'Контекст',
  design: 'Дизайн', branding: 'Брендинг', websites: 'Сайты',
  seo: 'SEO', content: 'Контент', video: 'Видео',
  ai_automation: 'AI-автоматизация', ai_agents: 'AI-агенты', hr_brand: 'HR-бренд',
};

export function ServicesCatalogPage({ layout = 'platform' }: { layout?: 'platform' | 'none' }) {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all');

  useEffect(() => {
    serviceOfferingRepository.getAll().then((s) => { setServices(s); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (category !== 'all' && s.category !== category) return false;
      if (search) return s.name.toLowerCase().includes(search.toLowerCase()) || s.shortDescription.toLowerCase().includes(search.toLowerCase());
      return true;
    });
  }, [services, search, category]);

  const content: ReactNode = (
      <div className="dashboard-page">
        <div className="dashboard-body" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <PageHeader title="Услуги СВЯЗКИ" subtitle="Профессиональные услуги для вашего бизнеса" />

          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Поиск услуги..." />
            <select className="form-input" style={{ maxWidth: 240 }} value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory | 'all')}>
              <option value="all">Все категории</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {loading ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Загрузка...</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Wrench size={32} />} title="Услуги не найдены" description="Попробуйте изменить фильтры" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filtered.map((s) => (
                <Card key={s.id} onClick={() => navigate(layout === 'platform' ? `/services/${s.id}` : `/business/services/${s.id}`)} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Badge color="blue">{CATEGORY_LABELS[s.category]}</Badge>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{s.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, flex: 1 }}>{s.shortDescription}</p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--muted)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Wallet size={14} /> {s.estimatedCost}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {s.estimatedDuration}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Подробнее <ArrowRight size={14} />
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 24, textAlign: 'center' }}>
            Финальная стоимость определяется после брифа и фиксируется в предложении/договоре. Указанные цены — ориентировочные.
          </p>
        </div>
      </div>
  );
  return layout === 'platform' ? <PlatformLayout>{content}</PlatformLayout> : content;
}
