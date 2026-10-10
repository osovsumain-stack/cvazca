import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Tag as TagIcon, Clock, Check, ArrowRight } from 'lucide-react';
import { advertisingRepository, projectDraftSourceRepository, mediaPlanRepository } from '@/repositories/featureRepositories';
import type { AdvertisingPlacement } from '@/types/platform';
import { Badge, Button, PageHeader } from '@/components/ui';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import type { ReactNode } from 'react';

export function AdvertisingDetailPage({ layout = 'platform' }: { layout?: 'platform' | 'none' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [placement, setPlacement] = useState<AdvertisingPlacement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    advertisingRepository.getById(id).then((p) => { setPlacement(p); setLoading(false); });
  }, [id]);

  if (loading) return layout === 'platform' ? <PlatformLayout><div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div></PlatformLayout> : <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  if (!placement) return layout === 'platform' ? <PlatformLayout><div className="dashboard-page"><div className="dashboard-body"><p>Размещение не найдено</p></div></div></PlatformLayout> : <div className="dashboard-page"><div className="dashboard-body"><p>Размещение не найдено</p></div></div>;

  const content: ReactNode = (
    <div className="dashboard-page">
      <div className="dashboard-body" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(layout === 'platform' ? '/advertising' : '/business/advertising')}>Назад к каталогу</Button>
          <PageHeader title={placement.name} subtitle={placement.operatorName || placement.providerName} />
          {placement.sourceUrl && <a className="text-link" href={placement.sourceUrl} target="_blank" rel="noopener noreferrer" style={{marginBottom:20}}>Открыть сообщество VK ↗</a>}
          {placement.audience && <p className="field-hint" style={{marginBottom:20}}>{placement.audience}</p>}
          {placement.priceNote && <p className="field-hint" style={{marginBottom:20}}>{placement.priceNote}</p>}

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <Badge color="blue">{placement.format}</Badge>
            <Badge color="gray"><MapPin size={12} /> {placement.city}</Badge>
            <Badge color="gray"><Clock size={12} /> {placement.period}</Badge>
            {placement.isAvailable ? <Badge color="green">Доступно</Badge> : <Badge color="red">Занято</Badge>}
          </div>

          <div className="platform-card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Описание</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink)' }}>{placement.description}</p>
          </div>

          <div className="platform-card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Требования к макетам</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {placement.requirements.map((r, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 8 }}>
                  <Check size={16} style={{ color: 'var(--green, #16a34a)' }} /> {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="platform-card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Стоимость</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Базовая стоимость</span>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{placement.basePrice.toLocaleString('ru-RU')} ₽</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Провайдер: <strong style={{ color: 'var(--ink)' }}>{placement.providerName}</strong>
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              Пилотная стоимость размещения. Даты, материалы и итоговая смета подтверждаются после согласования. Автоматическая комиссия за ведение таргетированной рекламы к постам и историям не добавляется.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button variant="primary" icon={<ArrowRight size={18} />} onClick={async () => {
              await projectDraftSourceRepository.set({ type: 'advertising', sourceId: placement.id, sourceName: placement.name, providerName: placement.providerName, format: placement.format, basePrice: placement.basePrice });
              navigate('/business/projects/new');
            }}>Добавить в проект</Button>
            <Button variant="ghost" onClick={async () => {
              await mediaPlanRepository.add({ placementId: placement.id, name: placement.name, providerName: placement.providerName, format: placement.format, basePrice: placement.basePrice });
              navigate(layout === 'platform' ? '/advertising' : '/business/advertising/plan');
            }}>Добавить в медиаплан</Button>
          </div>
        </div>
      </div>
  );
  return layout === 'platform' ? <PlatformLayout>{content}</PlatformLayout> : content;
}
