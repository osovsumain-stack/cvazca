import { Link, useLocation } from 'react-router-dom';
import { type ReactNode, useState } from 'react';
import { LayoutDashboard, Building2, Megaphone, FolderKanban, FileText, Users, Gem, Inbox, Wrench, ArrowLeft, Menu, X, Calculator, ChevronDown } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { ProductBrand } from '@/components/ProductBrand';
import { useOrgScope } from '@/services/orgScopeContext';

const navItems = [
  { to: '/business/dashboard', icon: <LayoutDashboard size={18} />, label: 'Дашборд' },
  { to: '/business/organizations', icon: <Building2 size={18} />, label: 'Организации' },
  { to: '/business/advertising', icon: <Megaphone size={18} />, label: 'Реклама' },
  { to: '/business/services', icon: <Wrench size={18} />, label: 'Услуги' },
  { to: '/business/projects', icon: <FolderKanban size={18} />, label: 'Проекты' },
  { to: '/business/calculator', icon: <Calculator size={18} />, label: 'Калькулятор' },
  { to: '/business/applications', icon: <Inbox size={18} />, label: 'Отклики' },
  { to: '/business/documents', icon: <FileText size={18} />, label: 'Документы' },
  { to: '/business/team', icon: <Users size={18} />, label: 'Команда' },
  { to: '/business/partnership', icon: <Gem size={18} />, label: 'Партнёрство' },
];

export function BusinessLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { activeOrganization, memberships, setActiveOrgId } = useOrgScope();
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);

  const orgSwitcher = memberships.length > 1 && activeOrganization ? (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOrgMenuOpen(!orgMenuOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', fontSize: 13, fontWeight: 600, maxWidth: 200 }}
      >
        <Building2 size={14} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{activeOrganization.shortName || activeOrganization.fullName}</span>
        <ChevronDown size={14} style={{ opacity: 0.5 }} />
      </button>
      {orgMenuOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 220, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--line)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', padding: 6, zIndex: 100 }}>
          {memberships.map((m) => (
            <button
              key={m.organizationId}
              onClick={() => { setActiveOrgId(m.organizationId); setOrgMenuOpen(false); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', background: m.organizationId === activeOrganization.id ? 'rgba(8,104,247,0.06)' : 'none', cursor: 'pointer', fontSize: 13, fontWeight: m.organizationId === activeOrganization.id ? 700 : 500, color: 'var(--ink)' }}
            >
              {m.role === 'owner' ? '★ ' : ''}{m.role}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="platform-page">
      <div className="bg-blobs" />
      <nav className="platform-nav">
        <div className="platform-nav-inner">
          <Link to="/" className="platform-logo">
            <ProductBrand variant="business" />
          </Link>
          <div className="platform-nav-links">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} style={{ fontWeight: location.pathname === item.to ? 800 : 600, color: location.pathname === item.to ? 'var(--blue)' : undefined, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
          {orgSwitcher}
          <Link to="/" className="platform-nav-btn ghost"><ArrowLeft size={16} /> На главную</Link>
          <NotificationBell to="/business/notifications" />
          <button className="platform-nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen && (
          <div className="platform-nav-mobile">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="platform-nav-mobile-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {item.icon} {item.label}
              </Link>
            ))}
            <Link to="/" onClick={() => setMenuOpen(false)} className="platform-nav-mobile-link" style={{ color: 'var(--blue)', fontWeight: 700 }}>
              ← На главную
            </Link>
          </div>
        )}
      </nav>
      <div className="platform-content">{children}</div>
    </div>
  );
}
