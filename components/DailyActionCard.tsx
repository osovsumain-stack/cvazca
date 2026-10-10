import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Flame, ArrowRight, Check } from 'lucide-react';
import { getDailyAction, markDailyActionComplete, isActionCompletedToday, getStreak, type StreakState } from '@/services/dailyActionService';

export function DailyActionCard() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(false);
  const [streak, setStreak] = useState<StreakState | null>(null);
  const action = getDailyAction();

  useEffect(() => {
    setCompleted(isActionCompletedToday());
    setStreak(getStreak());
  }, []);

  const handleComplete = () => {
    const newState = markDailyActionComplete();
    setStreak(newState);
    setCompleted(true);
  };

  return (
    <div style={{
      padding: '20px 24px',
      borderRadius: 18,
      background: 'var(--glass)',
      border: '1px solid var(--glass-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: completed ? 'rgba(34,197,94,0.1)' : 'rgba(25,181,254,0.1)', display: 'grid', placeItems: 'center', color: completed ? '#16a34a' : 'var(--blue)' }}>
          {completed ? <Check size={16} /> : <Target size={16} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Действие дня</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{action.title}</div>
        </div>
        {streak && streak.streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
            <Flame size={16} />
            {streak.streak}
          </div>
        )}
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 14px' }}>
        {action.description}
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        {!completed ? (
          <>
            <button className="platform-nav-btn primary" style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => navigate(action.route)}>
              {action.ctaLabel} <ArrowRight size={14} />
            </button>
            <button className="platform-nav-btn ghost" style={{ fontSize: 13, padding: '8px 14px' }} onClick={handleComplete}>
              <Check size={14} /> Выполнил
            </button>
          </>
        ) : (
          <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={16} /> Выполнено сегодня
          </div>
        )}
      </div>
    </div>
  );
}
