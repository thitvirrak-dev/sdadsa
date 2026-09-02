// Typed fetch client for the FDR API. Cookies carry the session automatically.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options,
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    /* non-JSON response */
  }
  if (!response.ok) {
    const message = (body as { error?: string } | null)?.error ?? `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }
  return body as T;
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Staff";
  department: string;
  shift: string;
  status: string;
}

export interface LoginResult {
  ok: true;
}

export interface StateResponse {
  tasks: TaskDto[];
  reports: ReportDto[];
  inquiries: InquiryDto[];
  feedback: FeedbackDto[];
  finance: FinanceDto[];
  audit: AuditDto[];
  users: SessionUser[];
  pendingUsers: SessionUser[];
}

export interface TaskDto {
  id: string;
  title: string;
  detail: string;
  status: string;
  priority: string;
  due: string;
}

export interface ReportDto {
  id: string;
  dateIso: string;
  shift: string;
  reporter: string;
  occupancy: string;
  income: string;
  incomeAmount: number;
  status: string;
  notes: string;
  createdAt: number;
}

export interface InquiryDto {
  id: string;
  dateIso: string;
  channel: string;
  category: string;
  guestName: string;
  details: string;
  outcome: string;
  followUp: string;
  staff: string;
}

export interface FeedbackDto {
  id: string;
  dateIso: string;
  channel: string;
  guestName: string;
  room: string;
  comment: string;
  staff: string;
}

export interface FinanceDto {
  id: string;
  dateIso: string;
  shift: string;
  type: "income" | "expense" | "refund";
  category: string;
  description: string;
  amount: number;
  staff: string;
}

export interface AuditDto {
  id: string;
  dateIso: string;
  time: string;
  user: string;
  event: string;
  area: string;
}

export const api = {
  me: () => request<{ user: SessionUser | null }>("/api/auth/me"),
  login: (email: string, password: string) => request<{ user: SessionUser }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (input: { name: string; email: string; password: string; department: string; shift: string }) =>
    request<{ ok: true }>("/api/auth/register", { method: "POST", body: JSON.stringify(input) }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  state: () => request<StateResponse>("/api/state"),
  addTask: (input: { title: string; detail: string; priority: string; due: string }) => request<{ id: string }>("/api/tasks", { method: "POST", body: JSON.stringify(input) }),
  updateTaskStatus: (id: string, status: string) => request<{ ok: true }>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  submitReport: (input: { dateIso: string; shift: string; totalRooms: number; occupied: number; notes: string }) =>
    request<{ id: string }>("/api/reports", { method: "POST", body: JSON.stringify({ ...input, status: "submitted" }) }),
  saveDraftReport: (input: { dateIso: string; shift: string; totalRooms: number; occupied: number; notes: string }) =>
    request<{ id: string }>("/api/reports", { method: "POST", body: JSON.stringify({ ...input, status: "draft" }) }),
  setReportStatus: (id: string, status: "approved" | "submitted") => request<{ ok: true }>(`/api/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  addInquiry: (input: Record<string, unknown>) => request<{ id: string }>("/api/inquiries", { method: "POST", body: JSON.stringify(input) }),
  addFeedback: (input: Record<string, unknown>) => request<{ id: string }>("/api/feedback", { method: "POST", body: JSON.stringify(input) }),
  addFinanceEntry: (input: Record<string, unknown>) => request<{ id: string }>("/api/finance", { method: "POST", body: JSON.stringify(input) }),
  setUserStatus: (id: number, status: "active" | "rejected" | "pending") => request<{ ok: true }>(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
