import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, Briefcase, Sparkles, Gem, LogOut, Shield, Bell } from 'lucide-react';
import { useAuth } from '@/services/authContext';
import { ProductBrand } from '@/components/ProductBrand';

export function PlatformLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { account, isAuthenticated, roles, logout } = useAuth();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLinks = [
    { to: '/vacancies', label: 'Вакансии' },
    { to: '/companies', label: 'Компании' },
    { to: '/advertising', label: 'Реклама' },
    { to: '/services', label: 'Услуги' },
    { to: '/business', label: 'Бизнес' },
    { to: '/career', label: 'Карьера' },
    { to: '/legal', label: 'Правовая база' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <div className="platform-page">
      <div className="bg-blobs" />
      <nav className="platform-nav">
        <div className="platform-nav-inner">
          <Link to="/" className="platform-logo">
            <ProductBrand variant="platform" />
          </Link>
          <div className="platform-nav-links">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} style={{ fontWeight: isActive(link.to) ? 800 : 600, color: isActive(link.to) ? 'var(--blue)' : undefined }}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="platform-nav-cta">
            {isAuthenticated && account ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  className="platform-nav-avatar-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="Меню аккаунта"
                >
                  {account.avatarUrl ? (
                    <img src={account.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span className="platform-nav-avatar-fallback">{(account.displayName || '?')[0]}</span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.displayName}</span>
                  <ChevronDown size={14} style={{ opacity: 0.5 }} />
                </button>
                {dropdownOpen && (
                  <div className="platform-dropdown">
                    <Link to="/notifications" onClick={() => setDropdownOpen(false)} className="platform-dropdown-item">
                      <Bell size={15} /> Уведомления
                    </Link>
                    <Link to="/career/profile" onClick={() => setDropdownOpen(false)} className="platform-dropdown-item">
                      <User size={15} /> Профиль
                    </Link>
                    <Link to="/business/dashboard" onClick={() => setDropdownOpen(false)} className="platform-dropdown-item">
                      <Briefcase size={15} /> Для бизнеса
                    </Link>
                    <Link to="/career" onClick={() => setDropdownOpen(false)} className="platform-dropdown-item">
                      <Sparkles size={15} /> Для карьеры
                    </Link>
                    <Link to="/career/partnership" onClick={() => setDropdownOpen(false)} className="platform-dropdown-item">
                      <Gem size={15} /> Партнёрство
                    </Link>
                    {roles.includes('admin') && (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)} className="platform-dropdown-item">
                        <Shield size={15} /> Админ-панель
                      </Link>
                    )}
                    <div className="platform-dropdown-divider" />
                    <button onClick={handleLogout} className="platform-dropdown-item logout">
                      <LogOut size={15} /> Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="platform-nav-btn primary">Войти через VK</Link>
            )}
          </div>
          <button className="platform-nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen && (
          <div className="platform-nav-mobile">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="platform-nav-mobile-link">
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link to="/auth" onClick={() => setMenuOpen(false)} className="platform-nav-mobile-link" style={{ color: 'var(--blue)', fontWeight: 700 }}>
                Войти через VK
              </Link>
            )}
          </div>
        )}
      </nav>
      <div className="platform-content">{children}</div>
    </div>
  );
}
