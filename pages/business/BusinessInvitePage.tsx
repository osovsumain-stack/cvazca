import { apiRequest } from '@/repositories/transport';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Check, Building2, User, Shield } from 'lucide-react';
import { useAuth } from '@/services/authContext';
import { organizationInvitationRepository } from '@/repositories/featureRepositories';
import { organizationRepository as orgRepo, organizationMembershipRepository } from '@/repositories/mockRepositories';
import type { OrganizationInvitation, Organization } from '@/types/platform';
import { Button, PageHeader } from '@/components/ui';

export function BusinessInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { account } = useAuth();
  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      const inv = await organizationInvitationRepository.getByToken(token);
      setInvitation(inv);
      if (inv) {
        const o = await orgRepo.getById(inv.organizationId);
        setOrg(o);
      }
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!account || !invitation) return;
    setAccepting(true);
    setError('');
    try {
      await apiRequest('/api/invitations/accept', { token });
      window.dispatchEvent(new Event('svyazka:organizations-changed'));
      setAccepted(true);
    } catch {
      setError('Не удалось принять приглашение');
    }
    setAccepting(false);
  };

  if (loading) return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  if (!invitation) return <div className="dashboard-page"><div className="dashboard-body"><PageHeader title="Приглашение не найдено" subtitle="Ссылка недействительна или истекла" /><Button variant="primary" onClick={() => navigate('/')}>На главную</Button></div></div>;

  if (!account) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-body" style={{ maxWidth: 500, margin: '0 auto' }}>
          <PageHeader title="Приглашение в команду" subtitle={org?.shortName || org?.name} />
          <div className="platform-card" style={{ padding: 24, textAlign: 'center' }}>
            <Shield size={32} style={{ color: 'var(--blue)', marginBottom: 12 }} />
            <p style={{ marginBottom: 20 }}>Войдите в свой аккаунт, чтобы принять приглашение</p>
            <Link to="/auth" state={{from: `/business/invite/${token}`}} className="platform-nav-btn primary">Войти</Link>
          </div>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-body" style={{ maxWidth: 500, margin: '0 auto' }}>
          <div className="platform-card" style={{ padding: 24, textAlign: 'center' }}>
            <Check size={40} style={{ color: '#16a34a', marginBottom: 12 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Приглашение принято!</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Вы присоединились к «{org?.shortName || org?.name}»</p>
            <Link to="/business/dashboard" className="platform-nav-btn primary">Перейти в дашборд</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-body" style={{ maxWidth: 500, margin: '0 auto' }}>
        <PageHeader title="Приглашение в команду" />
        <div className="platform-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--blue)', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{org?.shortName || org?.name}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Организация</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--glass)', border: '1px solid var(--glass-border)', display: 'grid', placeItems: 'center' }}>
              <User size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{invitation.role}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Ваша роль</div>
            </div>
          </div>
          {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}
          <Button variant="primary" icon={<Check size={18} />} onClick={handleAccept} disabled={accepting}>
            {accepting ? 'Принятие...' : 'Принять приглашение'}
          </Button>
        </div>
      </div>
    </div>
  );
}
