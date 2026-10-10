import type { CurrencyType, RewardRule } from '@/types/platform';

// ─── Reward Rules ───

export const rewardRules: RewardRule[] = [
  {
    id: 'diamond_business_referral',
    name: 'Business Referral Reward',
    currency: 'DIAMOND',
    sourceType: 'referral_business',
    triggerEvent: 'business_qualification',
    amount: 0, // calculated dynamically as 10% of platform fee
    maxRedemptionPercent: 30,
    active: true,
  },
  {
    id: 'emerald_career_referral',
    name: 'Career Referral Registration',
    currency: 'EMERALD',
    sourceType: 'referral_career',
    triggerEvent: 'career_registration',
    amount: 100,
    maxRedemptionPercent: 100,
    active: true,
  },
  {
    id: 'emerald_profile_70',
    name: 'Profile 70% Complete',
    currency: 'EMERALD',
    sourceType: 'milestone',
    triggerEvent: 'profile_70_percent',
    amount: 50,
    maxRedemptionPercent: 100,
    active: true,
  },
  {
    id: 'emerald_first_resume',
    name: 'First Resume Created',
    currency: 'EMERALD',
    sourceType: 'milestone',
    triggerEvent: 'first_resume',
    amount: 50,
    maxRedemptionPercent: 100,
    active: true,
  },
  {
    id: 'emerald_first_application',
    name: 'First Job Application',
    currency: 'EMERALD',
    sourceType: 'milestone',
    triggerEvent: 'first_application',
    amount: 100,
    maxRedemptionPercent: 100,
    active: true,
  },
];

// ─── Service redemption rates ───

export const redemptionRates: Record<string, number> = {
  platform_fee: 30,
  marketing_service: 20,
  design_service: 20,
  advertising_management: 20,
  website: 15,
  ai_service: 15,
  subscription: 30,
  provider_placement: 0,
  external_provider_service: 0,
};

// ─── Diamond Calculation ───
// New model: reward is calculated from actual Svyazka revenue (management fee + own services),
// NOT from a hardcoded 26% commission.
// Legacy transactions are NOT recalculated.

export interface DiamondCalculationInput {
  svyazkaRevenueKopecks: number;
  baseRewardPercent: number;
}

export interface DiamondCalculationResult {
  svyazkaRevenueKopecks: number;
  baseRewardPercent: number;
  calculatedDiamonds: number;
  breakdown: { label: string; value: number }[];
}

export function calculateDiamondReward(input: DiamondCalculationInput): DiamondCalculationResult {
  const { svyazkaRevenueKopecks, baseRewardPercent } = input;
  if (!Number.isSafeInteger(svyazkaRevenueKopecks) || svyazkaRevenueKopecks < 0) {
    throw new RangeError('Invalid svyazkaRevenueKopecks');
  }
  const rawReward = (svyazkaRevenueKopecks * baseRewardPercent) / 100;
  const calculatedDiamonds = Math.round(rawReward);
  return {
    svyazkaRevenueKopecks,
    baseRewardPercent,
    calculatedDiamonds,
    breakdown: [
      { label: 'Доход СВЯЗКИ (фактически оплачено)', value: svyazkaRevenueKopecks },
      { label: `Базовая награда (${baseRewardPercent}%)`, value: rawReward },
      { label: 'Начислено DIAMONDS', value: calculatedDiamonds },
    ],
  };
}

// ─── Emerald Calculation ───

export function calculateEmeraldReward(triggerEvent: string): number {
  const rule = rewardRules.find((r) => r.currency === 'EMERALD' && r.triggerEvent === triggerEvent && r.active);
  return rule?.amount ?? 0;
}

// ─── Redemption Calculation ───

export function calculateRedemption(serviceType: string, serviceCost: number, availableDiamonds: number): {
  maxDiscountPercent: number;
  maxDiscountRubles: number;
  diamondsNeeded: number;
  effectiveDiscount: number;
} {
  const maxPercent = redemptionRates[serviceType] ?? 0;
  const maxDiscountRubles = Math.round((serviceCost * maxPercent) / 100);
  const diamondsNeeded = Math.min(availableDiamonds, maxDiscountRubles);
  const effectiveDiscount = Math.min(diamondsNeeded, maxDiscountRubles);

  return {
    maxDiscountPercent: maxPercent,
    maxDiscountRubles,
    diamondsNeeded,
    effectiveDiscount,
  };
}

// ─── Fraud Check (demo logic) ───

export interface FraudCheckInput {
  referrerAccountId: string;
  referredAccountId: string;
  existingAccountIds: string[];
  existingInns: string[];
  organizationInn?: string;
  orderPaid: boolean;
  orderCancelled: boolean;
}

export interface FraudCheckResult {
  flagged: boolean;
  reason: string | null;
  severity: 'low' | 'medium' | 'high' | null;
}

export function checkReferralFraud(input: FraudCheckInput): FraudCheckResult {
  if (input.referrerAccountId === input.referredAccountId) {
    return { flagged: true, reason: 'self_referral', severity: 'high' };
  }
  if (input.existingAccountIds.includes(input.referredAccountId)) {
    return { flagged: true, reason: 'existing_account', severity: 'medium' };
  }
  if (input.organizationInn && input.existingInns.includes(input.organizationInn)) {
    return { flagged: true, reason: 'duplicate_inn', severity: 'high' };
  }
  if (input.orderCancelled) {
    return { flagged: true, reason: 'cancelled_order', severity: 'medium' };
  }
  if (!input.orderPaid) {
    return { flagged: true, reason: 'unpaid_order', severity: 'low' };
  }
  return { flagged: false, reason: null, severity: null };
}

// ─── Test functions (demo) ───

export function runRewardCalcTests(): { name: string; passed: boolean; detail: string }[] {
  const tests: { name: string; passed: boolean; detail: string }[] = [];

  // Test 1: Diamond calculation — new model (from actual Svyazka revenue)
  // Svyazka revenue = 20,000 ₽ (management fee from 100k net budget)
  // diamondReward = 10% of 20,000 = 2,000
  const test1 = calculateDiamondReward({
    svyazkaRevenueKopecks: 2_000_000,
    baseRewardPercent: 10,
  });
  tests.push({
    name: 'Diamond: 20k Svyazka revenue, 10% = 2000 diamonds',
    passed: test1.calculatedDiamonds === 2000,
    detail: `diamonds=${test1.calculatedDiamonds}`,
  });

  // Test 2: Emerald registration reward
  const test2 = calculateEmeraldReward('career_registration');
  tests.push({
    name: 'Emerald: registration = 100',
    passed: test2 === 100,
    detail: `Got ${test2}`,
  });

  // Test 3: Emerald milestone
  const test3 = calculateEmeraldReward('first_application');
  tests.push({
    name: 'Emerald: first application = 100',
    passed: test3 === 100,
    detail: `Got ${test3}`,
  });

  // Test 4: Redemption - marketing service 20%
  const test4 = calculateRedemption('marketing_service', 50000, 10000);
  tests.push({
    name: 'Redemption: marketing 50k, 20% max = 10k discount, 10k diamonds',
    passed: test4.maxDiscountRubles === 10000 && test4.effectiveDiscount === 10000,
    detail: `max=${test4.maxDiscountRubles}, effective=${test4.effectiveDiscount}`,
  });

  // Test 5: Redemption - provider_placement 0%
  const test5 = calculateRedemption('provider_placement', 50000, 10000);
  tests.push({
    name: 'Redemption: provider_placement = 0% (not allowed)',
    passed: test5.maxDiscountPercent === 0 && test5.effectiveDiscount === 0,
    detail: `percent=${test5.maxDiscountPercent}`,
  });

  // Test 6: Fraud - self referral
  const test6 = checkReferralFraud({
    referrerAccountId: 'acc-1',
    referredAccountId: 'acc-1',
    existingAccountIds: [],
    existingInns: [],
    orderPaid: true,
    orderCancelled: false,
  });
  tests.push({
    name: 'Fraud: self referral flagged',
    passed: test6.flagged && test6.reason === 'self_referral',
    detail: `flagged=${test6.flagged}, reason=${test6.reason}`,
  });

  // Test 7: Fraud - clean referral
  const test7 = checkReferralFraud({
    referrerAccountId: 'acc-1',
    referredAccountId: 'acc-2',
    existingAccountIds: [],
    existingInns: [],
    orderPaid: true,
    orderCancelled: false,
  });
  tests.push({
    name: 'Fraud: clean referral not flagged',
    passed: !test7.flagged,
    detail: `flagged=${test7.flagged}`,
  });

  return tests;
}
