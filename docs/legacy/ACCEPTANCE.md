# ACCEPTANCE — СВЯЗКА

## Этап A — Architecture Freeze

### ✅ Выполнено
- ProjectPricingService: фиксированная ставка 26%, расчёт в копейках, BigInt-safe, версия `external-placement-v1`.
- Budget calculator: использует единый pricing service, убраны client-set rate/VAT/agent fee.
- Media plan: использует pricing service вместо локальной константы `0.26`.
- Career tests: индекс вопроса отделён от ответов, экран проверки, явное dimension→result mapping, retake cooldown 30 дней, scoring version.
- Age calculation: календарный алгоритм с проверкой валидности даты, категории under_14/minor/adult.
- Guardian verification: разные исходы для confirmed/rejected, расширенный тип (expiresAt, consumedAt, consentVersion, verificationMethod).
- Fortune cookie: 100 предсказаний, убран reroll, Moscow day key, детерминизм по аккаунту.
- Partners: seed вынесен из import side-effects в явный вызов в main.tsx.
- Vacancies: seed вынесен из import side-effects.
- PartnersMarquee: pause on focus-within, accessibility.
- Documents: preview/download disabled без файла.
- Типы расширены: PublicResume, MediaPlan/MediaPlanItem, RewardTransaction ledger fields.
- Архитектурные документы созданы.

### ⏳ Остаётся на этап B (production)
- Repository REST adapter и API реализация.
- Server identity: VK → Account → HttpOnly Secure cookie.
- Resource-scoped RBAC на сервере.
- Идемпотентные reward transactions (sourceEventId).
- FileAsset для документов.
- OAuth state validation (сравнение с ожидаемым значением).
- DaData rate-limit и валидация.
- Публичная проекция резюме (server-side whitelist).
- Moderation queue и audit.

## Проверка сборки
- `npx tsc -b --noEmit` — без ошибок.
- `npm run build` — успешно.

## Не проверено
- UI-сценарии в браузере (нет browser tool в среде).
- Применение SQL migrations на живой БД.
- Edge functions deploy.
- Real VK OAuth flow.
