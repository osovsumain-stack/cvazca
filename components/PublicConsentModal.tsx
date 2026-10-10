import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link as LinkIcon, X } from 'lucide-react';

export interface PublicConsentCategories {
  name: boolean;
  photo: boolean;
  city: boolean;
  education: boolean;
  experience: boolean;
  skills: boolean;
  careerGoal: boolean;
  phone: boolean;
  email: boolean;
  birthDate: boolean;
}

interface PublicConsentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (categories: PublicConsentCategories) => void;
  initialCategories?: Partial<PublicConsentCategories>;
}

const DEFAULT_CATEGORIES: PublicConsentCategories = {
  name: true,
  photo: true,
  city: true,
  education: true,
  experience: true,
  skills: true,
  careerGoal: true,
  phone: false,
  email: false,
  birthDate: false,
};

const CATEGORY_LABELS: { key: keyof PublicConsentCategories; label: string; defaultOn: boolean; sensitive: boolean }[] = [
  { key: 'name', label: 'Имя', defaultOn: true, sensitive: false },
  { key: 'photo', label: 'Фото', defaultOn: true, sensitive: false },
  { key: 'city', label: 'Город', defaultOn: true, sensitive: false },
  { key: 'education', label: 'Образование', defaultOn: true, sensitive: false },
  { key: 'experience', label: 'Опыт работы', defaultOn: true, sensitive: false },
  { key: 'skills', label: 'Навыки', defaultOn: true, sensitive: false },
  { key: 'careerGoal', label: 'Карьерная цель', defaultOn: true, sensitive: false },
  { key: 'phone', label: 'Телефон', defaultOn: false, sensitive: true },
  { key: 'email', label: 'Email', defaultOn: false, sensitive: true },
  { key: 'birthDate', label: 'Дата рождения', defaultOn: false, sensitive: true },
];

export function PublicConsentModal({ open, onClose, onConfirm, initialCategories }: PublicConsentModalProps) {
  const [categories, setCategories] = useState<PublicConsentCategories>({
    ...DEFAULT_CATEGORIES,
    ...initialCategories,
  });

  if (!open) return null;

  const toggle = (key: keyof PublicConsentCategories) => {
    setCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = () => {
    onConfirm(categories);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Согласие на распространение данных</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: 'var(--muted)' }}><X size={18} /></button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
          Отметьте, какие данные будут видны в публичном резюме. Телефон, email и дата рождения по умолчанию скрыты.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {CATEGORY_LABELS.map((cat) => (
            <label
              key={cat.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: 10,
                background: cat.sensitive ? 'rgba(245,158,11,0.04)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${cat.sensitive ? 'rgba(245,158,11,0.12)' : 'var(--line)'}`,
              }}
            >
              <input
                type="checkbox"
                checked={categories[cat.key]}
                onChange={() => toggle(cat.key)}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ flex: 1 }}>
                {cat.label}
                {cat.sensitive && <span style={{ fontSize: 11, color: '#d97706', marginLeft: 6 }}>— чувствительные данные</span>}
              </span>
            </label>
          ))}
        </div>

        <Link to="/legal/public-data-consent" target="_blank" style={{ color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 13, marginBottom: 16 }}>
          Открыть текст согласия <LinkIcon size={11} />
        </Link>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="platform-nav-btn ghost" onClick={onClose}>Отмена</button>
          <button className="platform-nav-btn primary" onClick={handleConfirm}>
            Подтвердить и опубликовать
          </button>
        </div>
      </div>
    </div>
  );
}
