import { type ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ChevronLeft } from 'lucide-react';

export const spring = { type: 'spring' as const, stiffness: 260, damping: 26 };
export const springSoft = { type: 'spring' as const, stiffness: 180, damping: 20 };
export const pageVariants = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -24, scale: 0.98 },
};

export function StepShell({ children, eyebrow, title, subtitle }: { children: ReactNode; eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={spring} className="step-shell">
      <div className="step-header">
        {eyebrow && <motion.div className="step-eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>{eyebrow}</motion.div>}
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...spring }}>{title}</motion.h1>
        {subtitle && <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, ...spring }}>{subtitle}</motion.p>}
      </div>
      <div className="step-body">{children}</div>
    </motion.div>
  );
}

export function BigButton({ children, onClick, disabled, variant = 'primary', icon = <ArrowRight size={22} /> }: { children: ReactNode; onClick: () => void; disabled?: boolean; variant?: 'primary' | 'ghost'; icon?: ReactNode }) {
  return (
    <motion.button
      className={`big-button ${variant}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.03, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={spring}
    >
      {children}{icon}
    </motion.button>
  );
}

export function SelectableCard({ emoji, label, selected, onClick, sublabel }: { emoji: string; label: string; selected: boolean; onClick: () => void; sublabel?: string }) {
  return (
    <motion.button
      className={`sel-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
    >
      <span className="sel-emoji">{emoji}</span>
      <span className="sel-label">{label}</span>
      {sublabel && <span className="sel-sublabel">{sublabel}</span>}
      {selected && <motion.span className="sel-check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}><motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></motion.svg></motion.span>}
    </motion.button>
  );
}

export function FloatingEmoji({ emoji, className, delay = 0 }: { emoji: string; className: string; delay?: number }) {
  return (
    <motion.span className={`floating-emoji ${className}`} initial={{ opacity: 0, scale: 0, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay, ...spring }}>
      {emoji}
    </motion.span>
  );
}

export function ProgressDock({ percent, label }: { percent: number; label: string }) {
  return (
    <motion.div className="progress-dock" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, ...spring }}>
      <div className="dock-inner">
        <div className="dock-label">{label}</div>
        <div className="dock-bar-wrap">
          <motion.div className="dock-bar" initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
        </div>
        <div className="dock-percent">{percent}%</div>
      </div>
    </motion.div>
  );
}

export function TopRoadmap({ steps, currentIndex, onBack }: { steps: { id: string; label: string }[]; currentIndex: number; onBack: () => void }) {
  return (
    <motion.div className="top-roadmap" initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, ...spring }}>
      <div className="top-roadmap-inner">
        <div className="roadmap-track">
          {steps.map((s, i) => (
            <motion.div
              key={s.id}
              className={`roadmap-dot ${i === currentIndex ? 'active' : ''} ${i < currentIndex ? 'done' : ''}`}
              animate={i === currentIndex ? { scale: [1, 1.15, 1] } : {}}
              transition={i === currentIndex ? { duration: 2, repeat: Infinity } : {}}
            />
          ))}
        </div>
        <div className="roadmap-label">{steps[currentIndex]?.label || ''}</div>
        {currentIndex > 0 && (
          <button className="roadmap-back" onClick={onBack}>
            <ChevronLeft size={16} /><span>Назад</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function PraiseMessage({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <motion.div className="praise-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onDone}>
      <motion.div className="praise-card" initial={{ scale: 0.7, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={spring}>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>{message}</motion.p>
        <motion.button className="praise-continue" onClick={onDone} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Продолжить <ArrowUpRight size={18} /></motion.button>
      </motion.div>
      <FloatingEmoji emoji="✨" className="fe-1" delay={0.1} />
      <FloatingEmoji emoji="🎉" className="fe-2" delay={0.2} />
      <FloatingEmoji emoji="🚀" className="fe-3" delay={0.3} />
    </motion.div>
  );
}

export function TypewriterText({ text, speed = 30, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); onDone?.(); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onDone]);
  return <span>{displayed}<span className="cursor-blink">|</span></span>;
}

export function FormField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="form-field">
      <span className="form-label">{label}{required && <span className="form-req">*</span>}</span>
      {children}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      className="form-input"
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="form-grid">{children}</div>;
}

export function ChipToggle({ label, selected, onClick, emoji }: { label: string; selected: boolean; onClick: () => void; emoji?: string }) {
  return (
    <motion.button
      className={`chip ${selected ? 'selected' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={spring}
    >
      {emoji && <span className="chip-emoji">{emoji}</span>}
      <span>{label}</span>
    </motion.button>
  );
}

export function Slider({ value, min, max, step, onChange, format }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div className="slider-wrap">
      <input
        type="range"
        className="form-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="slider-value">{format ? format(value) : value}</span>
    </div>
  );
}

export function ProgressBar({ value, max, label, color }: { value: number; max: number; label: string; color?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="progress-row">
      <div className="progress-row-head"><span>{label}</span><strong>{pct}%</strong></div>
      <div className="progress-row-bar">
        <motion.div
          className="progress-row-fill"
          style={color ? { background: color } : undefined}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function BottomNav({ active, onChange, showResume }: { active: string; onChange: (tab: string) => void; showResume: boolean }) {
  const tabs = [
    { id: 'journey', label: 'Маршрут', icon: '🧭' },
    { id: 'vacancies', label: 'Вакансии', icon: '💼' },
    { id: 'resume', label: 'Резюме', icon: '📄' },
    { id: 'profile', label: 'Профиль', icon: '👤' },
  ];
  return (
    <div className="bottom-nav">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`bottom-nav-item ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="bn-icon">{t.icon}</span>
          <span className="bn-label">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
