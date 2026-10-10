export type ProductBrandVariant = 'platform' | 'business' | 'career' | 'admin';

const SUBTITLES: Record<ProductBrandVariant, string> = {
  platform: '',
  business: 'для бизнеса',
  career: 'для карьеры',
  admin: 'администрирование',
};

export function ProductBrand({ variant, to = '/' }: { variant: ProductBrandVariant; to?: string }) {
  const subtitle = SUBTITLES[variant];
  return (
    <span className="product-brand">
      <img src="/assets/svyazka-logo.webp" alt="" className="platform-logo-image" />
      <span className="product-brand-text">
        <span className="product-brand-name">СВЯЗКА</span>
        {subtitle && <span className="product-brand-sub">{subtitle}</span>}
      </span>
    </span>
  );
}
