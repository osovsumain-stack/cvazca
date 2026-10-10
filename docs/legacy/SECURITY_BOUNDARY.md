# SECURITY BOUNDARY — СВЯЗКА

## Доверенные и недоверенные входы

### Недоверенные (browser-controlled)
- Все данные из форм UI: суммы, статусы, role claims, accountId, organizationId.
- VK-профиль из SDK (нужна серверная проверка).
- sessionStorage/localStorage — не источник прав.
- Параметры URL: orgId, projectId, vacancyId, token.

### Доверенные (server-controlled, на этапе B)
- Идентичность из HttpOnly Secure session cookie.
- Роли из БД, не из тела запроса.
- Цены из серверного перерасчёта, не из клиента.
- Статусы переходов — серверная валидация.

## DEV vs Production

### DEV (текущий режим)
- sessionStorage/localStorage адаптеры — demo-данные.
- `seedDemoVacancies()` и `seedDemoPartners()` вызываются явно в `main.tsx`.
- DEV allowlist администратора (`INITIAL_ADMIN_VK_IDS`) — не production RBAC.
- Guardian verify — DEV simulation, не юридическая верификация.

### Production (этап B)
- REST API с server identity.
- VK identity → server verification → own Account → HttpOnly Secure cookie.
- RBAC по ресурсам, не по membership.some().
- No silent mock fallback при ошибке API.

## Identity Boundary (будущий API)

1. VK ID SDK exchange → сервер получает VK token.
2. Сервер проверяет VK token через VK API.
3. Создаёт/находит Account по (provider=vk, subject=vkUserId).
4. Выдаёт HttpOnly Secure session cookie с CSRF/origin policy.
5. RBAC: actor + organization + resource + action.

Фронтенд VK-сессия ≠ Supabase Auth JWT. Нельзя просто заменить mock на `.from(...)` и считать `auth.uid()` настроенным.

## OAuth State (текущий статус)

- В `handleVkCallback()` state проверяется на пустоту, но **сравнение с ожидаемым значением отсутствует**.
- На этапе B: проверить ожидаемое state, TTL, одноразовость.
- PKCE/SDK flow — по официальной документации VK ID SDK.

## DaData Edge Functions

- `verify_jwt=false` — функции публично доступны.
- Нет rate-limit, нет проверки пользователя.
- CORS `*`, вход допускает широкий формат.
- На этапе B: gateway rate-limit, точная валидация ИНН/БИК, таймаут, квоты.
- Секрет DaData остаётся только серверным.
- Автозаполнение реквизитов ≠ подтверждение полномочий представителя.

## Публичные проекции

- Resume: `PublicResume` whitelist — без email, phone, birthDate, guardian, private notes, raw test answers.
- Vacancy: публичный просмотр без входа; контакты — при отклике.
- Partner: URL валидируется (http/https only).

## Миграции SQL

- Применение migrations не проверено на работающей БД (NOT_RUN).
- Снятие широких anon policies ≠ готовая owner isolation.
- Проверять итоговое состояние БД через `get_security_posture`, не по названиям файлов.

## Секреты

- Публичный anon key — не service-role секрет.
- Проверить .env: VITE_* не должны содержать секреты.
- Перевыпуск — только для действительно раскрытого секрета.
