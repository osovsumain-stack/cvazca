import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { PlatformLayout } from '@/layouts/PlatformLayout';

export function NotFoundPage() {
  return (
    <PlatformLayout>
      <div className="dashboard-page">
        <div className="dashboard-body" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: 'var(--blue)', marginBottom: 8 }}>404</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Страница не найдена</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 32 }}>Возможно, страница была перемещена или удалена.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/" className="platform-nav-btn primary"><Home size={18} /> На главную</Link>
            <button onClick={() => window.history.back()} className="platform-nav-btn ghost"><ArrowLeft size={18} /> Назад</button>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}

export function ForbiddenPage() {
  return (
    <PlatformLayout>
      <div className="dashboard-page">
        <div className="dashboard-body" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: '#dc2626', marginBottom: 8 }}>403</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Доступ запрещён</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 32 }}>У вас нет прав для просмотра этой страницы.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/" className="platform-nav-btn primary"><Home size={18} /> На главную</Link>
            <button onClick={() => window.history.back()} className="platform-nav-btn ghost"><ArrowLeft size={18} /> Назад</button>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}

export function ServerErrorPage() {
  return (
    <PlatformLayout>
      <div className="dashboard-page">
        <div className="dashboard-body" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: '#d97706', marginBottom: 8 }}>500</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Ошибка сервера</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 32 }}>Что-то пошло не так. Попробуйте позже.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/" className="platform-nav-btn primary"><Home size={18} /> На главную</Link>
            <button onClick={() => window.history.back()} className="platform-nav-btn ghost"><ArrowLeft size={18} /> Назад</button>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
