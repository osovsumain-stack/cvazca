import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Briefcase, Users, Building2, UserCog, LogOut, FolderKanban, Star, Menu, X } from 'lucide-react';
import { useAuth } from '@/services/authContext';
import { ProductBrand } from '@/components/ProductBrand';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { account, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menu = [
    { to: '/admin/vacancies', label: 'Вакансии', icon: <Briefcase size={18} /> },
    { to: '/admin/projects', label: 'Проекты', icon: <FolderKanban size={18} /> },
    { to: '/admin/users', label: 'Пользователи', icon: <Users size={18} /> },
    { to: '/admin/organizations', label: 'Организации', icon: <Building2 size={18} /> },
    { to: '/admin/partners', label: 'Партнёры', icon: <Star size={18} /> },
    { to: '/admin/admins', label: 'Администраторы', icon: <UserCog size={18} /> },
  ];

  const navContent = (
    <>
      <nav className="admin-nav">
        {menu.map((item) => {
          const active = location.pathname === item.to || (item.to === '/admin/vacancies' && location.pathname === '/admin');
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-nav-item ${active ? 'active' : ''}`}
              onClick={() => setDrawerOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="admin-sidebar-footer">
        {account && (
          <div className="admin-user-info">
            <span className="admin-user-name">{account.displayName}</span>
            <span className="admin-user-role">Администратор</span>
          </div>
        )}
        <button className="admin-logout" onClick={() => logout()}>
          <LogOut size={16} /> Выйти
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Shield size={22} style={{ color: 'var(--blue)' }} />
          <ProductBrand variant="admin" />
        </div>
        {navContent}
      </aside>

      <button className="admin-mobile-toggle" onClick={() => setDrawerOpen(!drawerOpen)} aria-label="Меню">
        {drawerOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {drawerOpen && <div className="admin-drawer-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={`admin-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="admin-drawer-header">
          <div className="admin-sidebar-brand">
            <Shield size={22} style={{ color: 'var(--blue)' }} />
            <ProductBrand variant="admin" />
          </div>
          <button onClick={() => setDrawerOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={20} />
          </button>
        </div>
        {navContent}
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
