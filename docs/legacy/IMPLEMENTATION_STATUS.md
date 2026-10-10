# IMPLEMENTATION STATUS — СВЯЗКА

## Что сделано (этап A)

### Pricing
- `src/services/projectPricingService.ts` — единый сервис расчёта: 26% bps, копейки, BigInt, версия.
- `BusinessBudgetCalculatorPage` — использует pricing service.
- `BusinessMediaPlanPage` — использует pricing service.

### Career
- `src/services/careerEligibilityService.ts` — календарный возраст, категории.
- `CareerTestsPage` — review screen, dimension mapping, retake cooldown, scoring version.

### Guardian
- `GuardianVerifyPage` — different outcomes for confirmed vs rejected.
- `GuardianVerification` type — extended with expiresAt, consumedAt, consentVersion, verificationMethod.

### Fortune
- `fortunePredictions.ts` — 100 predictions, no reroll, Moscow day key, deterministic per account.
- `DailyFortuneCookie` — account-scoped, no refresh button.

### Partners & Vacancies
- Seed functions exported and called explicitly in `main.tsx`.
- No import side-effects in repository modules.

### Partners Marquee
- `focus-within` pause added.
- Accessibility: aria-hidden on duplicate group, tabIndex management.

### Documents
- Preview/download buttons disabled when no file exists.

### Types
- `PublicResume` projection added.
- `MediaPlan`/`MediaPlanItem` typed model added.
- `RewardTransaction` — sourceEventId, reversalOfId, ruleVersion added (optional).

### Docs
- DOMAIN_ARCHITECTURE, SECURITY_BOUNDARY, BACKEND_CONTRACT, RBAC_MATRIX, MIGRATION_PLAN, OWNER_INPUTS, ACCEPTANCE.

## Что не сделано (этап B+)

### A3 — ActiveOrganizationContext
- Not implemented. Organization scope is passed ad-hoc through pages.

### A5 — MediaPlan typed line items
- Types defined but repositories still use legacy JSON strings in brief.extra.

### A7 — Resume public projection
- `PublicResume` type defined but no server-side whitelist enforcement exists (DEV-only).

### A12 — Ledger idempotency
- `sourceEventId`/`reversalOfId` fields added to type but rewardService not updated to use them.

### A13 — Security hardening
- OAuth state validation still only checks for emptiness, no comparison.
- DaData edge functions still public with no rate-limit.

### A14 — Responsive/accessibility audit
- Not performed.

## Build status
- TypeScript: clean.
- Vite build: successful.
