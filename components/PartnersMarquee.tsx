import { useEffect, useState } from 'react';
import type { Partner, PartnerType } from '@/types/platform';
import { partnerRepository } from '@/repositories/featureRepositories';

interface PartnersMarqueeProps {
  filterTypes?: PartnerType[];
  title?: string;
  subtitle?: string;
}

export function PartnersMarquee({
  filterTypes,
  title = 'Партнёры',
  subtitle = 'Компании и организации, с которыми мы создаём решения',
}: PartnersMarqueeProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    partnerRepository.getActive().then((all) => {
      const filtered = filterTypes
        ? all.filter((p) => filterTypes.includes(p.type))
        : all;
      setPartners(filtered);
    });
  }, [filterTypes]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (partners.length === 0) return null;

  const renderPartner = (p: Partner, keySuffix: string, ariaHidden: boolean) => {
    const content = p.logoUrl ? (
      <img
        src={p.logoUrl}
        alt={ariaHidden ? '' : p.name}
        className="partner-logo"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          const img = e.currentTarget;
          img.style.display = 'none';
          const fallback = img.nextElementSibling;
          if (fallback) fallback.classList.remove('hidden');
        }}
      />
    ) : null;

    const fallback = (
      <span
        className={`partner-name-fallback ${p.logoUrl ? 'hidden' : ''}`}
        style={!p.logoUrl ? {} : undefined}
      >
        {p.name}
      </span>
    );

    return (
      <a
        key={`${p.id}-${keySuffix}`}
        href={p.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="partner-card"
        aria-label={ariaHidden ? undefined : `Открыть партнёра ${p.name}`}
        tabIndex={ariaHidden ? -1 : 0}
      >
        {content}
        {fallback}
      </a>
    );
  };

  const renderGroup = (keySuffix: string, ariaHidden: boolean) => (
    <div className="partners-group" aria-hidden={ariaHidden || undefined}>
      {partners.map((p) => renderPartner(p, keySuffix, ariaHidden))}
    </div>
  );

  return (
    <section className="partners-section">
      <div className="partners-header">
        <h2 className="partners-title">{title}</h2>
        {subtitle && <p className="partners-subtitle">{subtitle}</p>}
      </div>
      <div className="partners-marquee">
        {reducedMotion ? (
          <div className="partners-marquee-inner partners-marquee-inner--static">
            {renderGroup('s', false)}
          </div>
        ) : (
          <div className="partners-marquee-inner">
            {renderGroup('a', false)}
            {renderGroup('b', true)}
          </div>
        )}
      </div>
    </section>
  );
}
