import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, ArrowRight, Info, TrendingUp, Wallet, AlertTriangle, Plus, X } from 'lucide-react';
import { useAuth } from '@/services/authContext';
import { useOrgScope } from '@/services/orgScopeContext';
import { projectDraftSourceRepository } from '@/repositories/featureRepositories';
import { rublesToKopecks, formatRubles, kopecksToRubles } from '@/services/projectPricingService';
import { quoteTargetAds, checkServiceConflict, SVYAZKA_SERVICES, buildPricingSnapshot, type BudgetInputMode, type ProjectPricingSnapshotOwnService } from '@/services/targetAdsPricingService';

export function BusinessBudgetCalculatorPage() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const { activeOrganization } = useOrgScope();
  const [budgetAmount, setBudgetAmount] = useState('100000');
  const [inputMode, setInputMode] = useState<BudgetInputMode>('net');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const result = useMemo(() => {
    const kopecks = rublesToKopecks(budgetAmount);
    return quoteTargetAds({ budgetKopecks: kopecks, inputMode });
  }, [budgetAmount, inputMode]);

  const ownServices: ProjectPricingSnapshotOwnService[] = useMemo(() => {
    return selectedServices.map(id => {
      const svc = SVYAZKA_SERVICES.find(s => s.id === id)!;
      return {
        serviceId: svc.id,
        label: svc.label,
        priceKopecks: svc.pricing.amountKopecks ?? 0,
        priceType: svc.pricing.type,
      };
    });
  }, [selectedServices]);

  const snapshot = useMemo(() => {
    return buildPricingSnapshot({ quote: result, ownServices });
  }, [result, ownServices]);

  const handleCreateProject = async () => {
    if (!account) {
      navigate('/auth', { state: { from: '/business' } });
      return;
    }
    if (!activeOrganization) {
      navigate('/business/organizations/new');
      return;
    }
    await projectDraftSourceRepository.set({
      type: 'target_ads',
      sourceId: null,
      sourceName: 'Бюджет из конструктора',
      providerName: null,
      format: null,
      basePrice: kopecksToRubles(result.adGrossKopecks),
      placementSubtotal: kopecksToRubles(snapshot.advertisingExpensesKopecks),
      platformFee: kopecksToRubles(result.managementFeeKopecks),
      totalAmount: kopecksToRubles(snapshot.totalPlanKopecks),
      placements: null,
      providerBreakdown: null,
      category: JSON.stringify({budgetKopecks:result.adNetKopecks,inputMode:'net',serviceIds:selectedServices}),
    });
    navigate('/business/projects/new');
  };

  const advertisingRows = [
    { label: 'Бюджет без НДС', value: result.adNetKopecks, hint: 'Сумма до начисления НДС площадки' },
    { label: 'НДС рекламной площадки (22%)', value: result.adVatKopecks, hint: 'НДС площадки, не СВЯЗКИ' },
    { label: 'На рекламную площадку (с НДС)', value: result.adGrossKopecks, hint: 'Бюджет с НДС — оплачивается площадке' },
  ];

  const servicesRows = [
    { label: 'Ведение рекламы (20% от бюджета без НДС)', value: result.managementFeeKopecks, hint: 'Оплата работы СВЯЗКИ' },
    ...ownServices.map(s => ({ label: s.label, value: s.priceKopecks, hint: 'Собственная услуга СВЯЗКИ' })),
  ];

  const availableServices = SVYAZKA_SERVICES.filter(s => s.pricing.type === 'fixed');
  const conflict = checkServiceConflict({ hasFixedPackage: false, hasPercentManagement: true, scope: 'target-ads' });

  return (
    <div className="dashboard-page">
      <div className="dashboard-body" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="platform-path-icon business" style={{ width: 44, height: 44 }}><Calculator size={20} /></div>
            <div>
              <h1>Конструктор бюджета</h1>
              <p>Рассчитайте стоимость рекламы: бюджет площадки с НДС и отдельно оплата ведения</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Параметры</h3>

            <label>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Бюджет на рекламу (₽)</span>
              <input className="form-input" type="number" min="0" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
            </label>

            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Сумма указана:</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setInputMode('net')}
                  style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: inputMode === 'net' ? '2px solid var(--blue)' : '1px solid var(--line)', background: inputMode === 'net' ? 'rgba(25,181,254,0.06)' : 'var(--card)', cursor: 'pointer' }}
                >Без НДС</button>
                <button
                  onClick={() => setInputMode('gross')}
                  style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: inputMode === 'gross' ? '2px solid var(--blue)' : '1px solid var(--line)', background: inputMode === 'gross' ? 'rgba(25,181,254,0.06)' : 'var(--card)', cursor: 'pointer' }}
                >С НДС</button>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Услуги СВЯЗКИ:</span>
              {availableServices.map(svc => (
                <label key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(svc.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedServices([...selectedServices, svc.id]);
                      else setSelectedServices(selectedServices.filter(id => id !== svc.id));
                    }}
                  />
                  <span style={{ fontSize: 13 }}>{svc.label} — {svc.pricing.amountKopecks ? formatRubles(svc.pricing.amountKopecks) : ''} ₽</span>
                </label>
              ))}
            </div>

            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                Ведение рекламы — 20% от рекламного бюджета без НДС.<br />
                НДС 22% — налог рекламной площадки, не СВЯЗКИ.<br />
                На собственные услуги СВЯЗКИ комиссия 26% не начисляется.<br />
                Версия расчёта: {result.pricingVersion}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Расчёт</h3>

            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Рекламные расходы</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {advertisingRows.map((r) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.hint}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{formatRubles(r.value)} ₽</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Услуги СВЯЗКИ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {servicesRows.map((r) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.hint}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{formatRubles(r.value)} ₽</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Итоги</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Рекламные расходы</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{formatRubles(snapshot.advertisingExpensesKopecks)} ₽</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Услуги СВЯЗКИ</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{formatRubles(result.managementFeeKopecks + snapshot.ownServicesSubtotalKopecks)} ₽</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 12, background: 'rgba(8,104,247,0.06)', border: '1px solid rgba(8,104,247,0.2)', marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Wallet size={18} style={{ color: 'var(--blue)' }} />
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Общий план</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: 'var(--blue)' }}>{formatRubles(snapshot.totalPlanKopecks)} ₽</span>
              </div>
            </div>
          </div>
        </div>

        {conflict.status === 'needs_review' && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', fontSize: 13, color: '#d97706' }}>
            <AlertTriangle size={16} />
            {conflict.reason}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'center' }}>
          <button className="platform-nav-btn primary" onClick={handleCreateProject}>
            <TrendingUp size={16} /> Создать проект с этим бюджетом <ArrowRight size={16} />
          </button>
        </div>

        <div style={{ marginTop: 24, padding: '16px 20px', borderRadius: 12, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info size={16} style={{ color: 'var(--muted)', marginTop: 2 }} />
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
            Бюджет площадки и оплата ведения — раздельные строки. Ведение рекламы — 20% от рекламного бюджета без НДС. НДС 22% — налог рекламной площадки. На собственные услуги СВЯЗКИ комиссия 26% не начисляется. Расчёт носит предварительный характер и не является публичной офертой.
          </p>
        </div>
      </div>
    </div>
  );
}
