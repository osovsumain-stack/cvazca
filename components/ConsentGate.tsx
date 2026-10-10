import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { REGISTRATION_CONSENT_ITEMS } from '@/services/consentService';

interface ConsentGateProps {
  children?: ReactNode;
  onAllRequiredAccepted: (accepted: { user_terms: boolean; personal_data: boolean; marketing: boolean }) => void;
}

export function ConsentGate({ children, onAllRequiredAccepted }: ConsentGateProps) {
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});

  const allRequiredAccepted = REGISTRATION_CONSENT_ITEMS
    .filter((item) => item.required)
    .every((item) => accepted[item.consentType] === true);

  const handleToggle = (consentType: string) => {
    const newAccepted = { ...accepted, [consentType]: !accepted[consentType] };
    setAccepted(newAccepted);
    onAllRequiredAccepted({
      user_terms: newAccepted['user_terms'] ?? false,
      personal_data: newAccepted['personal_data'] ?? false,
      marketing: newAccepted['marketing'] ?? false,
    });
  };

  return (
    <>
      <div className="consent-gate">
        {REGISTRATION_CONSENT_ITEMS.map((item) => (
          <label key={item.consentType} className="consent-checkbox-row">
            <input
              type="checkbox"
              checked={accepted[item.consentType] ?? false}
              onChange={() => handleToggle(item.consentType)}
            />
            <span className="consent-checkbox-mark" />
            <span className="consent-checkbox-label">
              <span className="consent-checkbox-text">
                {item.label}
                {!item.required && <span className="consent-optional"> (необязательно)</span>}
              </span>
              <Link to={`/legal/${item.documentSlug}`} target="_blank" className="consent-doc-link">
                открыть <ExternalLink size={11} />
              </Link>
            </span>
          </label>
        ))}
      </div>
      <div style={{ opacity: allRequiredAccepted ? 1 : 0.4, transition: 'opacity 0.2s', pointerEvents: allRequiredAccepted ? 'auto' : 'none' }}>
        {children}
      </div>
      {!allRequiredAccepted && (
        <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
          Отметьте обязательные согласия, чтобы продолжить вход
        </p>
      )}
    </>
  );
}
