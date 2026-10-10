import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { getTodayFortune, type FortunePrediction } from '@/data/fortunePredictions';
import { useAuth } from '@/services/authContext';

const CATEGORY_COLORS: Record<FortunePrediction['category'], string> = {
  career: '#0868F7',
  growth: '#16a34a',
  mindset: '#6366f1',
  opportunity: '#f59e0b',
  skill: '#0ea5e9',
};

const CATEGORY_LABELS: Record<FortunePrediction['category'], string> = {
  career: 'Карьера',
  growth: 'Рост',
  mindset: 'Мышление',
  opportunity: 'Возможность',
  skill: 'Навык',
};

export function DailyFortuneCookie() {
  const { account } = useAuth();
  const [fortune, setFortune] = useState<FortunePrediction | null>(null);

  useEffect(() => {
    setFortune(getTodayFortune(account?.id));
  }, [account?.id]);

  if (!fortune) return null;

  const color = CATEGORY_COLORS[fortune.category];
  const colorBg = color + '1a';
  const colorGlow = color + '18';

  return (
    <div className="fortune-cookie" style={{
      padding: '20px 24px',
      borderRadius: 18,
      background: 'var(--glass)',
      border: `1px solid var(--glass-border)`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${colorGlow}, transparent)`,
        opacity: 0.6,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: colorBg, display: 'grid', placeItems: 'center', color }}>
          <Sparkles size={16} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Предсказание дня</div>
          <span style={{ fontSize: 11, fontWeight: 600, color, padding: '2px 8px', borderRadius: 100, background: colorBg }}>{CATEGORY_LABELS[fortune.category]}</span>
        </div>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', margin: 0, position: 'relative' }}>
        {fortune.text}
      </p>
    </div>
  );
}
