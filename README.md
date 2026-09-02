# FDR — Front Desk Report

ប្រព័ន្ធរបាយការណ៍ និងប្រតិបត្តិការផ្នែកទទួលភ្ញៀវ — a real, full-stack front office operations system for hotel teams: shift reports, tasks, cash ledger, guest inquiries, feedback, and a complete audit trail. Khmer-first UI with English metadata.

## Architecture

| Layer | Tech |
| --- | --- |
| Client | React 19 + Vite 7 + Tailwind 4, TypeScript |
| API | Express (Node ESM), session cookies |
| Database | SQLite via Node's built-in `node:sqlite` (WAL mode) — zero native dependencies |
| Auth | scrypt password hashing, httpOnly session cookies, admin approval workflow |

The database file lives at `server/data/fdr.db` (gitignored) and is auto-created and seeded on first boot.

## Run it

```bash
pnpm install

# Development: API on :3001 + Vite on :3000 (proxies /api)
pnpm server   # terminal 1
pnpm dev      # terminal 2

# Production: build everything, one Express process serves app + API
pnpm build
pnpm start    # PORT env supported, default 3000

# Type check
pnpm check
```

## Demo accounts (seeded on first boot)

| Account | Password | Role | Status |
| --- | --- | --- | --- |
| admin@hotel.com | admin123 | Admin | active |
| staff@hotel.com | staff123 | Staff | active |
| nary@hotel.com | trainee123 | Staff | **pending** — login is blocked until an admin approves her in Administration |

New self-registered accounts land in the same pending queue (Administration → Access requests).

## What's real

- **Auth** — register (pending approval), login, logout, session persistence across reloads; passwords hashed with scrypt + per-user salt; role-gated actions enforced server-side.
- **Daily report** — submits create `RPT-####` records with computed occupancy %; drafts upsert per date/shift/reporter; admins can approve reports.
- **Shift reports** — generates a date's operating sheet from the real submitted reports; CSV/PDF export from that data.
- **Tasks** — kanban queue backed by the API with audit events on every move.
- **Finance ledger** — income/expense/refund entries with modals, live tab tables, real computed deep-calculation and CSV exports.
- **Inquiries & guest feedback** — logged to the database, filterable, part of the record.
- **Monthly/Yearly views** — metrics, occupancy trend points, and coverage computed from the stored reports.
- **Audit log** — every sign-in, approval, report, task, and ledger write is recorded server-side.

## API overview

```
POST /api/auth/register | login | logout     GET /api/auth/me
GET  /api/state                              (combined data for the signed-in user)
POST/PATCH /api/tasks, /api/tasks/:id
POST /api/reports  (submitted | draft upsert)  PATCH /api/reports/:id (admin approve)
POST /api/inquiries | /api/feedback | /api/finance
PATCH /api/users/:id  (admin: approve/reject)
```
