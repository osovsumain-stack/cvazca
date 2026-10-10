import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { notificationRepository } from '@/repositories/featureRepositories';
import { useAuth } from '@/services/authContext';
import type { AppNotification } from '@/types/platform';
import { Button, PageHeader, Card } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';

export function NotificationsPage() {
  const { account } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    if (!account) return;
    const ns = await notificationRepository.getByAccount(account.id);
    setNotifications(ns);
    setUnreadCount(ns.filter((n) => !n.read).length);
    setLoading(false);
  };

  useEffect(() => { load(); }, [account]);

  const markRead = async (id: string) => {
    await notificationRepository.markRead(id);
    load();
  };
  const markAllRead = async () => {
    if (!account) return;
    await notificationRepository.markAllRead(account.id);
    load();
  };
  const remove = async (id: string) => {
    await notificationRepository.remove(id);
    load();
  };

  if (loading) return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-body" style={{ maxWidth: 800, margin: '0 auto' }}>
        <PageHeader
          title="Уведомления"
          subtitle={unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все уведомления прочитаны'}
          actions={unreadCount > 0 ? <Button variant="ghost" icon={<Check size={18} />} onClick={markAllRead}>Прочитать все</Button> : undefined}
        />

        {notifications.length === 0 ? (
          <EmptyState icon={<Bell size={32} />} title="Нет уведомлений" description="Здесь будут появляться важные события" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map((n) => (
              <Card key={n.id} style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start', opacity: n.read ? 0.7 : 1, borderLeft: n.read ? 'none' : '3px solid var(--blue)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: n.read ? 'var(--border)' : 'rgba(59,130,246,0.1)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Bell size={16} style={{ color: n.read ? 'var(--muted)' : 'var(--blue)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{n.message}</div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(n.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {!n.read && <button onClick={() => markRead(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={14} /> Прочитать</button>}
                    <button onClick={() => remove(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={14} /> Удалить</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
