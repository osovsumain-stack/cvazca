export const PLATFORM_FEE_BPS = 2600;
export const PRICING_VERSION = 'external-placement-v1';

function assertMoneyKopecks(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid money (kopecks): ${field} = ${value}`);
  }
  return value;
}

function safeFromBigInt(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Money overflow');
  }
  return Number(value);
}

export interface ExternalPlacementQuote {
  currency: 'RUB';
  pricingVersion: string;
  providerAmountKopecks: number;
  platformFeeGrossKopecks: number;
  platformDiscountKopecks: number;
  platformFeePayableKopecks: number;
  totalClientBudgetKopecks: number;
  createdAt: string;
}

export function quoteExternalPlacement(
  providerAmountKopecks: number,
  requestedDiscountKopecks = 0,
  policyDiscountLimitKopecks = 0,
): ExternalPlacementQuote {
  const provider = assertMoneyKopecks(providerAmountKopecks, 'providerAmount');
  const requested = assertMoneyKopecks(requestedDiscountKopecks, 'requestedDiscount');
  const limit = assertMoneyKopecks(policyDiscountLimitKopecks, 'policyLimit');
  const fee = safeFromBigInt(
    (BigInt(provider) * BigInt(PLATFORM_FEE_BPS) + 5000n) / 10000n,
  );
  const discount = Math.min(requested, limit, fee);
  const payable = fee - discount;
  const total = safeFromBigInt(BigInt(provider) + BigInt(payable));
  return {
    currency: 'RUB',
    pricingVersion: PRICING_VERSION,
    providerAmountKopecks: provider,
    platformFeeGrossKopecks: fee,
    platformDiscountKopecks: discount,
    platformFeePayableKopecks: payable,
    totalClientBudgetKopecks: total,
    createdAt: new Date().toISOString(),
  };
}

export function rublesToKopecks(rubles: string | number): number {
  const n = typeof rubles === 'number' ? rubles : parseFloat(String(rubles).replace(',', '.').replace(/\s/g, ''));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function kopecksToRubles(kopecks: number): number {
  return Math.round(kopecks) / 100;
}

export function formatRubles(kopecks: number): string {
  return kopecksToRubles(kopecks).toLocaleString('ru-RU');
}
