# FDR — Front Desk Report · Project tasks

## Done

### Foundation (standalone build)
- [x] Restore brand imagery locally: lobby, reception, key tray, hallway photos + FDR seal SVG (no external storage)
- [x] Clean configs so the app runs standalone (no Manus runtime, plugins, or OAuth plumbing)

### Real backend system (Express + SQLite)
- [x] Express API server (server/index.ts) with SQLite via node:sqlite — no native deps
- [x] Schema: users, sessions, tasks, reports, inquiries, feedback, finance, audit
- [x] Auth: scrypt-hashed passwords, httpOnly session cookies, register → admin approval → active
- [x] Role enforcement server-side (staff cannot approve users or reopen reports)
- [x] Auto-seeded demo data: admin, staff, a pending trainee, tasks, reports, ledger, inquiries, feedback
- [x] Combined /api/state endpoint; Vite dev proxy; production Express serves built client

### Client wired to the real API
- [x] Store context now server-backed (loading gate, session check, refresh after every mutation)
- [x] Login validates against the DB (invalid / pending / rejected messages); register creates pending accounts
- [x] Tasks kanban, daily report submit/draft, dashboard stats, history search → live records
- [x] Shift reports sheet generated from real reports for a chosen date (+ CSV/PDF from that data)
- [x] Finance ledger: add income/expense/refund via modals, live tables, computed deep-calc, CSV
- [x] Inquiries + guest feedback logged to the DB; feedback view lists the real record
- [x] Monthly/Yearly views computed from stored reports (occupancy trend, coverage, income)
- [x] Admin view: approve/reject access requests, team table; admin nav hidden for staff
- [x] Audit log renders the live server-side trail

## Next
- [ ] Closeout sheet persisted as records (currently a printable manual form)
- [ ] Password change + admin user editing (role/department/shift)
- [ ] Approve/reopen reports from History view for admins
- [ ] Optional: deploy story (Docker file + volume for server/data)
