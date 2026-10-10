// Target ads calculation core — VAT 22% + 20% management fee from NET (always).
// Pricing version: target-ads-v2-net20
// All amounts in integer kopecks. No float math, no double rounding.
// The existing 26% external placement (projectPricingService) is for LEGACY/HISTORICAL projects only.

const MAX_MONEY = BigInt(Number.MAX_SAFE_INTEGER);

function asMoney(value: number): bigint {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError('Ожидается неотрицательная сумма в целых копейках');
  }
  return BigInt(value);
}

function toSafeMoney(value: bigint): number {
  if (value < 0n || value > MAX_MONEY) throw new RangeError('Сумма вне диапазона');
  return Number(value);
}

function roundRatio(value: bigint, numerator: bigint, denominator: bigint): bigint {
  return (value * numerator + denominator / 2n) / denominator;
}

export const TARGET_ADS_PRICING_VERSION = 'target-ads-v2-net20';
export const VAT_RATE_BPS = 2200;
export const MANAGEMENT_RATE_BPS = 2000;

export const PRICING_CONFIG = {
  minimumManagementFeeEnabled: false,
  minimumManagementFeeKopecks: 0,
} as const;

export type BudgetInputMode = 'net' | 'gross';

export interface TargetAdsQuote {
  currency: 'RUB';
  pricingVersion: string;
  inputMode: BudgetInputMode;
  adNetKopecks: number;
  adVatKopecks: number;
  adGrossKopecks: number;
  managementRateBps: 2000;
  managementFeeBasis: 'net';
  managementFeeKopecks: number;
  minimumFeeApplied: boolean;
  totalPlanKopecks: number;
  createdAt: string;
}

export function quoteTargetAds(params: {
  budgetKopecks: number;
  inputMode: BudgetInputMode;
}): TargetAdsQuote {
  const { inputMode } = params;
  if (inputMode !== 'net' && inputMode !== 'gross') {
    throw new Error('Не указан режим ввода (net/gross)');
  }

  const budget = asMoney(params.budgetKopecks);
  let net: bigint, vat: bigint, gross: bigint;

  if (inputMode === 'net') {
    net = budget;
    vat = roundRatio(net, BigInt(VAT_RATE_BPS), 10000n);
    gross = net + vat;
  } else {
    gross = budget;
    net = roundRatio(gross, 10000n, 12200n);
    vat = gross - net;
  }

  const fee = roundRatio(net, BigInt(MANAGEMENT_RATE_BPS), 10000n);
  const minimumApplied = PRICING_CONFIG.minimumManagementFeeEnabled && fee < BigInt(PRICING_CONFIG.minimumManagementFeeKopecks);
  const finalFee = minimumApplied ? BigInt(PRICING_CONFIG.minimumManagementFeeKopecks) : fee;

  return {
    currency: 'RUB',
    pricingVersion: TARGET_ADS_PRICING_VERSION,
    inputMode,
    adNetKopecks: toSafeMoney(net),
    adVatKopecks: toSafeMoney(vat),
    adGrossKopecks: toSafeMoney(gross),
    managementRateBps: 2000,
    managementFeeBasis: 'net',
    managementFeeKopecks: toSafeMoney(finalFee),
    minimumFeeApplied: minimumApplied,
    totalPlanKopecks: toSafeMoney(gross + finalFee),
    createdAt: new Date().toISOString(),
  };
}

// ─── Revenue share calculation ───

export function revenueFeeKopecks(approvedRevenueKopecks: number, approvedRateBps: number): number {
  const revenue = asMoney(approvedRevenueKopecks);
  if (!Number.isInteger(approvedRateBps) || approvedRateBps < 0 || approvedRateBps > 10000) {
    throw new RangeError('Некорректная согласованная ставка');
  }
  return toSafeMoney(roundRatio(revenue, BigInt(approvedRateBps), 10000n));
}

// ─── Service conflict detection (fixed + percent on same scope) ───

export type ServiceConflictStatus = 'ok' | 'needs_review';

export interface ConflictCheckResult {
  status: ServiceConflictStatus;
  reason: string | null;
}

export function checkServiceConflict(params: {
  hasFixedPackage: boolean;
  hasPercentManagement: boolean;
  scope: string;
}): ConflictCheckResult {
  if (params.hasFixedPackage && params.hasPercentManagement) {
    return {
      status: 'needs_review',
      reason: `Совпадающие услуги фиксированного пакета и процентного ведения на scope "${params.scope}" — требуется ручное согласование.`,
    };
  }
  return { status: 'ok', reason: null };
}

// ─── Service offering pricing model ───

export interface ServicePricing {
  type: 'fixed' | 'from' | 'percent_ad_net' | 'custom';
  amountKopecks?: number;
  rateBps?: number;
  minimumEnabled?: boolean;
  minimumKopecks?: number;
}

export interface ServiceOffering {
  id: string;
  label: string;
  description: string;
  pricing: ServicePricing;
}

export const SVYAZKA_SERVICES: ServiceOffering[] = [
  {
    id: 'target-ads-vk',
    label: 'Ведение таргетированной рекламы VK',
    description: '20% от рекламного бюджета без НДС',
    pricing: { type: 'percent_ad_net', rateBps: 2000, minimumEnabled: false, minimumKopecks: 0 },
  },
  {
    id: 'target-ads-context',
    label: 'Ведение контекстной рекламы',
    description: '20% от рекламного бюджета без НДС',
    pricing: { type: 'percent_ad_net', rateBps: 2000, minimumEnabled: false, minimumKopecks: 0 },
  },
  {
    id: 'content-package',
    label: 'Контент-пакет',
    description: 'Фиксированная месячная услуга — 35 000 ₽',
    pricing: { type: 'fixed', amountKopecks: 3_500_000 },
  },
  {
    id: 'design',
    label: 'Дизайн',
    description: 'Стоимость зависит от объёма работ',
    pricing: { type: 'custom' },
  },
  {
    id: 'website',
    label: 'Сайт',
    description: 'Стоимость зависит от объёма работ',
    pricing: { type: 'custom' },
  },
  {
    id: 'ai-integration',
    label: 'ИИ-интеграции',
    description: 'Стоимость зависит от объёма работ',
    pricing: { type: 'custom' },
  },
];

// ─── Project pricing snapshot ───

export interface ProjectPricingSnapshotOwnService {
  serviceId?: string;
  label: string;
  priceKopecks: number;
  priceType: string;
}

export interface ProjectPricingSnapshot {
  pricingVersion: string;
  createdAt: string;
  advertising?: {
    inputMode: BudgetInputMode;
    netKopecks: number;
    vatKopecks: number;
    grossKopecks: number;
    managementRateBps: number;
    managementFeeKopecks: number;
  };
  ownServices: ProjectPricingSnapshotOwnService[];
  ownServicesSubtotalKopecks: number;
  advertisingExpensesKopecks: number;
  totalPlanKopecks: number;
  revenueShareProposal?: {
    rateBps: number;
    basis: 'revenue';
    status: 'proposed' | 'accepted' | 'rejected';
    includedInCurrentPlan: false;
  };
}

export function buildPricingSnapshot(params: {
  quote: TargetAdsQuote;
  ownServices: ProjectPricingSnapshotOwnService[];
  revenueShareProposal?: { rateBps: number; status: 'proposed' | 'accepted' | 'rejected' };
}): ProjectPricingSnapshot {
  const ownServicesSubtotal = params.ownServices.reduce((sum, s) => sum + s.priceKopecks, 0);
  return {
    pricingVersion: params.quote.pricingVersion,
    createdAt: new Date().toISOString(),
    advertising: {
      inputMode: params.quote.inputMode,
      netKopecks: params.quote.adNetKopecks,
      vatKopecks: params.quote.adVatKopecks,
      grossKopecks: params.quote.adGrossKopecks,
      managementRateBps: params.quote.managementRateBps,
      managementFeeKopecks: params.quote.managementFeeKopecks,
    },
    ownServices: params.ownServices,
    ownServicesSubtotalKopecks: ownServicesSubtotal,
    advertisingExpensesKopecks: params.quote.adGrossKopecks,
    totalPlanKopecks: params.quote.adGrossKopecks + params.quote.managementFeeKopecks + ownServicesSubtotal,
    revenueShareProposal: params.revenueShareProposal
      ? { ...params.revenueShareProposal, basis: 'revenue', includedInCurrentPlan: false }
      : undefined,
  };
}
