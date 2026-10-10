# BACKEND CONTRACT — СВЯЗКА (этап B)

## Identity

- `GET /api/me` — текущий аккаунт, роли, memberships.
- `POST /api/auth/vk/exchange` — VK token → session cookie.
- `POST /api/logout` — revocation.

## Organizations

- `GET /api/organizations` — организации текущего аккаунта.
- `POST /api/organizations` — создание.
- `GET /api/organizations/:orgId/members` — участники.
- `POST /api/organizations/:orgId/invitations` — приглашение.
- `PATCH /api/organizations/:orgId/members/:id` — смена роли.

## Public endpoints

- `GET /api/placements` — каталог рекламы.
- `GET /api/services` — каталог услуг.
- `GET /api/vacancies` — опубликованные вакансии (без входа).
- `GET /api/resumes/:slug` — публичное резюме (whitelist DTO).

## Career (private)

- `GET /api/career/profile`
- `PATCH /api/career/profile`
- `POST /api/career/resumes` — создание.
- `PATCH /api/career/resumes/:id` — обновление.
- `POST /api/career/resumes/:id/publish` — публикация.
- `POST /api/career/resumes/:id/unpublish` — снятие с публикации.

## Vacancies (org-scoped)

- `POST /api/organizations/:orgId/vacancies` — создание.
- `POST /api/vacancies/:id/applications` — отклик кандидата.
- `PATCH /api/organizations/:orgId/vacancies/:id` — обновление.
- `POST /api/organizations/:orgId/vacancies/:id/submit` — на модерацию.
- `POST /api/admin/vacancies/:id/approve` — модерация.
- `POST /api/admin/vacancies/:id/reject` — модерация.

## Projects (org-scoped)

- `GET /api/organizations/:orgId/projects`
- `POST /api/organizations/:orgId/projects` — создание.
- `POST /api/projects/:id/quote` — серверный перерасчёт.
- `POST /api/projects/:id/submit` — отправка.
- `POST /api/projects/:id/status-transitions` — смена статуса.

## Media Plans (org-scoped)

- `GET /api/organizations/:orgId/media-plans`
- `POST /api/organizations/:orgId/media-plans`
- `POST /api/organizations/:orgId/media-plans/:id/confirm`

## Documents (org-scoped)

- `GET /api/organizations/:orgId/documents`
- `POST /api/organizations/:orgId/documents`
- `GET /api/documents/:id/preview` — safe file reference.
- `GET /api/documents/:id/download` — safe file reference.

## Rewards & Notifications

- `GET /api/me/rewards` — statement.
- `GET /api/me/notifications`
- `POST /api/me/notifications/:id/read`

## Admin

- `POST /api/admin/vacancies/:id/approve`
- `POST /api/admin/vacancies/:id/reject`
- `POST /admin/moderation` — с reason и audit.

## Error format

```json
{
  "code": "string",
  "message": "string",
  "fieldErrors": [{ "field": "string", "message": "string" }],
  "requestId": "string"
}
```

No stack traces, no credentials in responses.

## Common rules

- Identity из сессии, не из тела.
- Server timestamp, валидированный payload.
- `Idempotency-Key` header для повторяемых команд.
- Pagination: `?page=1&limit=20`, max limit 100.
- Errors: 400 (validation), 401 (no session), 403 (no permission), 404 (not found), 409 (conflict).
