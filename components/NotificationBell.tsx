import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationRepository } from '@/repositories/featureRepositories';
import { useAuth } from '@/services/authContext';

export function NotificationBell({ to }: { to: string }) {
  const { account } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!account) return;
    notificationRepository.getUnreadCount(account.id).then(setUnread);
    const interval = setInterval(() => {
      notificationRepository.getUnreadCount(account.id).then(setUnread);
    }, 30000);
    return () => clearInterval(interval);
  }, [account]);

  if (!account) return null;

  return (
    <Link to={to} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, color: 'var(--ink)', textDecoration: 'none' }}>
      <Bell size={20} />
      {unread > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8,
          background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
        }}>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
