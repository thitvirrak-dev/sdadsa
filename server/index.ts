// FDR API server — real authentication, real SQLite persistence, real audit trail.
// In development it runs on :3001 behind the Vite dev proxy; in production it
// also serves the built client from dist/public.
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import {
  audit,
  createSession,
  db,
  destroySession,
  estimateIncome,
  findSessionUser,
  findUserByEmail,
  formatUsd,
  hashPassword,
  listAudit,
  listFeedback,
  listFinance,
  listInquiries,
  listReports,
  listTasks,
  listUsers,
  nextPrefixedId,
  publicUser,
  seedIfEmpty,
  verifyPassword,
  type DatabaseUser,
} from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_COOKIE = "fdr_session";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function parseCookies(header: string | undefined): Record<string, string> {
  const jar: Record<string, string> = {};
  if (!header) return jar;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    jar[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return jar;
}

function setSessionCookie(res: express.Response, token: string) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`);
}

function clearSessionCookie(res: express.Response) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function bad(res: express.Response, status: number, error: string) {
  res.status(status).json({ error });
}

type AuthedRequest = express.Request & { user?: DatabaseUser };

function requireAuth(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  const user = token ? findSessionUser(token) : undefined;
  if (!user || user.status !== "active") {
    bad(res, 401, "Not signed in");
    return;
  }
  req.user = user;
  next();
}

function requireAdmin(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  if (req.user?.role !== "admin") {
    bad(res, 403, "Admin access required");
    return;
  }
  next();
}

function asString(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

// ---------------------------------------------------------------------------
// App + routes
// ---------------------------------------------------------------------------

async function startServer() {
  seedIfEmpty();

  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "256kb" }));

  const api = express.Router();

  // ---- Auth ----------------------------------------------------------------

  api.post("/auth/register", (req, res) => {
    const name = asString(req.body?.name, 80);
    const email = asString(req.body?.email, 120).toLowerCase();
    const password = String(req.body?.password ?? "");
    const department = asString(req.body?.department, 60) || "Front office";
    const shift = asString(req.body?.shift, 20) || "Morning";

    if (!name || !email) return bad(res, 400, "Name and email are required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 400, "Enter a valid email address");
    if (password.length < 6) return bad(res, 400, "Password must be at least 6 characters");
    if (findUserByEmail(email)) return bad(res, 409, "An account with this email already exists");

    const { salt, hash } = hashPassword(password);
    db.prepare("INSERT INTO users (name, email, password_hash, salt, role, department, shift, status, created_at) VALUES (?, ?, ?, ?, 'staff', ?, ?, 'pending', ?)").run(
      name,
      email,
      hash,
      salt,
      department,
      shift,
      Date.now(),
    );
    const user = findUserByEmail(email)!;
    audit(user.id, user.name, "Requested an account (awaiting admin approval)", "Access");
    res.status(201).json({ ok: true, status: "pending" });
  });

  api.post("/auth/login", (req, res) => {
    const email = asString(req.body?.email, 120).toLowerCase();
    const password = String(req.body?.password ?? "");
    const user = findUserByEmail(email);
    if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
      return bad(res, 401, "Invalid email or password");
    }
    if (user.status === "pending") {
      return bad(res, 403, "Account is awaiting admin approval");
    }
    if (user.status === "rejected") {
      return bad(res, 403, "This account was not approved");
    }
    const token = createSession(user.id);
    setSessionCookie(res, token);
    audit(user.id, user.name, "Signed in", "Access");
    res.json({ user: publicUser(user) });
  });

  api.post("/auth/logout", (req, res) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    const user = token ? findSessionUser(token) : undefined;
    if (user) audit(user.id, user.name, "Signed out", "Access");
    if (token) destroySession(token);
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  api.get("/auth/me", (req, res) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    const user = token ? findSessionUser(token) : undefined;
    res.json({ user: user && user.status === "active" ? publicUser(user) : null });
  });

  // Everything below requires a signed-in, approved account.
  api.use(requireAuth);

  // ---- Combined state ------------------------------------------------------

  api.get("/state", (req: AuthedRequest, res) => {
    const admin = req.user!.role === "admin";
    res.json({
      tasks: listTasks(),
      reports: listReports(),
      inquiries: listInquiries(),
      feedback: listFeedback(),
      finance: listFinance(),
      audit: listAudit(),
      users: admin ? listUsers().filter((user) => user.status !== "pending") : [],
      pendingUsers: admin ? listUsers().filter((user) => user.status === "pending") : [],
    });
  });

  // ---- Tasks ---------------------------------------------------------------

  api.post("/tasks", (req: AuthedRequest, res) => {
    const title = asString(req.body?.title, 140);
    if (!title) return bad(res, 400, "Task title is required");
    const priority = ["High", "Med", "Low"].includes(req.body?.priority) ? req.body.priority : "Med";
    const due = asString(req.body?.due, 10);
    const detail = asString(req.body?.detail, 200);
    const id = nextPrefixedId("tasks", "id", "TSK-");
    db.prepare("INSERT INTO tasks (id, title, detail, status, priority, due, created_by, created_at) VALUES (?, ?, ?, 'Pending', ?, ?, ?, ?)").run(
      id,
      title,
      detail,
      priority,
      due,
      req.user!.name,
      Date.now(),
    );
    audit(req.user!.id, req.user!.name, `Added task ${id}`, "Tasks");
    res.status(201).json({ id });
  });

  api.patch("/tasks/:id", (req: AuthedRequest, res) => {
    const status = String(req.body?.status ?? "");
    if (!["Pending", "In Progress", "Completed"].includes(status)) return bad(res, 400, "Invalid task status");
    const existing = db.prepare("SELECT id FROM tasks WHERE id = ?").get(req.params.id) as { id: string } | undefined;
    if (!existing) return bad(res, 404, "Task not found");
    db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, req.params.id);
    audit(req.user!.id, req.user!.name, `Task ${req.params.id} → ${status}`, "Tasks");
    res.json({ ok: true });
  });

  // ---- Reports ---------------------------------------------------------------

  api.post("/reports", (req: AuthedRequest, res) => {
    const dateIso = asString(req.body?.dateIso, 10);
    const shift = ["Morning", "Afternoon", "Night"].includes(req.body?.shift) ? req.body.shift : "Morning";
    const status = req.body?.status === "draft" ? "draft" : "submitted";
    const totalRooms = Math.max(0, Math.min(2000, Number(req.body?.totalRooms) || 0));
    const occupied = Math.max(0, Math.min(totalRooms, Number(req.body?.occupied) || 0));
    const notes = asString(req.body?.notes, 2000);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return bad(res, 400, "A valid date is required");

    const pct = totalRooms ? Math.min(100, Math.round((occupied / totalRooms) * 100)) : 0;
    const income = estimateIncome(occupied);

    if (status === "draft") {
      const existing = db.prepare("SELECT id FROM reports WHERE status = 'draft' AND date_iso = ? AND shift = ? AND reporter_id = ?").get(dateIso, shift, req.user!.id) as { id: string } | undefined;
      if (existing) {
        db.prepare("UPDATE reports SET total_rooms = ?, occupied = ?, occupancy_pct = ?, income = ?, notes = ? WHERE id = ?").run(totalRooms, occupied, pct, income, notes, existing.id);
        audit(req.user!.id, req.user!.name, `Updated draft ${existing.id}`, "Report");
        return res.json({ id: existing.id, status: "draft" });
      }
      const id = nextPrefixedId("reports", "id", "RPT-");
      db.prepare("INSERT INTO reports (id, date_iso, shift, reporter_id, reporter_name, total_rooms, occupied, occupancy_pct, income, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)").run(
        id,
        dateIso,
        shift,
        req.user!.id,
        req.user!.name,
        totalRooms,
        occupied,
        pct,
        income,
        notes,
        Date.now(),
      );
      audit(req.user!.id, req.user!.name, `Saved draft ${id}`, "Report");
      return res.status(201).json({ id, status: "draft" });
    }

    const id = nextPrefixedId("reports", "id", "RPT-");
    db.prepare("INSERT INTO reports (id, date_iso, shift, reporter_id, reporter_name, total_rooms, occupied, occupancy_pct, income, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)").run(
      id,
      dateIso,
      shift,
      req.user!.id,
      req.user!.name,
      totalRooms,
      occupied,
      pct,
      income,
      notes,
      Date.now(),
    );
    audit(req.user!.id, req.user!.name, `Submitted shift report ${id}`, "Report");
    res.status(201).json({ id, status: "submitted", occupancy: `${pct}%`, income: formatUsd(income) });
  });

  api.patch("/reports/:id", (req: AuthedRequest, res) => {
    if (req.user!.role !== "admin") return bad(res, 403, "Admin access required");
    const status = String(req.body?.status ?? "");
    if (!["approved", "submitted"].includes(status)) return bad(res, 400, "Invalid report status");
    const existing = db.prepare("SELECT id FROM reports WHERE id = ?").get(req.params.id) as { id: string } | undefined;
    if (!existing) return bad(res, 404, "Report not found");
    db.prepare("UPDATE reports SET status = ? WHERE id = ?").run(status, req.params.id);
    audit(req.user!.id, req.user!.name, `${status === "approved" ? "Approved" : "Reopened"} report ${req.params.id}`, "Report");
    res.json({ ok: true });
  });

  // ---- Inquiries -------------------------------------------------------------

  api.post("/inquiries", (req: AuthedRequest, res) => {
    const details = asString(req.body?.details, 500);
    if (!details) return bad(res, 400, "Inquiry details are required");
    const id = nextPrefixedId("inquiries", "id", "INQ-");
    db.prepare("INSERT INTO inquiries (id, date_iso, channel, category, guest_name, details, outcome, follow_up, staff, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      id,
      asString(req.body?.dateIso, 10) || new Date().toISOString().slice(0, 10),
      asString(req.body?.channel, 40) || "Front desk",
      asString(req.body?.category, 40) || "General",
      asString(req.body?.guestName, 80),
      details,
      req.body?.outcome === "resolved" ? "resolved" : "follow_up",
      asString(req.body?.followUp, 200),
      req.user!.name,
      Date.now(),
    );
    audit(req.user!.id, req.user!.name, `Logged inquiry ${id}`, "Report");
    res.status(201).json({ id });
  });

  // ---- Guest feedback ----------------------------------------------------------

  api.post("/feedback", (req: AuthedRequest, res) => {
    const comment = asString(req.body?.comment, 1000);
    if (!comment) return bad(res, 400, "Feedback text is required");
    const id = nextPrefixedId("feedback", "id", "FB-");
    db.prepare("INSERT INTO feedback (id, date_iso, channel, guest_name, room, comment, staff, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      id,
      asString(req.body?.dateIso, 10) || new Date().toISOString().slice(0, 10),
      asString(req.body?.channel, 40) || "Front desk",
      asString(req.body?.guestName, 80),
      asString(req.body?.room, 10),
      comment,
      req.user!.name,
      Date.now(),
    );
    audit(req.user!.id, req.user!.name, `Logged guest feedback ${id}`, "Report");
    res.status(201).json({ id });
  });

  // ---- Finance -----------------------------------------------------------------

  api.post("/finance", (req: AuthedRequest, res) => {
    const type = ["income", "expense", "refund"].includes(req.body?.type) ? req.body.type : null;
    if (!type) return bad(res, 400, "Invalid entry type");
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) return bad(res, 400, "Enter an amount greater than zero");
    const prefix = type === "income" ? "INC-" : type === "expense" ? "EXP-" : "REF-";
    const id = nextPrefixedId("finance", "id", prefix);
    db.prepare("INSERT INTO finance (id, date_iso, shift, type, category, description, amount, staff, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      id,
      asString(req.body?.dateIso, 10) || new Date().toISOString().slice(0, 10),
      ["Morning", "Afternoon", "Night"].includes(req.body?.shift) ? req.body.shift : "Morning",
      type,
      asString(req.body?.category, 60),
      asString(req.body?.description, 200),
      amount,
      req.user!.name,
      Date.now(),
    );
    audit(req.user!.id, req.user!.name, `Recorded ${type} ${id} (${formatUsd(amount)})`, "Finance");
    res.status(201).json({ id });
  });

  // ---- Admin: user approvals ------------------------------------------------------

  api.patch("/users/:id", (req: AuthedRequest, res) => {
    if (req.user!.role !== "admin") return bad(res, 403, "Admin access required");
    const status = String(req.body?.status ?? "");
    if (!["active", "rejected", "pending"].includes(status)) return bad(res, 400, "Invalid account status");
    const target = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(req.params.id)) as DatabaseUser | undefined;
    if (!target) return bad(res, 404, "User not found");
    if (target.id === req.user!.id && status !== "active") return bad(res, 400, "You cannot change your own account status");
    db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, target.id);
    audit(req.user!.id, req.user!.name, `${status === "active" ? "Approved" : status === "rejected" ? "Rejected" : "Reset"} account ${target.name}`, "Access");
    res.json({ ok: true });
  });

  app.use("/api", api);
  app.use("/api", (_req, res) => bad(res, 404, "Unknown API route"));

  // ---- Static client ------------------------------------------------------------

  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = Number(process.env.PORT) || 3001;
  server.listen(port, () => {
    console.log(`[fdr] API server running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
