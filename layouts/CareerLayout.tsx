import { Link, useLocation } from 'react-router-dom';
import { type ReactNode, useState } from 'react';
import { User, FileText, Briefcase, ClipboardList, ClipboardCheck, Heart, Gem, ArrowLeft, Menu, X, Sparkles } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { ProductBrand } from '@/components/ProductBrand';

const navItems = [
  { to: '/career/profile', icon: <User size={18} />, label: 'Профиль' },
  { to: '/career/resumes', icon: <FileText size={18} />, label: 'Резюме' },
  { to: '/career/vacancies', icon: <Briefcase size={18} />, label: 'Вакансии' },
  { to: '/career/favorites', icon: <Heart size={18} />, label: 'Избранное' },
  { to: '/career/applications', icon: <ClipboardList size={18} />, label: 'Отклики' },
  { to: '/career/tests', icon: <ClipboardCheck size={18} />, label: 'Тесты' },
  { to: '/career/partnership', icon: <Gem size={18} />, label: 'Партнёрство' },
];

export function CareerLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="platform-page">
      <div className="bg-blobs" />
      <nav className="platform-nav">
        <div className="platform-nav-inner">
          <Link to="/" className="platform-logo">
            <ProductBrand variant="career" />
          </Link>
          <div className="platform-nav-links">
            <Link to="/career/onboarding" style={{ fontWeight: location.pathname === '/career/onboarding' ? 800 : 600, color: location.pathname === '/career/onboarding' ? 'var(--blue)' : undefined, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} /> Карьерный маршрут
            </Link>
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} style={{ fontWeight: location.pathname === item.to ? 800 : 600, color: location.pathname === item.to ? 'var(--blue)' : undefined, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
          <Link to="/" className="platform-nav-btn ghost"><ArrowLeft size={16} /> На главную</Link>
          <NotificationBell to="/career/notifications" />
          <button className="platform-nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen && (
          <div className="platform-nav-mobile">
            <Link to="/career/onboarding" onClick={() => setMenuOpen(false)} className="platform-nav-mobile-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} /> Карьерный маршрут
            </Link>
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
