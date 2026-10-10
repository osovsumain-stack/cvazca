# DOMAIN ARCHITECTURE — СВЯЗКА

## Сущности

### Account
- Один аккаунт по VK ID. Один человек использует Business и Career контуры.
- `PlatformRole`: candidate | business_member | admin — отдельные назначения, не единое поле.
- `OrganizationRole`: owner | administrator | marketing_manager | hr_manager | accountant | viewer — роль в организации.
- `activeOrganizationId` — текущий контекст бизнеса, отдельный от роли и UI mode.

### CandidateProfile
- Привязан к Account. Возраст 14+. Несовершеннолетние (14–17) требуют Guardian verification.
- Поля: education, opportunity, profession, roles, interests, experiences, skills, languages, priorities, tests.

### Organization
- Главный контекст Business. Создаётся через DaData lookup или вручную.
- Поля: type (OOO/IP/AO/ZAO/NonProfit), inn, kpp, ogrn/ogrnip, fullName, shortName, legalAddress, bankDetails.
- `dataSource`: dadata | manual | mixed. `dataVerifiedAt` — дата проверки.

### OrganizationMembership
- Связь Account ↔ Organization с ролью и статусом (active/invited/revoked).
- Членство в организации A не даёт прав в организации B.

### Resume
- Кандидат может иметь несколько резюме.
- `isPublic` + `publicSlug` + `moderationStatus` + `visibility` — совместно определяют публичность.
- `PublicResume` — отдельная проекция с whitelist полей: без email, phone, birthDate, guardian data.

### VacancyPosting
- Принадлежит Organization. Статусы: draft → pending_moderation → approved → published → paused → closed.
- Модерация администратором до публикации.
- `suitableForMinors` + `minimumAge` — для 14–17.

### JobApplication
- Кандидат откликается на вакансию. `sharedContacts` — явно переданные контакты.
- Статусы: draft → sent → viewed → interview → offer → rejected → withdrawn.

### BusinessProject
- Принадлежит Organization. Тип: advertising | marketing | design | website | ai | hr | other.
- Статусы: draft → calculated → documents → payment_pending → paid → in_progress → completed → cancelled.
- `providerAmount` + `platformFee` + `totalAmount` — расчёт через ProjectPricingService.
- `brief.extra` — legacy JSON-строки (A: типизированные MediaPlanItem на этапе B).

### MediaPlan
- `id`, `accountId`, `organizationId`, `cityId`, `status`, `items[]`, `quoteVersion`.
- Item: `placementId`, `providerId`, `providerDisplayName`, `quantity`, `period`, `unitPriceKopecks`, `priceSnapshot`.
- Смена организации не переносит медиаплан автоматически.

### BusinessDocument
- `organizationId`, `projectId`, `type`, `number`, `title`, `status`, `amount`.
- FileAsset и DocumentVersion — контракт для этапа B.
- preview/download без файла — disabled.

### RewardTransaction (Ledger)
- `sourceEventId` — связка с domain event для идемпотентности.
- `reversalOfId` — для отмен.
- `ruleVersion` — версия правила начисления.
- Баланс — производная реестра, не свободно присваиваемое поле.

### GuardianVerification
- `status`: not_required | required | pending | verified | rejected.
- `expiresAt`, `consumedAt` — TTL и одноразовость (контракт для B).
- `consentVersion`, `verificationMethod` — версия согласия и метод подтверждения.
- Guardian — отношение/подтверждение, не бизнес-роль.

### Partner
- `type`, `logoUrl`, `websiteUrl`, `sortOrder`, `isActive`.
- URL валидируется: только http/https, без javascript/data.
- Статус подтверждения — OWNER_INPUT.

## Инварианты

1. `platformFeeGross = round(providerAmount × 2600 / 10000)` — фиксированная ставка 26%.
2. `totalClientBudget = providerAmount + platformFeePayable`.
3. Скидка не уменьшает providerAmount.
4. Членство в org A не даёт действий в org B.
5. Публичная проекция резюме не содержит email/phone/birthDate/guardian data.
6. Один sourceEvent → одна reward transaction.
7. Предсказание одно на аккаунт/день, без reroll.
8. День дня — Europe/Moscow, не UTC.
9. Fixture import не создаёт данные; seed вызывается явно в DEV.
