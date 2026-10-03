# BudgetBuddy API Reference

Base URL: `/api` (in development the Vite dev server proxies `/api` to `http://localhost:5000`).

## Conventions

- All request and response bodies are JSON.
- Authenticated endpoints expect an `Authorization: Bearer <token>` header. A missing, invalid or expired token returns **401**.
- Errors always have the shape `{ "message": string, "errors"?: { [field]: string } }`.
- Status codes: `400` validation error, `401` not authenticated, `403` authenticated but not allowed, `404` not found (also used when a resource exists but belongs to someone else), `409` conflict (duplicate or in use), `429` rate limited.
- Dates are calendar dates sent as `YYYY-MM-DD` and stored as UTC midnight. Clients should display them with `timeZone: 'UTC'`.
- Month keys use the `YYYY-MM` format.
- Money amounts are plain numbers; the currency comes from the user's `currency_preference` (personal data) or the plan's `currency` (family data).

---

## Auth — `/api/auth`

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/signup` | – | `{ name, email, password, recovery_email?, currency_preference? }` | `201 { message, token, user }` |
| POST | `/login` | – | `{ email, password }` | `200 { message, token, user }` |
| POST | `/logout` | ✓ | – | `200 { message }` |
| POST | `/forgot-password` | – | `{ email }` | `200 { message, devResetUrl? }` |
| POST | `/reset-password` | – | `{ token, password }` | `200 { message }` |

- `user` is `{ _id, name, email, currency_preference, profileImage }`.
- Emails are trimmed and lower-cased. Passwords must be at least 8 characters.
- Login returns `401 Invalid email or password` for both unknown email and wrong password.
- `forgot-password` always returns 200 so accounts can't be enumerated. It emails a link to `${CLIENT_URL}/reset-password?token=...` that is valid for 30 minutes. When SMTP isn't configured and `NODE_ENV !== 'production'`, the link is logged to the server console and returned as `devResetUrl`.
- `/login`, `/signup`, `/forgot-password` and `/reset-password` are rate limited.

## User — `/api/user`

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/profile` | – | `Profile` |
| PUT | `/profile` | any subset of `{ name, recovery_email, profileImage, currency_preference, currentPassword, newPassword }` | `Profile` |

- `Profile` is `{ _id, name, email, recovery_email, profileImage, currency_preference, created_at }`.
- Changing the password requires `currentPassword` (`400` if wrong) and a `newPassword` of at least 8 characters. A password change signs out all existing sessions, so the response then also includes a fresh `token` that the client must store.
- `currency_preference` must be one of `USD, EUR, GBP, PKR, INR, AED, SAR, CAD, AUD, JPY`.

## Categories — `/api/categories`

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/` | – | `[{ _id, name }]`, sorted by name |
| POST | `/` | `{ name }` | `201 { _id, name }` (`409` if the name exists, case-insensitive) |
| PUT | `/:id` | `{ name }` | `{ _id, name }` |
| DELETE | `/:id` | – | `{ message }` (`409` if any personal budget/expense or family budget/expense uses it) |

## Monthly budgets — `/api/monthly-budgets`

A monthly budget is the overall spending target for a budgeting period.
`MonthlyBudget` is `{ _id, month_year, total_budget_amount, start_date, end_date }`.

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/` | – | `[MonthlyBudget]`, newest first |
| GET | `/current` | – | `MonthlyBudget` or `null` |
| POST | `/` | `{ total_budget_amount, start_date, end_date }` | `201 MonthlyBudget` (`409` if one already exists for that month) |
| PUT | `/:id` | subset of `{ total_budget_amount, start_date, end_date }` | `MonthlyBudget` |
| DELETE | `/:id` | – | `{ message }` |

- `month_year` is derived from `start_date`.
- `current` is the budget whose `start_date <= today <= end_date`; failing that, the one whose `month_year` is the current month. Spending totals only use a budget's dates when they include today.

## Category budgets — `/api/budgets`

A category budget is a spending limit for one category in one month.
`Budget` is `{ _id, category_id, category_name, month_year, limit_amount, description }`.
`category_name` is `"Uncategorized"` if the category no longer exists.

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/?monthYear=YYYY-MM` | – | `[Budget]` (`400` if `monthYear` is missing or invalid) |
| POST | `/` | `{ category_id, limit_amount, month_year, description? }` | `201 Budget` (`409` if that category already has a budget that month) |
| PUT | `/:id` | subset of `{ category_id, limit_amount, description }` | `Budget` |
| DELETE | `/:id` | – | `{ message }` |

## Expenses — `/api/expenses`

`Expense` is `{ _id, amount, description, notes, expense_date, category_id: { _id, name } | null, created_at }`.

The **current period** is the date range of the monthly budget that includes today, or the current calendar month (UTC) if there isn't one. Every "current" endpoint uses the same period, so totals match across pages.

| Method | Path | Query/Body | Response |
|---|---|---|---|
| GET | `/` | `?start=YYYY-MM-DD&end=YYYY-MM-DD&category=<id>&limit=<n>` (all optional, limit ≤ 500, default 100) | `[Expense]`, newest first |
| GET | `/current-month-plan` | – | `{ expenses: [Expense], totalSpent, period: { start, end, source: 'budget' \| 'calendar' } }` |
| GET | `/current-month/category-wise` | – | `{ categoryWiseSpending: [{ categoryId, categoryName, totalSpent }] }` |
| GET | `/current-month-total` | – | `{ totalSpent }` |
| GET | `/trends` | `?months=1..24` (default 6) | `{ months: ['YYYY-MM'], categories: [{ name, data: [number] }] }` |
| GET | `/recent` | `?limit=1..50` (default 5) | `[Expense]` |
| POST | `/` | `{ category_id, amount, description?, notes?, expense_date }` | `201 Expense` |
| PUT | `/:id` | subset of the POST body | `Expense` |
| DELETE | `/:id` | – | `{ message }` |

Adding or updating an expense can create `budget_limit_approaching` (≥80%) or `budget_limit_exceeded` (>100%) notifications for the period containing the expense. They fire only when a threshold is first crossed.

## Family plans — `/api/family-plans`

Roles are `admin`, `editor` and `viewer`. The plan owner is always an admin and can't be demoted or removed.

`PlanSummary` is `{ _id, plan_name, currency, owner_user_id, userRole }`.

`PlanDetails` is `{ _id, plan_name, currency, total_budget_amount, start_date, end_date, require_approval, owner: { _id, name, email }, userRole, categoryBudgets: [{ categoryId, categoryName, limitAmount }] }`.

| Method | Path | Who | Body | Response |
|---|---|---|---|---|
| GET | `/` | any user | – | `[PlanSummary]` |
| POST | `/` | any user | `{ plan_name, total_budget_amount?, start_date?, end_date?, currency?, require_approval? }` | `201 PlanDetails` |
| GET | `/:planId` | member | – | `PlanDetails` |
| PUT | `/:planId` | admin | subset of the POST body plus `categoryBudgets?: [{ category_id, limit_amount }]` | `PlanDetails` |
| DELETE | `/:planId` | owner | – | `{ message }` |
| GET | `/:planId/categories` | member | – | `[{ _id, name, limitAmount }]` (all of the owner's categories; `limitAmount` is `0` if unset) |

- In `categoryBudgets`, an entry with `limit_amount > 0` is created or updated, and an entry with `0` removes the limit. Categories must belong to the plan owner.
- The sum of limits can't exceed `total_budget_amount` when that is set and greater than 0 (`400`). Send `null` for `total_budget_amount`, `start_date` or `end_date` to clear them.

### Members

| Method | Path | Who | Body | Response |
|---|---|---|---|---|
| GET | `/:planId/members` | member | – | `[{ _id, role, isOwner, user: { _id, name, email, avatar } }]` |
| PUT | `/:planId/members/:userId` | admin | `{ role }` | `{ message, member }` |
| DELETE | `/:planId/members/:userId` | admin, or the member themselves (leave plan) | – | `{ message }` |
| GET | `/:planId/invites` | admin | – | `[{ _id, invitee_email, invitee_name, inviter_name, role_assigned, created_at, expires_at }]` (pending only) |
| POST | `/:planId/invites` | admin | `{ invitee_email, role_assigned: 'viewer' \| 'editor' \| 'admin' }` | `201 { message, invite }` |
| DELETE | `/:planId/invites/:inviteId` | admin | – | `{ message }` (cancels a pending invite) |

- Invitees must already have an account.
- Invites expire after 7 days.

### Expenses

`FamilyExpense` is `{ _id, plan_id, amount, description, notes, expense_date, status: 'pending' | 'approved' | 'rejected', category: { _id, name } | null, added_by: { _id, name } | null, approved_by: { _id, name } | null, created_at }`.

| Method | Path | Who | Body | Response |
|---|---|---|---|---|
| GET | `/:planId/expenses` | member | `?mine=true` returns only the caller's expenses | `[FamilyExpense]`, newest first |
| POST | `/:planId/expenses` | admin, editor | `{ category_id, amount, description, notes?, expense_date }` | `201 FamilyExpense` |
| PUT | `/:planId/expenses/:expenseId` | admin, or the editor who added it | subset of the POST body | `FamilyExpense` |
| DELETE | `/:planId/expenses/:expenseId` | admin, or the editor who added it | – | `{ message }` |
| POST | `/:planId/expenses/:expenseId/approve` | admin | – | `FamilyExpense` |
| POST | `/:planId/expenses/:expenseId/reject` | admin | – | `FamilyExpense` |

- A new expense is `pending` when the plan has `require_approval` and the author isn't an admin. Otherwise it's `approved`.
- When an editor edits an expense in a plan that requires approval, it goes back to `pending`. Otherwise, editing a `rejected` expense resubmits it as `approved`.
- Only `approved` expenses count toward plan totals.

## Invitations (received) — `/api/invites`

| Method | Path | Response |
|---|---|---|
| GET | `/pending` | `[{ _id, plan_id, plan_name, inviter_name, role_assigned, created_at, expires_at }]` |
| POST | `/:inviteId/accept` | `{ message, planId }` |
| POST | `/:inviteId/reject` | `{ message }` |

## Notifications — `/api/notifications`

`Notification` is `{ _id, type, message, is_read, link, created_at, actor: { _id, name } | null }`.
`link` is a frontend route such as `/expense-management` or `/shared-budgeting?plan=<id>`.

| Method | Path | Response |
|---|---|---|
| GET | `/` | `[Notification]`, newest first, max 100 |
| GET | `/unread-count` | `{ count }` |
| PUT | `/read-all` | `{ message }` |
| PUT | `/:id/read` | `Notification` |
| DELETE | `/:id` | `{ message }` |

## Public — `/api`

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/contact-us` | `{ name, email, message }` | `201 { message }` |
| POST | `/newsletter` | `{ email }` | `201 { message }` (`409` if already subscribed) |
| GET | `/health` | – | `{ status: 'ok' }` |

Both form endpoints are rate limited.
