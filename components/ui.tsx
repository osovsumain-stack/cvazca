import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, useEffect } from 'react';
import { X } from 'lucide-react';

// ─── Button ───

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', icon, loading, children, className = '', disabled, ...rest }: ButtonProps) {
  const base = 'platform-nav-btn';
  const variantClass = variant === 'primary' ? 'primary' : variant === 'ghost' ? 'ghost' : variant === 'danger' ? 'danger' : 'outline';
  const sizeStyle: React.CSSProperties = size === 'sm' ? { padding: '6px 14px', fontSize: 13 } : size === 'lg' ? { padding: '12px 28px', fontSize: 16 } : {};
  return (
    <button className={`${base} ${variantClass} ${className}`} style={sizeStyle} disabled={disabled || loading} {...rest}>
      {loading ? <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : icon}
      {children}
    </button>
  );
}

// ─── Input ───

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...rest }: InputProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>{label}</label>}
      <input className={`form-input ${className}`} style={error ? { borderColor: 'var(--error)' } : undefined} {...rest} />
      {error && <span style={{ fontSize: 12, color: 'var(--error)', marginTop: 4, display: 'block' }}>{error}</span>}
    </div>
  );
}

// ─── Textarea ───

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', ...rest }: TextareaProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>{label}</label>}
      <textarea className={`form-input ${className}`} {...rest} />
    </div>
  );
}

// ─── Select ───

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, className = '', children, ...rest }: SelectProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>{label}</label>}
      <select className={`form-input ${className}`} {...rest}>{children}</select>
    </div>
  );
}

// ─── Badge ───

type BadgeColor = 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'violet';

export function Badge({ children, color = 'gray' }: { children: ReactNode; color?: BadgeColor }) {
  const colors: Record<BadgeColor, string> = {
    blue: 'color: var(--blue); background: rgba(59,130,246,0.08);',
    green: 'color: #16a34a; background: rgba(22,163,74,0.08);',
    amber: 'color: #d97706; background: rgba(245,158,11,0.08);',
    red: 'color: #dc2626; background: rgba(220,38,38,0.08);',
    gray: 'color: var(--muted); background: rgba(100,116,139,0.08);',
    violet: 'color: #7c3aed; background: rgba(124,58,237,0.08);',
  };
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20, ...(colors[color] as unknown as React.CSSProperties) }}>{children}</span>;
}

// ─── StatusBadge ───

export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, BadgeColor> = {
    draft: 'gray', pending: 'amber', pending_moderation: 'amber', approved: 'green', published: 'green',
    active: 'green', verified: 'green', ready: 'green', signed: 'green', accepted: 'green',
    rejected: 'red', cancelled: 'red', expired: 'red', revoked: 'red', closed: 'gray',
    paused: 'amber', archived: 'gray', sent: 'blue', viewed: 'blue', interview: 'violet',
    offer: 'green', withdrawn: 'gray', calculated: 'blue', documents: 'blue',
    payment_pending: 'amber', paid: 'green', in_progress: 'blue', completed: 'green',
    invited: 'blue', needs_review: 'amber',
  };
  const labels: Record<string, string> = {
    draft: 'Черновик', pending: 'Ожидает', pending_moderation: 'На модерации', approved: 'Одобрено',
    published: 'Опубликована', active: 'Активен', verified: 'Подтверждён', ready: 'Готов',
    signed: 'Подписан', accepted: 'Принято', rejected: 'Отклонено', cancelled: 'Отменено',
    expired: 'Истёк', revoked: 'Отозван', closed: 'Закрыта', paused: 'Приостановлена',
    archived: 'В архиве', sent: 'Отправлено', viewed: 'Просмотрено', interview: 'Собеседование',
    offer: 'Оффер', withdrawn: 'Отозвано', calculated: 'Рассчитан', documents: 'Документы',
    payment_pending: 'Ожидает оплаты', paid: 'Оплачен', in_progress: 'В работе',
    completed: 'Завершён', invited: 'Приглашён', needs_review: 'На проверке',
  };
  return <Badge color={statusMap[status] ?? 'gray'}>{labels[status] ?? status}</Badge>;
}

// ─── Modal ───

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, title, children, maxWidth = 500 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, maxWidth, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'grid', placeItems: 'center', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        )}
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── ConfirmDialog ───

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Подтвердить', danger }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth={400}>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Отмена</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

// ─── Card ───

export function Card({ children, className = '', onClick, style }: { children: ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <div className={`platform-card ${className}`} style={{ cursor: onClick ? 'pointer' : undefined, ...style }} onClick={onClick}>
      {children}
    </div>
  );
}

// ─── Tabs ───

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '10px 16px', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
            background: 'none', border: 'none', cursor: 'pointer',
            color: active === tab.id ? 'var(--blue)' : 'var(--muted)',
            borderBottom: active === tab.id ? '2px solid var(--blue)' : '2px solid transparent',
            marginBottom: -2,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── SearchInput ───

export function SearchInput({ value, onChange, placeholder = 'Поиск...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="form-input"
      style={{ maxWidth: 320 }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

// ─── PageHeader ───

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--muted)', marginTop: 4, fontSize: 14 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
