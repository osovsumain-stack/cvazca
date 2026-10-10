import { quoteExternalPlacement, rublesToKopecks, kopecksToRubles, formatRubles } from './projectPricingService';
import { quoteTargetAds, revenueFeeKopecks, checkServiceConflict, buildPricingSnapshot, TARGET_ADS_PRICING_VERSION, SVYAZKA_SERVICES } from './targetAdsPricingService';

export function runMoneyInvariantTests(): { name: string; passed: boolean; detail: string }[] {
  const tests: { name: string; passed: boolean; detail: string }[] = [];

  // ─── Legacy 26% tests (historical, still valid for external-placement-v1) ───

  const k1 = rublesToKopecks('100000');
  tests.push({ name: '100 000 ₽ = 10 000 000 копеек', passed: k1 === 10_000_000, detail: `got ${k1}` });

  const k2 = rublesToKopecks('1234,56');
  tests.push({ name: '1 234,56 ₽ = 123 456 копеек (comma)', passed: k2 === 123_456, detail: `got ${k2}` });

  const q1 = quoteExternalPlacement(rublesToKopecks(100000));
  tests.push({
    name: 'Legacy: 100 000 ₽ → fee 26 000 ₽ → total 126 000 ₽',
    passed: q1.platformFeeGrossKopecks === 2_600_000 && q1.totalClientBudgetKopecks === 12_600_000,
    detail: `fee=${kopecksToRubles(q1.platformFeeGrossKopecks)}, total=${kopecksToRubles(q1.totalClientBudgetKopecks)}`,
  });

  tests.push({ name: 'Negative input → 0', passed: rublesToKopecks('-100') === 0, detail: '' });
  tests.push({ name: 'Empty input → 0', passed: rublesToKopecks('') === 0, detail: '' });
  tests.push({ name: 'NaN input → 0', passed: rublesToKopecks('abc') === 0, detail: '' });

  const k3 = rublesToKopecks(50000);
  const k3b = rublesToKopecks(kopecksToRubles(k3));
  tests.push({ name: 'Round-trip rubles→kopecks→rubles→kopecks is stable', passed: k3 === k3b, detail: `${k3} → ${k3b}` });

  // ─── Phase 2: CONTROL EXAMPLE — net 100 000 → fee 20 000 → total 142 000 ───

  const tq1 = quoteTargetAds({ budgetKopecks: 10_000_000, inputMode: 'net' });
  tests.push({
    name: 'CONTROL: net 100k → VAT 22k → gross 122k → fee 20k → total 142k',
    passed: tq1.adNetKopecks === 10_000_000 && tq1.adVatKopecks === 2_200_000 && tq1.adGrossKopecks === 12_200_000 && tq1.managementFeeKopecks === 2_000_000 && tq1.totalPlanKopecks === 14_200_000 && tq1.managementFeeBasis === 'net',
    detail: `net=${tq1.adNetKopecks}, vat=${tq1.adVatKopecks}, gross=${tq1.adGrossKopecks}, fee=${tq1.managementFeeKopecks}, total=${tq1.totalPlanKopecks}`,
  });

  // ─── Phase 3A: gross 122 000 → net 100 000 → fee 20 000 → total 142 000 ───

  const tq2 = quoteTargetAds({ budgetKopecks: 12_200_000, inputMode: 'gross' });
  tests.push({
    name: 'gross 122k → net 100k → VAT 22k → fee 20k → total 142k',
    passed: tq2.adNetKopecks === 10_000_000 && tq2.adVatKopecks === 2_200_000 && tq2.managementFeeKopecks === 2_000_000 && tq2.totalPlanKopecks === 14_200_000,
    detail: `net=${tq2.adNetKopecks}, vat=${tq2.adVatKopecks}, fee=${tq2.managementFeeKopecks}, total=${tq2.totalPlanKopecks}`,
  });

  // ─── Phase 3B: gross 100 000 → net 81 967.21 → fee 16 393.44 → total 116 393.44 ───

  const tq3 = quoteTargetAds({ budgetKopecks: 10_000_000, inputMode: 'gross' });
  tests.push({
    name: 'gross 100k → net 8196721 → VAT 1803279 → fee 1639344 → total 11639344',
    passed: tq3.adNetKopecks === 8_196_721 && tq3.adVatKopecks === 1_803_279 && tq3.managementFeeKopecks === 1_639_344 && tq3.totalPlanKopecks === 11_639_344,
    detail: `net=${tq3.adNetKopecks}, vat=${tq3.adVatKopecks}, fee=${tq3.managementFeeKopecks}, total=${tq3.totalPlanKopecks}`,
  });

  // ─── Phase 3C: net 100 000 + Content 35 000 → advertising 122 000, services 55 000, total 177 000 ───

  const contentService = SVYAZKA_SERVICES.find(s => s.id === 'content-package')!;
  const snapshot = buildPricingSnapshot({
    quote: tq1,
    ownServices: [{ serviceId: 'content-package', label: contentService.label, priceKopecks: 3_500_000, priceType: 'fixed' }],
  });
  tests.push({
    name: 'COMPLEX: net 100k + Content 35k → advertising 122k, services 55k (20k mgmt + 35k content), total 177k',
    passed: snapshot.advertisingExpensesKopecks === 12_200_000 && snapshot.ownServicesSubtotalKopecks === 3_500_000 && snapshot.advertising!.managementFeeKopecks === 2_000_000 && snapshot.totalPlanKopecks === 17_700_000,
    detail: `advertising=${snapshot.advertisingExpensesKopecks}, services=${snapshot.ownServicesSubtotalKopecks}, total=${snapshot.totalPlanKopecks}`,
  });

  // ─── Phase 3D: No 45k minimum ───

  tests.push({
    name: 'No 45k minimum in pricing config',
    passed: !SVYAZKA_SERVICES.some(s => s.id === 'promotion-package' || s.label.includes('45 000')),
    detail: SVYAZKA_SERVICES.map(s => s.id).join(', '),
  });

  // ─── Phase 3E: No automatic 70k ───

  tests.push({
    name: 'No automatic 70k package',
    passed: !SVYAZKA_SERVICES.some(s => s.id === 'strategy-package' || s.label.includes('70 000')),
    detail: SVYAZKA_SERVICES.map(s => s.id).join(', '),
  });

  // ─── Phase 3F: No additional 26% in target ads ───

  tests.push({
    name: 'Target ads fee is 20% of net, not 26%',
    passed: tq1.managementRateBps === 2000 && tq1.managementFeeBasis === 'net',
    detail: `rate=${tq1.managementRateBps}, basis=${tq1.managementFeeBasis}`,
  });

  // ─── Phase 3G: net + VAT === gross for 10 000 random values ───

  let roundTripOk = true;
  for (let i = 0; i < 10000; i++) {
    const k = Math.floor(Math.random() * 100_000_000) + 1;
    try {
      const q = quoteTargetAds({ budgetKopecks: k, inputMode: 'gross' });
      if (q.adNetKopecks + q.adVatKopecks !== q.adGrossKopecks) { roundTripOk = false; break; }
    } catch { roundTripOk = false; break; }
  }
  tests.push({ name: '10 000 random gross values: net + vat === gross', passed: roundTripOk, detail: roundTripOk ? 'all passed' : 'failed' });

  // Also test net mode
  let roundTripNetOk = true;
  for (let i = 0; i < 10000; i++) {
    const k = Math.floor(Math.random() * 100_000_000) + 1;
    try {
      const q = quoteTargetAds({ budgetKopecks: k, inputMode: 'net' });
      if (q.adNetKopecks + q.adVatKopecks !== q.adGrossKopecks) { roundTripNetOk = false; break; }
    } catch { roundTripNetOk = false; break; }
  }
  tests.push({ name: '10 000 random net values: net + vat === gross', passed: roundTripNetOk, detail: roundTripNetOk ? 'all passed' : 'failed' });

  // ─── Phase 3H: Revenue share proposal does not change current plan total ───

  const snapshotWithRevShare = buildPricingSnapshot({
    quote: tq1,
    ownServices: [],
    revenueShareProposal: { rateBps: 500, status: 'proposed' },
  });
  tests.push({
    name: 'Revenue share proposal does not change total',
    passed: snapshotWithRevShare.totalPlanKopecks === tq1.totalPlanKopecks && snapshotWithRevShare.revenueShareProposal?.includedInCurrentPlan === false,
    detail: `total=${snapshotWithRevShare.totalPlanKopecks}, included=${snapshotWithRevShare.revenueShareProposal?.includedInCurrentPlan}`,
  });

  // ─── Phase 3I: Historical project preservation ───

  const legacyQuote = quoteExternalPlacement(rublesToKopecks(50000));
  tests.push({
    name: 'Legacy external-placement-v1 quote unchanged by new code',
    passed: legacyQuote.pricingVersion === 'external-placement-v1' && legacyQuote.platformFeeGrossKopecks === 1_300_000,
    detail: `version=${legacyQuote.pricingVersion}, fee=${legacyQuote.platformFeeGrossKopecks}`,
  });

  // ─── Pricing version check ───

  tests.push({
    name: 'Pricing version is target-ads-v2-net20',
    passed: tq1.pricingVersion === TARGET_ADS_PRICING_VERSION,
    detail: `got ${tq1.pricingVersion}`,
  });

  // ─── Invalid inputs rejected ───

  tests.push({
    name: 'Negative budget rejected',
    passed: (() => { try { quoteTargetAds({ budgetKopecks: -1, inputMode: 'net' }); return false; } catch { return true; } })(),
    detail: 'threw',
  });

  tests.push({
    name: 'Non-integer budget rejected',
    passed: (() => { try { quoteTargetAds({ budgetKopecks: 100.5, inputMode: 'net' }); return false; } catch { return true; } })(),
    detail: 'threw',
  });

  tests.push({
    name: 'Invalid revenue rate rejected',
    passed: (() => { try { revenueFeeKopecks(100, -1); return false; } catch { return true; } })(),
    detail: 'threw',
  });

  // ─── Minimum fee disabled ───

  tests.push({
    name: 'Minimum fee not applied (disabled)',
    passed: tq1.minimumFeeApplied === false,
    detail: `minimumFeeApplied=${tq1.minimumFeeApplied}`,
  });

  // ─── Format check ───

  tests.push({
    name: 'formatRubles produces readable string',
    passed: formatRubles(12_600_000).includes('126'),
    detail: `got "${formatRubles(12_600_000)}"`,
  });

  return tests;
}
