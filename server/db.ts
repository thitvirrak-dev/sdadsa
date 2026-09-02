// FDR database layer — Node's built-in SQLite (node:sqlite), WAL mode, auto-seeded on first boot.
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.FDR_DATA_DIR ?? path.resolve(__dirname, "..", "server", "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, "fdr.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  department TEXT NOT NULL DEFAULT 'Front office',
  shift TEXT NOT NULL DEFAULT 'Morning',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending',
  priority TEXT NOT NULL DEFAULT 'Med',
  due TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  date_iso TEXT NOT NULL,
  shift TEXT NOT NULL,
  reporter_id INTEGER,
  reporter_name TEXT NOT NULL,
  total_rooms INTEGER NOT NULL DEFAULT 0,
  occupied INTEGER NOT NULL DEFAULT 0,
  occupancy_pct INTEGER NOT NULL DEFAULT 0,
  income TEXT NOT NULL DEFAULT '$0',
  status TEXT NOT NULL DEFAULT 'submitted',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  date_iso TEXT NOT NULL,
  channel TEXT NOT NULL,
  category TEXT NOT NULL,
  guest_name TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT 'follow_up',
  follow_up TEXT NOT NULL DEFAULT '',
  staff TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  date_iso TEXT NOT NULL,
  channel TEXT NOT NULL,
  guest_name TEXT NOT NULL DEFAULT '',
  room TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL,
  staff TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS finance (
  id TEXT PRIMARY KEY,
  date_iso TEXT NOT NULL,
  shift TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0,
  staff TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  user_id INTEGER,
  user_name TEXT NOT NULL,
  event TEXT NOT NULL,
  area TEXT NOT NULL
);
`);

// ---------------------------------------------------------------------------
// Password + session helpers
// ---------------------------------------------------------------------------

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const hash = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}

export function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  db.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(token, userId, now, now + ONE_YEAR_MS);
  return token;
}

export function destroySession(token: string) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

function rows(sql: string, ...params: (string | number | null)[]) {
  return db.prepare(sql).all(...params) as Record<string, unknown>[];
}

export function findUserByEmail(email: string) {
  return rows("SELECT * FROM users WHERE email = ?", email.trim())[0] as unknown as DatabaseUser | undefined;
}

export function findUserById(id: number) {
  return rows("SELECT * FROM users WHERE id = ?", id)[0] as unknown as DatabaseUser | undefined;
}

export function findSessionUser(token: string): DatabaseUser | undefined {
  const session = rows("SELECT * FROM sessions WHERE token = ? AND expires_at > ?", token, Date.now())[0] as { user_id: number } | undefined;
  if (!session) return undefined;
  return findUserById(session.user_id);
}

export interface DatabaseUser {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  salt: string;
  role: string;
  department: string;
  shift: string;
  status: string;
  created_at: number;
}

export function publicUser(user: DatabaseUser) {
  return { id: user.id, name: user.name, email: user.email, role: user.role === "admin" ? "Admin" : "Staff", department: user.department, shift: user.shift, status: user.status };
}

export function listTasks() {
  return rows("SELECT * FROM tasks ORDER BY created_at DESC").map(mapTask);
}

function mapTask(row: Record<string, unknown>) {
  return { id: row.id, title: row.title, detail: row.detail, status: row.status, priority: row.priority, due: row.due };
}

export function listReports() {
  return rows("SELECT * FROM reports ORDER BY date_iso DESC, created_at DESC").map(mapReport);
}

function mapReport(row: Record<string, unknown>) {
  return {
    id: row.id,
    dateIso: row.date_iso,
    shift: row.shift,
    reporter: row.reporter_name,
    occupancy: `${row.occupancy_pct}%`,
    income: formatUsd(Number(row.income)),
    incomeAmount: Number(row.income),
    status: row.status === "draft" ? "Draft" : row.status === "approved" ? "Approved" : "Submitted",
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function listInquiries() {
  return rows("SELECT * FROM inquiries ORDER BY created_at DESC").map((row) => ({
    id: row.id,
    dateIso: row.date_iso,
    channel: row.channel,
    category: row.category,
    guestName: row.guest_name,
    details: row.details,
    outcome: row.outcome,
    followUp: row.follow_up,
    staff: row.staff,
  }));
}

export function listFeedback() {
  return rows("SELECT * FROM feedback ORDER BY created_at DESC").map((row) => ({
    id: row.id,
    dateIso: row.date_iso,
    channel: row.channel,
    guestName: row.guest_name,
    room: row.room,
    comment: row.comment,
    staff: row.staff,
  }));
}

export function listFinance() {
  return rows("SELECT * FROM finance ORDER BY date_iso DESC, created_at DESC").map((row) => ({
    id: row.id,
    dateIso: row.date_iso,
    shift: row.shift,
    type: row.type,
    category: row.category,
    description: row.description,
    amount: Number(row.amount),
    staff: row.staff,
  }));
}

export function listAudit() {
  return rows("SELECT * FROM audit ORDER BY id DESC LIMIT 200").map((row) => ({
    id: `EV-${row.id}`,
    dateIso: new Date(Number(row.ts)).toISOString().slice(0, 10),
    time: new Date(Number(row.ts)).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    user: row.user_name,
    event: row.event,
    area: row.area,
  }));
}

export function listUsers() {
  return rows("SELECT * FROM users ORDER BY created_at ASC").map((row) => publicUser(row as unknown as DatabaseUser));
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export function nextPrefixedId(table: string, column: string, prefix: string) {
  const rowsForIds = db.prepare(`SELECT ${column} AS id FROM ${table} WHERE ${column} LIKE ?`).all(`${prefix}%`) as Array<{ id: string }>;
  let max = 0;
  let width = 3;
  for (const row of rowsForIds) {
    const suffix = row.id.slice(prefix.length);
    const numeric = Number(suffix);
    if (Number.isFinite(numeric) && numeric > max) {
      max = numeric;
      width = Math.max(width, suffix.length);
    }
  }
  return `${prefix}${String(max + 1).padStart(width, "0")}`;
}

export function audit(userId: number | null, userName: string, event: string, area: string) {
  db.prepare("INSERT INTO audit (ts, user_id, user_name, event, area) VALUES (?, ?, ?, ?, ?)").run(Date.now(), userId, userName, event, area);
}

export function estimateIncome(occupied: number) {
  return Math.round((occupied * 61.2) / 10) * 10;
}

export function formatUsd(amount: number) {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

// ---------------------------------------------------------------------------
// Seed — only when the database is empty
// ---------------------------------------------------------------------------

export function seedIfEmpty() {
  const count = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  if (count > 0) return;

  const now = Date.now();
  const insertUser = db.prepare("INSERT INTO users (name, email, password_hash, salt, role, department, shift, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

  const admin = hashPassword("admin123");
  insertUser.run("John Doe", "admin@hotel.com", admin.hash, admin.salt, "admin", "Front office", "Morning", "active", now);
  const adminRow = findUserByEmail("admin@hotel.com")!;

  const staff = hashPassword("staff123");
  insertUser.run("Sokha Chan", "staff@hotel.com", staff.hash, staff.salt, "staff", "Front office", "Afternoon", "active", now);
  const staffRow = findUserByEmail("staff@hotel.com")!;

  const trainee = hashPassword("trainee123");
  insertUser.run("Nary Chann", "nary@hotel.com", trainee.hash, trainee.salt, "staff", "Front office", "Night", "pending", now);

  const insertTask = db.prepare("INSERT INTO tasks (id, title, detail, status, priority, due, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insertTask.run("TSK-104", "Verify late check-outs", "Rooms 302, 415 and 608", "Pending", "High", "10:30", "John Doe", now - 3600_000);
  insertTask.run("TSK-103", "Prepare VIP arrival notes", "Ms. Sokha · room 706", "In Progress", "High", "11:00", "John Doe", now - 7200_000);
  insertTask.run("TSK-102", "Review card settlement", "POS batch #8841", "In Progress", "Med", "12:00", "John Doe", now - 10_800_000);
  insertTask.run("TSK-101", "Restock welcome cards", "Front desk cabinet", "Completed", "Low", "08:45", "John Doe", now - 14_400_000);

  const insertReport = db.prepare(
    "INSERT INTO reports (id, date_iso, shift, reporter_id, reporter_name, total_rooms, occupied, occupancy_pct, income, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const seedDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10); // yesterday
  const reportSeed = [
    ["RPT-2404", seedDate, "Morning", adminRow.id, "John Doe", 100, 85, "submitted", "VIP arrival handled at check-in."],
    ["RPT-2403", seedDate, "Afternoon", staffRow.id, "Sokha Chan", 100, 81, "submitted", "Two walk-ins accommodated."],
    ["RPT-2402", seedDate, "Night", staffRow.id, "Sokha Chan", 100, 82, "approved", "Night audit balanced."],
    ["RPT-2401", new Date(Date.now() - 172_800_000).toISOString().slice(0, 10), "Morning", adminRow.id, "John Doe", 100, 77, "draft", ""],
  ] as const;
  for (const [id, dateIso, shift, reporterId, reporterName, total, occupied, status, notes] of reportSeed) {
    insertReport.run(id, dateIso, shift, reporterId, reporterName, total, occupied, Math.round((occupied / total) * 100), estimateIncome(occupied), status, notes, Date.parse(`${dateIso}T09:40:00`));
  }

  const insertInquiry = db.prepare("INSERT INTO inquiries (id, date_iso, channel, category, guest_name, details, outcome, follow_up, staff, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertInquiry.run("INQ-119", seedDate, "Phone", "Room info", "A. Sok", "Airport transfer at 17:00", "resolved", "", "John Doe", now - 54_000_000);
  insertInquiry.run("INQ-118", seedDate, "WhatsApp", "Booking", "M. Lina", "Extend stay by 2 nights", "resolved", "", "John Doe", now - 58_000_000);
  insertInquiry.run("INQ-117", seedDate, "Front desk", "Special", "K. Narin", "Quiet room request", "follow_up", "Room move", "Sokha Chan", now - 63_000_000);

  const insertFeedback = db.prepare("INSERT INTO feedback (id, date_iso, channel, guest_name, room, comment, staff, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insertFeedback.run("FB-032", seedDate, "Front desk", "D. Vichea", "412", "Check-in was quick and the room was ready early. Very much appreciated.", "Sokha Chan", now - 50_000_000);
  insertFeedback.run("FB-031", seedDate, "Review card", "Anonymous", "", "Loved the breakfast; lobby coffee could start earlier.", "John Doe", now - 66_000_000);

  const insertFinance = db.prepare("INSERT INTO finance (id, date_iso, shift, type, category, description, amount, staff, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertFinance.run("INC-031", seedDate, "Morning", "income", "Room nights", "Room revenue", 4680, "John Doe", now - 52_000_000);
  insertFinance.run("INC-030", seedDate, "Afternoon", "income", "Restaurant", "Dinner service", 520, "Sokha Chan", now - 47_000_000);
  insertFinance.run("INC-029", seedDate, "Night", "income", "Airport transfer", "Two transfers", 120, "Sokha Chan", now - 43_000_000);
  insertFinance.run("EXP-021", seedDate, "Morning", "expense", "Supplies", "Welcome cards", 84, "John Doe", now - 51_000_000);
  insertFinance.run("EXP-020", seedDate, "Night", "expense", "Transport", "Guest transfer", 32, "Sokha Chan", now - 42_000_000);
  insertFinance.run("REF-008", seedDate, "Morning", "refund", "Rate adjustment", "Room 412 rate fix", 75, "John Doe", now - 49_000_000);

  audit(adminRow.id, "John Doe", "Seeded the FDR database", "Access");
  console.log("[fdr] Database seeded with demo accounts and sample records.");
}
