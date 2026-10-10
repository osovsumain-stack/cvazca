# MIGRATION PLAN — СВЯЗКА

## Порядок: DEV Repository → REST Repository → API → PostgreSQL/Timeweb + S3/Timeweb

### Этап A (текущий) — Architecture Freeze
- Repository interfaces зафиксированы.
- Mock adapters работают через sessionStorage/localStorage.
- Fixture seeding вынесен из import side-effects в явные вызовы.
- Domain services (ProjectPricingService, careerEligibilityService) исправлены.
- Типы расширены: PublicResume, MediaPlan/MediaPlanItem, Guardian fields, Ledger fields.
- Контракты API описаны в BACKEND_CONTRACT.md.

### Этап B — REST API + многопользовательский пилот
1. Реализовать REST API по контрактам из BACKEND_CONTRACT.md.
2. Создать REST adapter для каждого repository interface.
3. Production mode: нет silent fallback на mock.
4. Persist: accounts, organizations, memberships, vacancies, applications, resumes, projects, documents, rewards, notifications, consents, guardian.
5. Server identity: VK → Account → HttpOnly Secure cookie.
6. Resource-scoped RBAC на каждой операции.
7. S3/Timeweb для файлов документов.

### Этап C — Функции удержания
- Публичные каталоги, рейтинг, поднятие/подписка, чаты, отзывы.
- Каждый по общим контрактам.

### Этап D — Аналитика и масштабирование
- Analytics adapter, CRM, regional launch kit.

## Стратегия отката

- DEV adapter остаётся доступным через repository factory.
- Переключение через флаг режима (DEV/production).
- При ошибке API: application error, не silent mock.
- Backup БД проверяется на тестовой среде перед применением.
