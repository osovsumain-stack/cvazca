import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Wallet, Users, Target } from 'lucide-react';
import { serviceOfferingRepository, projectDraftSourceRepository } from '@/repositories/featureRepositories';
import type { ServiceOffering } from '@/types/platform';
import { Badge, Button, PageHeader } from '@/components/ui';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { useAuth } from '@/services/authContext';
import { saveAuthOrigin } from '@/services/vkAuthService';
import type { ReactNode } from 'react';

export function ServiceDetailPage({ layout = 'platform' }: { layout?: 'platform' | 'none' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [service, setService] = useState<ServiceOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    serviceOfferingRepository.getById(id).then((s) => { setService(s); setLoading(false); });
  }, [id]);

  if (loading) return layout === 'platform' ? <PlatformLayout><div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div></PlatformLayout> : <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  if (!service) return layout === 'platform' ? <PlatformLayout><div className="dashboard-page"><div className="dashboard-body"><p>Услуга не найдена</p></div></div></PlatformLayout> : <div className="dashboard-page"><div className="dashboard-body"><p>Услуга не найдена</p></div></div>;

  const content: ReactNode = (
    <div className="dashboard-page">
      <div className="dashboard-body" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(layout === 'platform' ? '/services' : '/business/services')}>Назад к каталогу</Button>
          <PageHeader title={service.name} subtitle={service.shortDescription} />

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <Badge color="blue"><Target size={12} /> {service.format}</Badge>
            <Badge color="gray"><Wallet size={12} /> ориентировочно {service.estimatedCost}</Badge>
            <Badge color="gray"><Clock size={12} /> {service.estimatedDuration}</Badge>
          </div>

          <div className="platform-card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Описание</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>{service.description}</p>
          </div>

          <div className="platform-card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Что входит</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {service.whatIsIncluded.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 8 }}>
                  <Check size={16} style={{ color: '#16a34a' }} /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="platform-card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} /> Для кого</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {service.forWhom.map((item, i) => <Badge key={i} color="gray">{item}</Badge>)}
            </div>
          </div>

          <div className="platform-card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Этапы работы</h3>
            {service.stages.map((stage, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{stage.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{stage.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="platform-card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Что вы получите</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {service.whatYouGet.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 8 }}>
                  <Check size={16} style={{ color: '#16a34a' }} /> {item}
                </li>
              ))}
            </ul>
          </div>

          {service.faq.length > 0 && (
            <div className="platform-card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>FAQ</h3>
              {service.faq.map((f, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{f.question}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{f.answer}</div>
                </div>
              ))}
            </div>
          )}

          <div className="platform-card" style={{ padding: 24, marginBottom: 20, background: 'rgba(0,0,0,0.02)' }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
              Финальная стоимость определяется после брифа и фиксируется в предложении/договоре. Указанные цены — ориентировочные и не являются публичной офертой. СВЯЗКА не гарантирует конкретный ROI или результат, если он зависит от внешних факторов.
            </p>
          </div>

          <Button variant="primary" disabled={ordering} onClick={async () => {
            if (!service) return;
            setOrdering(true);
            setOrderError(null);
            try {
              await projectDraftSourceRepository.set({
                type: 'service',
                sourceId: service.id,
                sourceName: service.name,
                category: service.category,
                providerName: null,
                format: service.format,
                basePrice: null,
              });
              if (!isAuthenticated) {
                saveAuthOrigin('business');
                navigate('/auth', { state: { from: '/business/projects/new' } });
                return;
              }
              navigate('/business/projects/new');
            } catch (err) {
              setOrderError('Не удалось сохранить выбранную услугу. Попробуйте ещё раз.');
              setOrdering(false);
            }
          }}>{ordering ? 'Сохранение...' : 'Заказать услугу'}</Button>
          {orderError && (
            <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 13, color: '#ef4444' }}>
              {orderError}
            </div>
          )}
        </div>
      </div>
  );
  return layout === 'platform' ? <PlatformLayout>{content}</PlatformLayout> : content;
}
