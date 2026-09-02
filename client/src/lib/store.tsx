// FDR operations store: the app's living shift book.
// Persists accounts, session, tasks, submitted reports, and the audit trail to localStorage,
// so every handoff survives a page reload without needing a backend.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Shift = "Morning" | "Afternoon" | "Night";
export type TaskStatus = "Pending" | "In Progress" | "Completed";
export type TaskPriority = "High" | "Med" | "Low";
export type ReportStatus = "Submitted" | "Approved" | "Draft";
export type AuditArea = "Report" | "Finance" | "Tasks" | "Access";

export interface User {
  name: string;
  email: string;
  role: "Admin" | "Staff";
  department: string;
}

export interface FdrTask {
  id: string;
  title: string;
  detail: string;
  status: TaskStatus;
  priority: TaskPriority;
  due: string;
}

export interface ShiftReport {
  id: string;
  dateIso: string;
  shift: Shift;
  reporter: string;
  occupancy: string;
  income: string;
  status: ReportStatus;
  notes: string;
  createdAt: number;
}

export interface AuditEvent {
  id: string;
  dateIso: string;
  time: string;
  user: string;
  event: string;
  area: AuditArea;
}

export interface ReportInput {
  dateIso: string;
  shift: Shift;
  totalRooms: number;
  occupied: number;
  notes: string;
}

interface FdrState {
  tasks: FdrTask[];
  reports: ShiftReport[];
  audit: AuditEvent[];
}

interface StoreValue extends FdrState {
  user: User | null;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
  addTask: (task: Omit<FdrTask, "id">) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  submitReport: (input: ReportInput) => ShiftReport;
  saveDraft: (input: ReportInput) => void;
}

const STORAGE_KEY = "fdr.operations.v1";
const SESSION_KEY = "fdr.session.v1";

// Demo staff accounts (client-side demo only — no real credentials involved).
const accounts: Array<{ email: string; password: string; profile: User }> = [
  { email: "admin@hotel.com", password: "admin123", profile: { name: "John Doe", email: "admin@hotel.com", role: "Admin", department: "Front office" } },
  { email: "staff@hotel.com", password: "staff123", profile: { name: "Sokha Chan", email: "staff@hotel.com", role: "Staff", department: "Front office" } },
];

function seedTasks(): FdrTask[] {
  return [
    { id: "TSK-104", title: "Verify late check-outs", detail: "Rooms 302, 415 and 608", status: "Pending", priority: "High", due: "10:30" },
    { id: "TSK-103", title: "Prepare VIP arrival notes", detail: "Ms. Sokha · room 706", status: "In Progress", priority: "High", due: "11:00" },
    { id: "TSK-102", title: "Review card settlement", detail: "POS batch #8841", status: "In Progress", priority: "Med", due: "12:00" },
    { id: "TSK-101", title: "Restock welcome cards", detail: "Front desk cabinet", status: "Completed", priority: "Low", due: "08:45" },
  ];
}

function seedReports(): ShiftReport[] {
  return [
    { id: "RPT-2408", dateIso: "2026-08-30", shift: "Morning", reporter: "John Doe", occupancy: "85%", income: "$5,200", status: "Submitted", notes: "VIP arrival handled at check-in.", createdAt: Date.parse("2026-08-30T09:40:00") },
    { id: "RPT-2407", dateIso: "2026-08-29", shift: "Night", reporter: "Nary Chann", occupancy: "82%", income: "$4,880", status: "Submitted", notes: "Night audit balanced.", createdAt: Date.parse("2026-08-29T23:50:00") },
    { id: "RPT-2406", dateIso: "2026-08-29", shift: "Afternoon", reporter: "Dara Lim", occupancy: "79%", income: "$4,460", status: "Approved", notes: "Two walk-ins accommodated.", createdAt: Date.parse("2026-08-29T15:05:00") },
    { id: "RPT-2405", dateIso: "2026-08-28", shift: "Morning", reporter: "John Doe", occupancy: "77%", income: "$4,110", status: "Draft", notes: "", createdAt: Date.parse("2026-08-28T08:20:00") },
  ];
}

function seedAudit(): AuditEvent[] {
  return [
    { id: "EV-904", dateIso: "2026-08-30", time: "09:42", user: "John Doe", event: "Updated cash variance", area: "Finance" },
    { id: "EV-903", dateIso: "2026-08-30", time: "09:18", user: "Dara Lim", event: "Submitted shift report RPT-2406", area: "Report" },
    { id: "EV-902", dateIso: "2026-08-30", time: "08:57", user: "John Doe", event: "Completed task TSK-101", area: "Tasks" },
    { id: "EV-901", dateIso: "2026-08-30", time: "08:46", user: "Nary Chann", event: "Signed in", area: "Access" },
  ];
}

function loadState(): FdrState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FdrState;
      if (Array.isArray(parsed.tasks) && Array.isArray(parsed.reports) && Array.isArray(parsed.audit)) return parsed;
    }
  } catch {
    /* fall through to seed */
  }
  return { tasks: seedTasks(), reports: seedReports(), audit: seedAudit() };
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function nowClock() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function todayIso() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function nextId(prefix: string, ids: string[]) {
  const peak = ids.reduce((max, id) => {
    const numeric = Number(id.replace(prefix, ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0);
  return `${prefix}${peak + 1}`;
}

function auditEntry(state: FdrState, user: User | null, event: string, area: AuditArea): AuditEvent {
  return {
    id: nextId("EV-", state.audit.map((item) => item.id)),
    dateIso: todayIso(),
    time: nowClock(),
    user: user?.name ?? "Front desk",
    event,
    area,
  };
}

function occupancyPct(totalRooms: number, occupied: number) {
  return totalRooms ? Math.min(100, Math.round((occupied / totalRooms) * 100)) : 0;
}

function estimateIncome(occupied: number) {
  return `$${(Math.round((occupied * 61.2) / 10) * 10).toLocaleString("en-US")}`;
}

const StoreContext = createContext<StoreValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FdrState>(loadState);
  const [user, setUser] = useState<User | null>(loadSession);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — session-only mode */
    }
  }, [state]);

  const signIn = useCallback(
    (email: string, password: string) => {
      const match = accounts.find((account) => account.email === email && account.password === password);
      if (!match) return false;
      setUser(match.profile);
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(match.profile));
      } catch {
        /* ignore */
      }
      setState((current) => ({ ...current, audit: [auditEntry(current, match.profile, "Signed in", "Access"), ...current.audit] }));
      return true;
    },
    [],
  );

  const signOut = useCallback(() => {
    setState((current) => ({ ...current, audit: [auditEntry(current, user, "Signed out", "Access"), ...current.audit] }));
    setUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, [user]);

  const addTask = useCallback(
    (task: Omit<FdrTask, "id">) => {
      setState((current) => ({
        ...current,
        tasks: [{ ...task, id: nextId("TSK-", current.tasks.map((item) => item.id)) }, ...current.tasks],
        audit: [auditEntry(current, user, `Added task "${task.title}"`, "Tasks"), ...current.audit],
      }));
    },
    [user],
  );

  const updateTaskStatus = useCallback(
    (id: string, status: TaskStatus) => {
      setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) => (task.id === id ? { ...task, status } : task)),
        audit: [auditEntry(current, user, `Task ${id} → ${status}`, "Tasks"), ...current.audit],
      }));
    },
    [user],
  );

  const submitReport = useCallback(
    (input: ReportInput) => {
      const report: ShiftReport = {
        id: nextId("RPT-", state.reports.map((item) => item.id)),
        dateIso: input.dateIso,
        shift: input.shift,
        reporter: user?.name ?? "Front desk",
        occupancy: `${occupancyPct(input.totalRooms, input.occupied)}%`,
        income: estimateIncome(input.occupied),
        status: "Submitted",
        notes: input.notes.trim(),
        createdAt: Date.now(),
      };
      setState((current) => ({
        ...current,
        reports: [report, ...current.reports],
        audit: [auditEntry(current, user, `Submitted shift report ${report.id}`, "Report"), ...current.audit],
      }));
      return report;
    },
    [state, user],
  );

  const saveDraft = useCallback(
    (input: ReportInput) => {
      setState((current) => {
        const existing = current.reports.find((report) => report.status === "Draft" && report.dateIso === input.dateIso && report.shift === input.shift);
        const draft: ShiftReport = existing
          ? { ...existing, occupancy: `${occupancyPct(input.totalRooms, input.occupied)}%`, notes: input.notes.trim() }
          : {
              id: nextId("RPT-", current.reports.map((item) => item.id)),
              dateIso: input.dateIso,
              shift: input.shift,
              reporter: user?.name ?? "Front desk",
              occupancy: `${occupancyPct(input.totalRooms, input.occupied)}%`,
              income: estimateIncome(input.occupied),
              status: "Draft",
              notes: input.notes.trim(),
              createdAt: Date.now(),
            };
        return { ...current, reports: [draft, ...current.reports.filter((report) => report !== existing)] };
      });
    },
    [user],
  );

  const value = useMemo<StoreValue>(
    () => ({ ...state, user, signIn, signOut, addTask, updateTaskStatus, submitReport, saveDraft }),
    [state, user, signIn, signOut, addTask, updateTaskStatus, submitReport, saveDraft],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}
