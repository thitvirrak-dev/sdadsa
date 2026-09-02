// FDR session store — the client's view of the real backend.
// All data lives in SQLite on the server; this context handles auth,
// fetching the combined state, and running mutations.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type AuditDto, type FeedbackDto, type FinanceDto, type InquiryDto, type ReportDto, type SessionUser, type TaskDto } from "./api";

export type Shift = "Morning" | "Afternoon" | "Night";
export type TaskStatus = "Pending" | "In Progress" | "Completed";
export type TaskPriority = "High" | "Med" | "Low";

export type FdrTask = TaskDto;
export type ShiftReport = ReportDto;
export type AuditEvent = AuditDto;
export type Inquiry = InquiryDto;
export type FeedbackEntry = FeedbackDto;
export type FinanceEntry = FinanceDto;
export type AppUser = SessionUser;

export interface ReportInput {
  dateIso: string;
  shift: Shift;
  totalRooms: number;
  occupied: number;
  notes: string;
}

export type LoginFailure = "invalid" | "pending" | "rejected" | "network";

interface StoreValue {
  user: AppUser | null;
  loading: boolean;
  tasks: FdrTask[];
  reports: ShiftReport[];
  audit: AuditEvent[];
  inquiries: Inquiry[];
  feedback: FeedbackEntry[];
  finance: FinanceEntry[];
  users: AppUser[];
  pendingUsers: AppUser[];
  signIn: (email: string, password: string) => Promise<{ ok: boolean; reason?: LoginFailure }>;
  signOut: () => Promise<void>;
  register: (input: { name: string; email: string; password: string; department: string; shift: string }) => Promise<void>;
  refresh: () => Promise<void>;
  addTask: (task: { title: string; detail: string; priority: TaskPriority; due: string }) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  submitReport: (input: ReportInput) => Promise<ShiftReport | null>;
  saveDraft: (input: ReportInput) => Promise<void>;
  approveReport: (id: string) => Promise<void>;
  logInquiry: (input: { channel: string; category: string; guestName: string; details: string; outcome: "resolved" | "follow_up"; followUp: string }) => Promise<void>;
  addFeedback: (input: { dateIso: string; channel: string; guestName: string; room: string; comment: string }) => Promise<void>;
  addFinanceEntry: (input: { type: "income" | "expense" | "refund"; dateIso: string; shift: Shift; category: string; description: string; amount: number }) => Promise<void>;
  setUserStatus: (id: number, status: "active" | "rejected" | "pending") => Promise<void>;
}

const StoreContext = createContext<StoreValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<FdrTask[]>([]);
  const [reports, setReports] = useState<ShiftReport[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [finance, setFinance] = useState<FinanceEntry[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    api
      .me()
      .then((response) => setUser(response.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const refresh = useCallback(async () => {
    const state = await api.state();
    setTasks(state.tasks);
    setReports(state.reports);
    setAudit(state.audit);
    setInquiries(state.inquiries);
    setFeedback(state.feedback);
    setFinance(state.finance);
    setUsers(state.users);
    setPendingUsers(state.pendingUsers);
  }, []);

  useEffect(() => {
    if (!user) return;
    refresh().catch(() => {
      /* session may have expired — next mutation will surface it */
    });
  }, [user, refresh]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ ok: boolean; reason?: LoginFailure }> => {
    try {
      const response = await api.login(email, password);
      setUser(response.user);
      return { ok: true };
    } catch (error) {
      const status = error instanceof Error && "status" in error ? (error as { status: number }).status : 0;
      if (status === 403) return { ok: false, reason: /awaiting/i.test((error as Error).message) ? "pending" : "rejected" };
      if (status === 401) return { ok: false, reason: "invalid" };
      return { ok: false, reason: "network" };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setTasks([]);
      setReports([]);
      setAudit([]);
      setInquiries([]);
      setFeedback([]);
      setFinance([]);
      setUsers([]);
      setPendingUsers([]);
    }
  }, []);

  const register = useCallback(async (input: { name: string; email: string; password: string; department: string; shift: string }) => {
    await api.register(input);
  }, []);

  const addTask = useCallback(
    async (task: { title: string; detail: string; priority: TaskPriority; due: string }) => {
      await api.addTask(task);
      await refresh();
    },
    [refresh],
  );

  const updateTaskStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      await api.updateTaskStatus(id, status);
      await refresh();
    },
    [refresh],
  );

  const submitReport = useCallback(
    async (input: ReportInput) => {
      const created = await api.submitReport(input);
      await refresh();
      return reports.find((report) => report.id === created.id) ?? null;
    },
    [refresh, reports],
  );

  const saveDraft = useCallback(
    async (input: ReportInput) => {
      await api.saveDraftReport(input);
      await refresh();
    },
    [refresh],
  );

  const approveReport = useCallback(
    async (id: string) => {
      await api.setReportStatus(id, "approved");
      await refresh();
    },
    [refresh],
  );

  const logInquiry = useCallback(
    async (input: { channel: string; category: string; guestName: string; details: string; outcome: "resolved" | "follow_up"; followUp: string }) => {
      await api.addInquiry(input);
      await refresh();
    },
    [refresh],
  );

  const addFeedback = useCallback(
    async (input: { dateIso: string; channel: string; guestName: string; room: string; comment: string }) => {
      await api.addFeedback(input);
      await refresh();
    },
    [refresh],
  );

  const addFinanceEntry = useCallback(
    async (input: { type: "income" | "expense" | "refund"; dateIso: string; shift: Shift; category: string; description: string; amount: number }) => {
      await api.addFinanceEntry(input);
      await refresh();
    },
    [refresh],
  );

  const setUserStatus = useCallback(
    async (id: number, status: "active" | "rejected" | "pending") => {
      await api.setUserStatus(id, status);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<StoreValue>(
    () => ({
      user,
      loading,
      tasks,
      reports,
      audit,
      inquiries,
      feedback,
      finance,
      users,
      pendingUsers,
      signIn,
      signOut,
      register,
      refresh,
      addTask,
      updateTaskStatus,
      submitReport,
      saveDraft,
      approveReport,
      logInquiry,
      addFeedback,
      addFinanceEntry,
      setUserStatus,
    }),
    [user, loading, tasks, reports, audit, inquiries, feedback, finance, users, pendingUsers, signIn, signOut, register, refresh, addTask, updateTaskStatus, submitReport, saveDraft, approveReport, logInquiry, addFeedback, addFinanceEntry, setUserStatus],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}

export function todayIso() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}
