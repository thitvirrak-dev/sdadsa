// Heritage Operations: hospitality editorial dashboard with navy + brass, Khmer-first labels, asymmetrical operations canvas, and restrained motion.
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  BedDouble,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Download,
  FileBarChart2,
  FileText,
  Handshake,
  History,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Printer,
  RefreshCcw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  SunMoon,
  UserPlus,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useStore, type AuditEvent, type FdrTask, type ReportInput, type ShiftReport, type Shift, type TaskPriority, type TaskStatus } from "@/lib/store";

type Language = "km" | "en";
type ViewKey =
  | "dashboard"
  | "report"
  | "shiftreports"
  | "tasks"
  | "financial"
  | "inquiries"
  | "closeout"
  | "feedback"
  | "monthly"
  | "yearly"
  | "history"
  | "audit"
  | "shifts"
  | "admin";

const heroImage = "/images/lobby-hero.jpg";
const receptionImage = "/images/reception-detail.jpg";
const keyTrayImage = "/images/key-tray.jpg";
const hallwayImage = "/images/hallway.jpg";
const sealImage = "/images/fdr-seal.svg";

const translations = {
  km: {
    appTitle: "របាយការណ៍ផ្នែកទទួលភ្ញៀវ",
    appSubtitle: "ប្រព័ន្ធរបាយការណ៍ និងប្រតិបត្តិការផ្នែកទទួលភ្ញៀវ",
    email: "អ៊ីមែល",
    password: "ពាក្យសម្ងាត់",
    shift: "វេន",
    signIn: "ចូលប្រើ",
    demoHint: "សាកល្បង: admin@hotel.com / admin123",
    noAccount: "មិនទាន់មានគណនី? ចុះឈ្មោះ",
    haveAccount: "មានគណនីរួចហើយ? ចូលប្រើ",
    registerTitle: "ចុះឈ្មោះ",
    registerSubtitle: "បង្កើតគណនី Staff (ត្រូវ Admin អនុម័ត)",
    name: "ឈ្មោះ",
    department: "ផ្នែក",
    registerBtn: "ចុះឈ្មោះ",
    navDashboard: "ផ្ទាំងគ្រប់គ្រង",
    navReport: "របាយការណ៍ប្រចាំថ្ងៃ",
    navShiftReports: "របាយការណ៍វេន",
    navTasks: "ភារកិច្ច",
    navFinancial: "ហិរញ្ញវត្ថុ",
    navInquiries: "សំណួរអតិថិជន",
    navCloseout: "បិទបញ្ជី FO",
    navHandover: "ប្រគល់វេន",
    navFeedback: "មតិភ្ញៀវ",
    navMonthly: "របាយការណ៍ប្រចាំខែ",
    navYearly: "របាយការណ៍ប្រចាំឆ្នាំ",
    navHistory: "ប្រវត្តិរបាយការណ៍",
    navAudit: "កំណត់ហេតុសវនកម្ម",
    navShifts: "គ្រប់គ្រងវេន",
    navAdmin: "អ្នកគ្រប់គ្រង",
    status: "ស្ថានភាព",
    morningShift: "វេនព្រឹក",
    afternoonShift: "វេនរសៀល",
    nightShift: "វេនយប់",
    pageDashboard: "ផ្ទាំងគ្រប់គ្រង",
    crumbOverview: "ទិដ្ឋភាពទូទៅ",
    occupancy: "អត្រាកាន់កាប់",
    todayIncome: "ចំណូលថ្ងៃនេះ",
    openTasks: "ភារកិច្ចមិនទាន់រួច",
    inquiriesToday: "សំណួរថ្ងៃនេះ",
    occupancyTrend: "និន្នាការអត្រាកាន់កាប់ (៧ថ្ងៃ)",
    alerts: "ការជូនដំណឹង",
    recentReports: "របាយការណ៍ថ្មីៗ",
    viewAll: "មើលទាំងអស់",
    pageReport: "របាយការណ៍ប្រចាំថ្ងៃ",
    pageShiftReports: "របាយការណ៍វេន",
    pageTasks: "ភារកិច្ច",
    pageFinancial: "ហិរញ្ញវត្ថុ",
    pageInquiries: "សំណួរអតិថិជន",
    pageCloseout: "បិទបញ្ជី និងប្រគល់វេន",
    pageFeedback: "មតិភ្ញៀវ",
    pageMonthly: "របាយការណ៍ប្រចាំខែ",
    pageYearly: "របាយការណ៍ប្រចាំឆ្នាំ",
    pageHistory: "ប្រវត្តិរបាយការណ៍",
    pageAudit: "កំណត់ហេតុសវនកម្ម",
    pageShifts: "គ្រប់គ្រងវេន",
    pageAdmin: "ការកំណត់ប្រព័ន្ធ",
    reportInfo: "ព័ត៌មានរបាយការណ៍",
    date: "កាលបរិច្ឆេទ",
    reporter: "អ្នករាយការណ៍",
    totalRooms: "បន្ទប់សរុប",
    occupied: "កាន់កាប់",
    vacant: "ទំនេរ",
    ooo: "មិនអាចប្រើ",
    arrivals: "មកដល់",
    departures: "ចាកចេញ",
    vip: "VIP",
    longStay: "ស្នាក់នៅយូរ",
    walkIn: "មកដោយផ្ទាល់",
    noShow: "មិនមក",
    cancellations: "លុបចោល",
    occupancyPct: "អត្រាកាន់កាប់ %",
    notesIssues: "កំណត់ចំណាំ និងបញ្ហា",
    shiftNotes: "កំណត់ចំណាំវេន",
    issuesIncidents: "បញ្ហា / ឧប្បត្តិហេតុ",
    saveDraft: "រក្សាទុកសេចក្តីព្រាង",
    submitReport: "ដាក់ស្នើរបាយការណ៍",
    selectDate: "ជ្រើសរើសកាលបរិច្ឆេទ",
    dailyCombined: "របាយការណ៍ថ្ងៃ (៣ វេន)",
    generateReport: "បង្កើតរបាយការណ៍",
    printReport: "បោះពុម្ព",
    newTask: "ភារកិច្ចថ្មី",
    allStatus: "ស្ថានភាពទាំងអស់",
    pending: "រង់ចាំ",
    inProgress: "កំពុងធ្វើ",
    completed: "បានបញ្ចប់",
    allPriority: "អាទិភាពទាំងអស់",
    high: "ខ្ពស់",
    med: "មធ្យម",
    low: "ទាប",
    addIncome: "បន្ថែមចំណូល",
    addExpense: "បន្ថែមចំណាយ",
    addRefund: "បន្ថែមសងប្រាក់",
    incomeTab: "ចំណូល",
    expensesTab: "ចំណាយ",
    refundsTab: "សងប្រាក់",
    cashTab: "ភាពខុសគ្នាសាច់ប្រាក់",
    deepCalc: "គណនាស៊ីជម្រៅ",
    cashTracking: "តាមដានសាច់ប្រាក់",
    incomeSources: "ប្រភពចំណូល",
    expenses: "ចំណាយ",
    refunds: "សងប្រាក់",
    checkVariance: "ពិនិត្យភាពខុសគ្នា",
    save: "រក្សាទុក",
    logInquiry: "កត់ត្រាសំណួរ",
    allCategories: "ប្រភេទទាំងអស់",
    allOutcomes: "លទ្ធផលទាំងអស់",
    customerFeedback: "មតិ និងបទពិសោធន៍ភ្ញៀវ",
    addFeedback: "កត់ត្រាមតិ",
    noFeedback: "មិនទាន់មានមតិភ្ញៀវដែលបានកត់ត្រាទេ។",
    addShift: "បន្ថែមវេន",
    refreshed: "ទិន្នន័យបានធ្វើបច្ចុប្បន្នភាព",
    saved: "បានរក្សាទុកដោយជោគជ័យ",
    submitted: "របាយការណ៍បានដាក់ស្នើ",
  },
  en: {
    appTitle: "Front Desk Report",
    appSubtitle: "Front office reporting & operations system",
    email: "Email",
    password: "Password",
    shift: "Shift",
    signIn: "Sign in",
    demoHint: "Demo: admin@hotel.com / admin123",
    noAccount: "Don't have an account? Register",
    haveAccount: "Already have an account? Sign in",
    registerTitle: "Register",
    registerSubtitle: "Create a staff account (admin approval required)",
    name: "Name",
    department: "Department",
    registerBtn: "Create account",
    navDashboard: "Dashboard",
    navReport: "Daily report",
    navShiftReports: "Shift reports",
    navTasks: "Tasks",
    navFinancial: "Finance",
    navInquiries: "Guest inquiries",
    navCloseout: "FO closeout",
    navHandover: "Handover",
    navFeedback: "Guest feedback",
    navMonthly: "Monthly report",
    navYearly: "Yearly report",
    navHistory: "Report history",
    navAudit: "Audit log",
    navShifts: "Shift management",
    navAdmin: "Administration",
    status: "Status",
    morningShift: "Morning shift",
    afternoonShift: "Afternoon shift",
    nightShift: "Night shift",
    pageDashboard: "Dashboard",
    crumbOverview: "Overview",
    occupancy: "Occupancy",
    todayIncome: "Today’s income",
    openTasks: "Open tasks",
    inquiriesToday: "Inquiries today",
    occupancyTrend: "Occupancy trend (7 days)",
    alerts: "Alerts",
    recentReports: "Recent reports",
    viewAll: "View all",
    pageReport: "Daily report",
    pageShiftReports: "Shift reports",
    pageTasks: "Tasks",
    pageFinancial: "Finance",
    pageInquiries: "Guest inquiries",
    pageCloseout: "Closeout & handover",
    pageFeedback: "Guest feedback",
    pageMonthly: "Monthly report",
    pageYearly: "Yearly report",
    pageHistory: "Report history",
    pageAudit: "Audit log",
    pageShifts: "Shift management",
    pageAdmin: "System settings",
    reportInfo: "Report information",
    date: "Date",
    reporter: "Reporter",
    totalRooms: "Total rooms",
    occupied: "Occupied",
    vacant: "Vacant",
    ooo: "Out of order",
    arrivals: "Arrivals",
    departures: "Departures",
    vip: "VIP",
    longStay: "Long stay",
    walkIn: "Walk-ins",
    noShow: "No-shows",
    cancellations: "Cancellations",
    occupancyPct: "Occupancy %",
    notesIssues: "Notes & issues",
    shiftNotes: "Shift notes",
    issuesIncidents: "Issues / incidents",
    saveDraft: "Save draft",
    submitReport: "Submit report",
    selectDate: "Select date",
    dailyCombined: "Daily combined (3 shifts)",
    generateReport: "Generate report",
    printReport: "Print",
    newTask: "New task",
    allStatus: "All statuses",
    pending: "Pending",
    inProgress: "In progress",
    completed: "Completed",
    allPriority: "All priorities",
    high: "High",
    med: "Medium",
    low: "Low",
    addIncome: "Add income",
    addExpense: "Add expense",
    addRefund: "Add refund",
    incomeTab: "Income",
    expensesTab: "Expenses",
    refundsTab: "Refunds",
    cashTab: "Cash variance",
    deepCalc: "Deep calculation",
    cashTracking: "Cash tracking",
    incomeSources: "Income sources",
    expenses: "Expenses",
    refunds: "Refunds",
    checkVariance: "Check variance",
    save: "Save",
    logInquiry: "Log inquiry",
    allCategories: "All categories",
    allOutcomes: "All outcomes",
    customerFeedback: "Guest feedback & experience",
    addFeedback: "Log feedback",
    noFeedback: "No guest feedback has been logged yet.",
    addShift: "Add shift",
    refreshed: "Data refreshed",
    saved: "Saved successfully",
    submitted: "Report submitted",
  },
} as const;

const navItems: { key: ViewKey; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: keyof typeof translations.en }[] = [
  { key: "dashboard", icon: LayoutDashboard, label: "navDashboard" },
  { key: "report", icon: FileText, label: "navReport" },
  { key: "shiftreports", icon: LayersIcon, label: "navShiftReports" },
  { key: "tasks", icon: ClipboardList, label: "navTasks" },
  { key: "financial", icon: WalletCards, label: "navFinancial" },
  { key: "inquiries", icon: MessageCircle, label: "navInquiries" },
  { key: "closeout", icon: ClipboardCheck, label: "navCloseout" },
  { key: "feedback", icon: Star, label: "navFeedback" },
  { key: "monthly", icon: CalendarDays, label: "navMonthly" },
  { key: "yearly", icon: BarChart3, label: "navYearly" },
  { key: "history", icon: History, label: "navHistory" },
  { key: "audit", icon: ShieldCheck, label: "navAudit" },
  { key: "shifts", icon: Users, label: "navShifts" },
  { key: "admin", icon: Settings, label: "navAdmin" },
];

const titles: Record<ViewKey, keyof typeof translations.en> = {
  dashboard: "pageDashboard",
  report: "pageReport",
  shiftreports: "pageShiftReports",
  tasks: "pageTasks",
  financial: "pageFinancial",
  inquiries: "pageInquiries",
  closeout: "pageCloseout",
  feedback: "pageFeedback",
  monthly: "pageMonthly",
  yearly: "pageYearly",
  history: "pageHistory",
  audit: "pageAudit",
  shifts: "pageShifts",
  admin: "pageAdmin",
};

function LayersIcon(props: React.ComponentProps<typeof Activity>) {
  return <Activity {...props} />;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date = new Date(), language: Language = "km") {
  return new Intl.DateTimeFormat(language === "km" ? "km-KH" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Home() {
  const { user, tasks, reports, audit, signIn, signOut, addTask, updateTaskStatus, submitReport, saveDraft } = useStore();
  const [language, setLanguage] = useState<Language>("km");
  const [registering, setRegistering] = useState(false);
  const [view, setView] = useState<ViewKey>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [shift, setShift] = useState<Shift>("Morning");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const t = translations[language];
  const authenticated = Boolean(user);

  useEffect(() => {
    document.documentElement.lang = language === "km" ? "km" : "en";
  }, [language]);

  const navigate = (next: ViewKey) => {
    setView(next);
    setMobileNavOpen(false);
    setNotificationsOpen(false);
  };

  const toggleLanguage = () => setLanguage(language === "km" ? "en" : "km");

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");
    if (!signIn(email, password)) {
      toast.error(language === "km" ? "អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ" : "That email or password doesn't match our records");
      return;
    }
    setShift((String(data.get("shift") ?? "Morning") || "Morning") as Shift);
    toast.success(language === "km" ? "សូមស្វាគមន៍មកកាន់ FDR" : "Welcome to FDR");
  };

  const handleRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegistering(false);
    toast.success(language === "km" ? "សំណើចុះឈ្មោះបានផ្ញើទៅ Admin" : "Registration request sent to admin");
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      toast.success(t.refreshed);
    }, 600);
  };

  const handleUpdateTaskStatus = (id: string, status: TaskStatus) => {
    updateTaskStatus(id, status);
    toast.success(language === "km" ? "ស្ថានភាពភារកិច្ចបានធ្វើបច្ចុប្បន្នភាព" : "Task status updated");
  };

  const handleAddTask = (title: string, priority: TaskPriority, due: string) => {
    addTask({ title, detail: language === "km" ? "បានបន្ថែមពីផ្ទាំងគ្រប់គ្រង" : "Added from dashboard", status: "Pending", priority, due });
    setTaskModalOpen(false);
    toast.success(language === "km" ? "បានបន្ថែមភារកិច្ចថ្មី" : "New task added");
  };

  if (!authenticated) {
    return registering ? (
      <RegisterScreen language={language} t={t} onLanguageToggle={toggleLanguage} onBack={() => setRegistering(false)} onSubmit={handleRegister} />
    ) : (
      <LoginScreen language={language} t={t} onLanguageToggle={toggleLanguage} onRegister={() => setRegistering(true)} onSubmit={handleLogin} />
    );
  }

  return (
    <div className="app-shell">
      <aside className={cn("sidebar", sidebarCollapsed && "sidebar-collapsed", mobileNavOpen && "sidebar-mobile-open")}>
        <div className="sidebar-header">
          <button className="brand-lockup" onClick={() => navigate("dashboard")} aria-label="FDR dashboard">
            <span className="rail-seal seal-emblem"><img src={sealImage} alt="" className="brand-seal" /></span>
            <span className="brand-wordmark">FDR</span>
          </button>
          <button className="icon-button sidebar-collapse-button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}>
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <div className="rail-kicker">{language === "km" ? "ប្រព័ន្ធប្រតិបត្តិការ" : "OPERATIONS DESK"}</div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => navigate(key)} className={cn("nav-item", view === key && "nav-item-active")} title={sidebarCollapsed ? String(t[label]) : undefined}>
              <Icon size={17} strokeWidth={1.8} />
              <span>{t[label]}</span>
              {key === "tasks" && <em className="nav-count">{tasks.filter((task) => task.status !== "Completed").length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{(user?.name ?? "JD").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
            <div className="user-details"><strong>{user?.name}</strong><span>{user?.role} · {shift}</span></div>
          </div>
          <button className="icon-button logout-button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu-button" onClick={() => setMobileNavOpen((value) => !value)} aria-label="Open navigation"><Menu size={19} /></button>
            <div>
              <div className="eyebrow">{language === "km" ? "ផ្នែកទទួលភ្ញៀវ / ថ្ងៃនេះ" : "FRONT OFFICE / TODAY"}</div>
              <h1>{t[titles[view]]}</h1>
            </div>
          </div>
          <div className="topbar-right">
            <button className="language-switch" onClick={() => setLanguage(language === "km" ? "en" : "km")} aria-label="Switch language">{language === "km" ? "EN" : "ខ្មែរ"}</button>
            <div className="notification-wrap">
              <button className="icon-button notification-button" onClick={() => { setNotificationsOpen((value) => !value); setNotifications(0); }} aria-label="Notifications"><Bell size={18} />{notifications > 0 && <span className="notification-dot">{notifications}</span>}</button>
              {notificationsOpen && <div className="notification-popover"><div className="popover-heading"><strong>{t.alerts}</strong><span>3</span></div><p>{language === "km" ? "ភាពខុសគ្នាសាច់ប្រាក់ត្រូវការពិនិត្យ" : "Cash variance needs review"}</p><p>{language === "km" ? "របាយការណ៍វេនព្រឹកត្រូវដាក់" : "Morning report is due"}</p><button onClick={() => navigate("financial")}>{t.viewAll}</button></div>}
            </div>
            <div className="shift-select-wrap"><Sunrise size={15} /><select value={shift} onChange={(event) => setShift(event.target.value as Shift)} aria-label="Current shift"><option value="Morning">{t.morningShift}</option><option value="Afternoon">{t.afternoonShift}</option><option value="Night">{t.nightShift}</option></select><ChevronDown size={14} /></div>
            <div className="date-chip"><CalendarDays size={15} /><span>{formatDate(new Date(), language)}</span></div>
            <button className={cn("icon-button", refreshing && "spin-once")} onClick={handleRefresh} aria-label="Refresh"><RefreshCcw size={17} /></button>
          </div>
        </header>

        <main className="view-container">
          {view === "dashboard" && <DashboardView language={language} t={t} tasks={tasks} reports={reports} userName={user?.name ?? "John"} navigate={navigate} />}
          {view === "report" && (
            <ReportView
              language={language}
              t={t}
              reporter={user?.name ?? "John Doe"}
              defaultShift={shift}
              onSaved={(input) => {
                saveDraft(input);
                toast.success(t.saved);
              }}
              onSubmitted={(input) => {
                const report = submitReport(input);
                toast.success(`${t.submitted} · ${report.id}`);
                navigate("shiftreports");
              }}
            />
          )}
          {view === "shiftreports" && <ShiftReportsView language={language} t={t} />}
          {view === "tasks" && <TasksView language={language} t={t} tasks={tasks} onAdd={() => setTaskModalOpen(true)} onUpdate={handleUpdateTaskStatus} />}
          {view === "financial" && <FinancialView language={language} t={t} />}
          {view === "inquiries" && <InquiriesView language={language} t={t} />}
          {view === "closeout" && <CloseoutView language={language} t={t} />}
          {view === "feedback" && <FeedbackView language={language} t={t} />}
          {view === "monthly" && <MonthlyView language={language} t={t} />}
          {view === "yearly" && <YearlyView language={language} t={t} />}
          {view === "history" && <HistoryView language={language} t={t} reports={reports} />}
          {view === "audit" && <AuditView language={language} t={t} audit={audit} />}
          {view === "shifts" && <ShiftsView language={language} t={t} />}
          {view === "admin" && <AdminView language={language} t={t} onLanguageToggle={toggleLanguage} />}
        </main>
      </div>
      {taskModalOpen && <TaskModal language={language} t={t} onClose={() => setTaskModalOpen(false)} onAdd={handleAddTask} />}
    </div>
  );
}

type Copy = (typeof translations)[Language];

type LoginProps = { language: Language; t: Copy; onLanguageToggle: () => void; onRegister: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void };
function LoginScreen({ language, t, onLanguageToggle, onRegister, onSubmit }: LoginProps) {
  return <div className="auth-screen"><div className="auth-visual" style={{ backgroundImage: `linear-gradient(90deg, rgba(8, 28, 52, .94) 0%, rgba(8, 28, 52, .72) 42%, rgba(8, 28, 52, .14) 100%), url(${heroImage})` }}><div className="visual-stamp"><span className="seal-emblem"><img src={sealImage} alt="" /></span><span>FDR / 01</span></div><div className="visual-copy"><p className="eyebrow">{language === "km" ? "សៀវភៅប្រតិបត្តិការវេន" : "THE SHIFT BOOK"}</p><h2>{language === "km" ? "រក្សាការប្រគល់វេនឱ្យច្បាស់លាស់" : "Keep the handoff clean."}</h2><p>{language === "km" ? "សេចក្តីរាយការណ៍ សាច់ប្រាក់ និងតម្រូវការភ្ញៀវ — នៅកន្លែងតែមួយ។" : "Reports, cash, and guest requests — held in one calm operational record."}</p></div><div className="visual-footer"><span>SIEM REAP · FRONT OFFICE</span><span>EST. 2026</span></div></div><div className="auth-panel"><button className="auth-language" onClick={onLanguageToggle}>{language === "km" ? "EN" : "ខ្មែរ"}</button><div className="auth-panel-inner"><div className="mobile-brand"><img src={sealImage} alt="" /><span>FDR</span></div><div className="auth-heading"><div className="auth-mark seal-emblem"><img src={sealImage} alt="FDR" /></div><p className="eyebrow">{language === "km" ? "តំបន់សុវត្ថិភាព" : "SECURE OPERATIONS"}</p><h1>{t.appTitle}</h1><p>{t.appSubtitle}</p></div><form className="auth-form" onSubmit={onSubmit}><Field label={t.email} icon={<MessageCircle size={16} />}><input id="login-email" name="email" type="email" placeholder="you@hotel.com" defaultValue="admin@hotel.com" required /></Field><Field label={t.password} icon={<ShieldCheck size={16} />}><input id="login-password" name="password" type="password" placeholder="••••••••" defaultValue="admin123" required /></Field><Field label={t.shift} icon={<Sunrise size={16} />}><select name="shift" defaultValue="Morning"><option value="Morning">{t.morningShift} · 07:00 – 14:00</option><option value="Afternoon">{t.afternoonShift} · 14:30 – 22:00</option><option value="Night">{t.nightShift} · 22:30 – 06:00</option></select></Field><button className="primary-button full-width" type="submit"><LogIn size={16} />{t.signIn}<ArrowUpRight size={15} /></button></form><p className="auth-hint">{t.demoHint}</p><button className="auth-register-link" onClick={onRegister}>{t.noAccount}<ArrowUpRight size={14} /></button></div></div></div>;
}

function RegisterScreen({ language, t, onLanguageToggle, onBack, onSubmit }: { language: Language; t: Copy; onLanguageToggle: () => void; onBack: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="auth-screen"><div className="auth-visual auth-visual-compact" style={{ backgroundImage: `linear-gradient(90deg, rgba(8, 28, 52, .94) 0%, rgba(8, 28, 52, .68) 56%, rgba(8, 28, 52, .12) 100%), url(${hallwayImage})` }}><div className="visual-stamp"><span className="seal-emblem"><img src={sealImage} alt="" /></span><span>FDR / 02</span></div><div className="visual-copy"><p className="eyebrow">{language === "km" ? "បុគ្គលិកផ្នែកទទួលភ្ញៀវ" : "FRONT OFFICE TEAM"}</p><h2>{language === "km" ? "បន្ថែមមនុស្សត្រឹមត្រូវទៅក្នុងវេន" : "Add the right people to the shift."}</h2><p>{language === "km" ? "គណនីថ្មីត្រូវបានពិនិត្យដោយអ្នកគ្រប់គ្រងមុនពេលប្រើប្រាស់។" : "New accounts are reviewed by an administrator before access is granted."}</p></div></div><div className="auth-panel"><button className="auth-language" onClick={onLanguageToggle}>{language === "km" ? "EN" : "ខ្មែរ"}</button><div className="auth-panel-inner"><button className="back-link" onClick={onBack}><ArrowDownRight size={14} /> {t.haveAccount}</button><div className="auth-heading"><div className="auth-mark"><UserPlus size={26} /></div><p className="eyebrow">{language === "km" ? "សំណើចូលរួម" : "ACCESS REQUEST"}</p><h1>{t.registerTitle}</h1><p>{t.registerSubtitle}</p></div><form className="auth-form" onSubmit={onSubmit}><Field label={t.name} icon={<Users size={16} />}><input type="text" required /></Field><Field label={t.email} icon={<MessageCircle size={16} />}><input type="email" required /></Field><Field label={t.password} icon={<ShieldCheck size={16} />}><input type="password" minLength={4} required /></Field><div className="field-row"><Field label={t.department}><select defaultValue="Front"><option value="Front">Front office</option><option value="House">Housekeeping</option><option value="Maint">Maintenance</option><option value="F&B">Food & beverage</option></select></Field><Field label={t.shift}><select defaultValue="Morning"><option>Morning</option><option>Afternoon</option><option>Night</option></select></Field></div><button className="primary-button full-width" type="submit"><UserPlus size={16} />{t.registerBtn}<ArrowUpRight size={15} /></button></form></div></div></div>;
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) { return <label className="field"><span>{icon}{label}</span>{children}</label>; }

function DashboardView({ language, t, tasks, reports, userName, navigate }: { language: Language; t: Copy; tasks: FdrTask[]; reports: ShiftReport[]; userName: string; navigate: (view: ViewKey) => void }) {
  const openTasks = tasks.filter((task) => task.status !== "Completed").length;
  const latest = reports.find((report) => report.status !== "Draft");
  const firstName = userName.split(" ")[0];
  const [selectedDay, setSelectedDay] = useState(6);
  const days = language === "km" ? ["ចន្ទ", "អង្គារ", "ពុធ", "ព្រហ", "សុក្រ", "សៅរ៍", "អាទិត្យ"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const values = [72, 78, 81, 75, 88, 92, 85];
  return <div className="dashboard-view"><section className="dashboard-intro"><div><div className="eyebrow brass-eyebrow"><span className="pulse-dot" />{language === "km" ? "ស្ថានភាពប្រតិបត្តិការ · LIVE" : "OPERATIONS STATUS · LIVE"}</div><h2>{language === "km" ? `អរុណសួស្តី, ${firstName}` : `Good morning, ${firstName}`}</h2><p>{language === "km" ? "នេះជារូបភាពសង្ខេបនៃថ្ងៃនេះ។ ពិនិត្យចំណុចពិសេសមុនពេលប្រគល់វេនបន្ទាប់។" : "Here is today’s operating picture. Review the exceptions before the next handoff."}</p></div><div className="intro-date"><span>{language === "km" ? "កាលបរិច្ឆេទប្រតិបត្តិការ" : "OPERATING DATE"}</span><strong>{formatDate(new Date(), language)}</strong><small>07:00 — 14:00 · {t.morningShift}</small></div></section><section className="stats-grid"><StatCard icon={<BedDouble size={19} />} label={t.occupancy} value={latest?.occupancy ?? "85%"} sub={latest ? (language === "km" ? `ពី ${latest.id}` : `From ${latest.id}`) : language === "km" ? "85 / 100 បន្ទប់" : "85 / 100 rooms"} tone="blue" trend="+4.2%" /><StatCard icon={<Banknote size={19} />} label={t.todayIncome} value={latest?.income ?? "$5,200"} sub={latest ? (language === "km" ? `ពី ${latest.id}` : `From ${latest.id}`) : language === "km" ? "ប្រៀបធៀបថ្ងៃម្សិលមិញ" : "vs yesterday"} tone="green" trend="+12%" /><StatCard icon={<ClipboardList size={19} />} label={t.openTasks} value={String(openTasks)} sub={language === "km" ? "3 អាទិភាពខ្ពស់" : "3 high priority"} tone="amber" trend="-2" /><StatCard icon={<MessageCircle size={19} />} label={t.inquiriesToday} value="12" sub={language === "km" ? "9 បានដោះស្រាយ" : "9 resolved"} tone="purple" trend="+3" /></section><section className="content-grid dashboard-grid"><div className="panel chart-panel"><PanelHeading icon={<Activity size={16} />} title={t.occupancyTrend} action={<span className="panel-meta">{latest?.occupancy ?? "85%"} <ArrowUpRight size={13} /></span>} /><div className="chart-wrap"><div className="chart-y-labels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="bar-chart">{values.map((value, index) => <button key={days[index]} className={cn("bar-column", selectedDay === index && "bar-column-selected")} style={{ "--bar-height": `${value}%` } as React.CSSProperties} onClick={() => setSelectedDay(index)}><span className="bar-value">{value}%</span><i /><span className="bar-label">{days[index]}</span></button>)}</div></div><div className="chart-footnote"><span><i className="legend-swatch" />{language === "km" ? "អត្រាកាន់កាប់ជាក់ស្តែង" : "Actual occupancy"}</span><span>{language === "km" ? `ជ្រើសរើស៖ ${days[selectedDay]}` : `Selected: ${days[selectedDay]}`}</span></div></div><div className="panel alerts-panel"><PanelHeading icon={<AlertTriangle size={16} />} title={t.alerts} action={<button className="text-button" onClick={() => navigate("financial")}>{t.viewAll}</button>} /><div className="alert-list"><AlertItem tone="warning" icon={<Banknote size={17} />} title={language === "km" ? "ភាពខុសគ្នានៃសាច់ប្រាក់" : "Cash variance"} detail={language === "km" ? "រំពឹង $1,000 · ជាក់ស្តែង $950 (−$50)" : "Expected $1,000 · Actual $950 (−$50)"} /><AlertItem tone="info" icon={<Clock3 size={17} />} title={language === "km" ? "របាយការណ៍ត្រូវដាក់" : "Report due"} detail={language === "km" ? "របាយការណ៍វេនព្រឹកត្រូវដាក់ម៉ោង ១២:០០" : "Morning shift report due at 12:00"} /><AlertItem tone="success" icon={<CheckCircle2 size={17} />} title={language === "km" ? "បន្ទប់ទាំងអស់បានពិនិត្យ" : "All rooms inspected"} detail={language === "km" ? "ការសម្អាតបានបញ្ចប់ម៉ោង ០៨:៤៥" : "Housekeeping completed at 08:45"} /></div></div><div className="panel image-panel"><img src={receptionImage} alt="Quiet hotel reception counter" /><div className="image-panel-overlay"><span className="eyebrow">FDR / FIELD NOTE</span><strong>{language === "km" ? "កន្លែងទទួលភ្ញៀវមានសណ្តាប់ធ្នាប់" : "A front desk in order"}</strong><p>{language === "km" ? "បរិយាកាសស្ងប់ស្ងាត់សម្រាប់ការបម្រើភ្ញៀវដែលយកចិត្តទុកដាក់។" : "A calm environment for attentive guest service."}</p></div></div><div className="panel tasks-summary"><PanelHeading icon={<ClipboardList size={16} />} title={language === "km" ? "ភារកិច្ចដែលត្រូវផ្តោត" : "Focus tasks"} action={<button className="text-button" onClick={() => navigate("tasks")}>{t.viewAll}</button>} /><div className="focus-list">{tasks.filter((task) => task.status !== "Completed").slice(0, 3).map((task) => <div className="focus-row" key={task.id}><span className={cn("priority-marker", task.priority.toLowerCase())} /><div><strong>{task.title}</strong><span>{task.detail}</span></div><small>{task.due}</small></div>)}</div></div><div className="panel full-width recent-panel"><PanelHeading icon={<FileBarChart2 size={16} />} title={t.recentReports} action={<button className="text-button" onClick={() => navigate("history")}>{t.viewAll}</button>} /><DataTable headers={[language === "km" ? "លេខរបាយការណ៍" : "Report ID", t.date, t.shift, t.reporter, t.occupancy, language === "km" ? "ចំណូល" : "Income", language === "km" ? "ស្ថានភាព" : "Status"]} rows={reports.slice(0, 4).map((report) => [report.id, formatDate(new Date(`${report.dateIso}T00:00:00`), language), report.shift, report.reporter, report.occupancy, report.income, <span className={cn("status-pill", report.status.toLowerCase())} key={report.id}>{report.status}</span>])} /></div></section></div>;
}

function StatCard({ icon, label, value, sub, tone, trend }: { icon: React.ReactNode; label: string; value: string; sub: string; tone: string; trend: string }) { return <div className="stat-card"><div className={cn("stat-icon", tone)}>{icon}</div><div className="stat-body"><span className="stat-label">{label}</span><strong>{value}</strong><span className="stat-sub">{sub}</span></div><span className={cn("trend", trend.startsWith("-") ? "trend-down" : "")}>{trend.startsWith("-") ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{trend}</span></div>; }
function PanelHeading({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) { return <div className="panel-heading"><div><span className="heading-icon">{icon}</span><h3>{title}</h3></div>{action}</div>; }
function AlertItem({ tone, icon, title, detail }: { tone: string; icon: React.ReactNode; title: string; detail: string }) { return <div className={cn("alert-item", tone)}><span className="alert-icon">{icon}</span><div><strong>{title}</strong><span>{detail}</span></div></div>; }

function ReportView({ language, t, reporter, defaultShift, onSaved, onSubmitted }: { language: Language; t: Copy; reporter: string; defaultShift: Shift; onSaved: (input: ReportInput) => void; onSubmitted: (input: ReportInput) => void }) {
  const [dateIso, setDateIso] = useState(todayIso());
  const [shift, setShift] = useState<Shift>(defaultShift);
  const [total, setTotal] = useState(100);
  const [occupied, setOccupied] = useState(85);
  const [notes, setNotes] = useState("");
  const [issues, setIssues] = useState("");
  const pct = total ? Math.min(100, Math.round((occupied / total) * 100)) : 0;
  const collectInput = (): ReportInput => ({ dateIso, shift, totalRooms: total, occupied, notes: [notes.trim(), issues.trim() ? `Issues: ${issues.trim()}` : ""].filter(Boolean).join(" · ") });
  return <div className="section-stack"><div className="section-intro"><div><div className="eyebrow">FDR / {language === "km" ? "ការបញ្ចូលទិន្នន័យ" : "DATA ENTRY"}</div><h2>{t.pageReport}</h2><p>{language === "km" ? "បំពេញសេចក្តីរាយការណ៍តាមលំដាប់ ដើម្បីរក្សាការប្រគល់វេនឱ្យមានភាពច្បាស់លាស់។" : "Complete the report in sequence to keep the next handoff clear."}</p></div><div className="section-aside-note"><Sparkles size={16} /><span>{language === "km" ? "កំពុងកែសម្រួលសេចក្តីព្រាង" : "Editing today’s draft"}</span></div></div><form className="form-sheet" onSubmit={(event) => { event.preventDefault(); onSubmitted(collectInput()); }}><FormSection title={t.reportInfo} icon={<FileText size={17} />}><div className="form-grid four"><Field label={t.date}><input type="date" value={dateIso} onChange={(event) => setDateIso(event.target.value || todayIso())} required /></Field><Field label={t.shift}><select value={shift} onChange={(event) => setShift(event.target.value as Shift)}><option>Morning</option><option>Afternoon</option><option>Night</option></select></Field><Field label={t.department}><select defaultValue="Front"><option>Front office</option><option>Housekeeping</option><option>Maintenance</option><option>Food & beverage</option></select></Field><Field label={t.reporter}><input value={reporter} readOnly /></Field></div></FormSection><FormSection title={t.occupancy} icon={<BedDouble size={17} />}><div className="form-grid four"><Field label={t.totalRooms}><input type="number" min="0" value={total} onChange={(event) => setTotal(Number(event.target.value))} /></Field><Field label={t.occupied}><input type="number" min="0" value={occupied} onChange={(event) => setOccupied(Number(event.target.value))} /></Field><Field label={t.vacant}><input type="number" min="0" defaultValue="15" /></Field><Field label={t.ooo}><input type="number" min="0" defaultValue="0" /></Field></div><div className="form-grid four"><Field label={t.arrivals}><input type="number" min="0" defaultValue="24" /></Field><Field label={t.departures}><input type="number" min="0" defaultValue="18" /></Field><Field label={t.vip}><input type="number" min="0" defaultValue="4" /></Field><Field label={t.occupancyPct}><div className="readonly-value"><strong>{pct}%</strong><span>{language === "km" ? "គណនាដោយស្វ័យប្រវត្តិ" : "Calculated automatically"}</span></div></Field></div><div className="occupancy-progress"><span style={{ width: `${pct}%` }} /><b>{pct}%</b></div></FormSection><FormSection title={t.notesIssues} icon={<FileText size={17} />}><div className="form-grid two"><Field label={t.shiftNotes}><textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={language === "km" ? "សរសេរកំណត់ចំណាំសម្រាប់វេនបន្ទាប់..." : "Write notes for the next shift..."} /></Field><Field label={t.issuesIncidents}><textarea rows={4} value={issues} onChange={(event) => setIssues(event.target.value)} placeholder={language === "km" ? "រាយការណ៍បញ្ហាដែលត្រូវតាមដាន..." : "Log anything that needs follow-up..."} /></Field></div></FormSection><div className="form-actions"><button type="button" className="secondary-button" onClick={() => onSaved(collectInput())}><Save size={16} />{t.saveDraft}</button><button type="submit" className="primary-button"><Send size={16} />{t.submitReport}<ArrowUpRight size={15} /></button></div></form></div>;
}
function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className="form-section"><div className="form-section-heading"><span>{icon}</span><h3>{title}</h3></div>{children}</section>; }

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll("\\", "\\\\").replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function printSheet(target: "closeout" | "handover", title: string) {
  const className = `printing-${target}`;
  const previousTitle = document.title;
  document.title = title;
  document.body.classList.add(className);
  const cleanup = () => {
    document.body.classList.remove(className);
    document.title = previousTitle;
  };
  window.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(() => window.print(), 40);
}

function ShiftReportsView({ language, t }: { language: Language; t: Copy }) { const [generated, setGenerated] = useState(false); const exportHandoverCsv = () => { downloadCsv("fdr-shift-handover-2026-08-30.csv", ["Date", "Shift", "Hours", "Occupancy", "Cash close", "Handover status"], [["30 Aug 2026", "Morning", "07:00 – 15:00", "85%", "$950", "Ready"], ["30 Aug 2026", "Afternoon", "15:00 – 23:00", "81%", "$1,080", "Ready"], ["30 Aug 2026", "Night", "23:00 – 07:00", "82%", "$720", "Ready"]]); toast.success(language === "km" ? "ឯកសារ CSV បានទាញយក" : "Handover CSV downloaded"); }; return <div className="section-stack"><SectionHeader eyebrow="FDR / SHIFT RHYTHM" title={t.pageShiftReports} description={language === "km" ? "មើលសេចក្តីរាយការណ៍តាមវេន ឬភ្ជាប់វេនទាំងបីជាសន្លឹកតែមួយ។" : "Review individual shifts or join all three into a single operating sheet."} actions={<div className="toolbar-actions"><input className="compact-input" type="date" defaultValue={todayIso()} /><button className="primary-button" onClick={() => setGenerated(true)}><RefreshCcw size={15} />{t.generateReport}</button><button className="secondary-button" onClick={exportHandoverCsv}><Download size={15} />CSV</button><button className="secondary-button" onClick={() => printSheet("handover", "FDR Shift Handover")}><Printer size={15} />PDF</button></div>} />{generated ? <div className="shift-report-output"><div className="report-summary-banner"><div><span className="eyebrow">DAILY CLOSE · 30 AUG 2026</span><h3>{language === "km" ? "សេចក្តីសង្ខេបប្រតិបត្តិការប្រចាំថ្ងៃ" : "Daily operating summary"}</h3></div><span className="status-pill approved"><CheckCircle2 size={13} />{language === "km" ? "បានបង្កើត" : "Generated"}</span></div><div className="shift-report-grid">{(["Morning", "Afternoon", "Night"] as Shift[]).map((name, index) => <div className="shift-card" key={name}><div className="shift-card-top"><span className={cn("shift-icon", index === 0 ? "sunrise" : index === 1 ? "sun" : "moon")}>{index === 0 ? <Sunrise size={17} /> : index === 1 ? <Sun size={17} /> : <Moon size={17} />}</span><div><strong>{name} shift</strong><span>{index === 0 ? "07:00 – 15:00" : index === 1 ? "15:00 – 23:00" : "23:00 – 07:00"}</span></div></div><dl><div><dt>Occupancy</dt><dd>{[85, 81, 82][index]}%</dd></div><div><dt>Cash close</dt><dd>${[950, 1080, 720][index].toLocaleString()}</dd></div><div><dt>Handover</dt><dd className="success-text">Ready</dd></div></dl><button className="text-button">Open shift sheet <ArrowUpRight size={13} /></button></div>)}</div></div> : <EmptyState icon={<FileBarChart2 size={24} />} title={language === "km" ? "ជ្រើសរើសកាលបរិច្ឆេទដើម្បីបង្កើតសន្លឹកវេន" : "Choose a date to generate the shift sheet"} detail={language === "km" ? "សន្លឹកនេះនឹងភ្ជាប់ទិន្នន័យពីវេនព្រឹក រសៀល និងយប់។" : "The sheet will connect morning, afternoon, and night data."} />}</div>; }

function TasksView({ language, t, tasks, onAdd, onUpdate }: { language: Language; t: Copy; tasks: FdrTask[]; onAdd: () => void; onUpdate: (id: string, status: TaskStatus) => void }) { const [statusFilter, setStatusFilter] = useState(""); const [priorityFilter, setPriorityFilter] = useState(""); const filtered = tasks.filter((task) => (!statusFilter || task.status === statusFilter) && (!priorityFilter || task.priority === priorityFilter)); return <div className="section-stack"><SectionHeader eyebrow="FDR / WORK QUEUE" title={t.pageTasks} description={language === "km" ? "ភារកិច្ចជាក់ស្តែងសម្រាប់វេននេះ — ច្បាស់លាស់ អាចតាមដានបាន និងមានម្ចាស់។" : "The live queue for this shift — clear, accountable, and easy to move forward."} actions={<button className="primary-button" onClick={onAdd}><Plus size={16} />{t.newTask}</button>} /><div className="toolbar-strip"><div className="toolbar-group"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">{t.allStatus}</option><option value="Pending">{t.pending}</option><option value="In Progress">{t.inProgress}</option><option value="Completed">{t.completed}</option></select><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="">{t.allPriority}</option><option value="High">{t.high}</option><option value="Med">{t.med}</option><option value="Low">{t.low}</option></select></div><span className="toolbar-note"><span className="pulse-dot" />{filtered.length} {language === "km" ? "ភារកិច្ចបង្ហាញ" : "tasks showing"}</span></div><div className="kanban-board">{(["Pending", "In Progress", "Completed"] as TaskStatus[]).map((status) => <div className="kanban-column" key={status}><div className="kanban-heading"><div><span className={cn("kanban-marker", status === "Pending" ? "amber" : status === "In Progress" ? "blue" : "green")} /><h3>{status === "Pending" ? t.pending : status === "In Progress" ? t.inProgress : t.completed}</h3></div><span className="count-badge">{filtered.filter((task) => task.status === status).length}</span></div><div className="kanban-cards">{filtered.filter((task) => task.status === status).map((task) => <TaskCard key={task.id} task={task} language={language} onUpdate={onUpdate} />)}</div></div>)}</div></div>; }
function TaskCard({ task, language, onUpdate }: { task: FdrTask; language: Language; onUpdate: (id: string, status: TaskStatus) => void }) { const nextStatus: TaskStatus = task.status === "Pending" ? "In Progress" : task.status === "In Progress" ? "Completed" : "Pending"; return <article className="task-card"><div className="task-card-top"><span className={cn("priority-chip", task.priority.toLowerCase())}>{task.priority}</span><button className="icon-button tiny" aria-label="More options"><MoreHorizontal size={15} /></button></div><strong>{task.title}</strong><p>{task.detail}</p><div className="task-card-footer"><span><Clock3 size={13} />{task.due}</span><button className="task-status-action" onClick={() => onUpdate(task.id, nextStatus)}>{task.status === "Completed" ? <Check size={13} /> : <ArrowUpRight size={13} />}{language === "km" ? "ផ្លាស់ទី" : nextStatus}</button></div></article>; }

function FinancialView({ language, t }: { language: Language; t: Copy }) { const [tab, setTab] = useState("income"); const [expected, setExpected] = useState(1000); const [actual, setActual] = useState(950); const variance = actual - expected; const tabs = [{ key: "income", label: t.incomeTab }, { key: "expenses", label: t.expensesTab }, { key: "refunds", label: t.refundsTab }, { key: "cash", label: t.cashTab }, { key: "deep", label: t.deepCalc }, { key: "tracking", label: t.cashTracking }]; return <div className="section-stack"><SectionHeader eyebrow="FDR / LEDGER" title={t.pageFinancial} description={language === "km" ? "ទិន្នន័យហិរញ្ញវត្ថុដែលអាចអានបានលឿនសម្រាប់ការបិទវេន។" : "A quick-reading financial ledger for confident shift closeout."} actions={<div className="toolbar-actions"><button className="secondary-button"><Download size={15} />CSV</button></div>} /><div className="tabs-strip">{tabs.map((item) => <button key={item.key} className={cn(tab === item.key && "tab-active")} onClick={() => setTab(item.key)}>{item.label}</button>)}</div>{tab === "income" && <LedgerTable title={t.incomeSources} action={t.addIncome} headers={["ID", t.date, t.shift, language === "km" ? "ប្រភព" : "Source", language === "km" ? "ចំនួន" : "Amount", language === "km" ? "សុទ្ធ" : "Net", t.status]} rows={[["INC-031", "30 Aug 2026", "Morning", "Room nights", "$4,680", "$4,680", <span className="status-pill approved">Settled</span>],["INC-030", "30 Aug 2026", "Morning", "Restaurant", "$520", "$494", <span className="status-pill approved">Settled</span>],["INC-029", "30 Aug 2026", "Morning", "Airport transfer", "$120", "$120", <span className="status-pill pending">Pending</span>]]} />}{tab === "expenses" && <LedgerTable title={t.expenses} action={t.addExpense} headers={["ID", t.date, t.shift, language === "km" ? "ប្រភេទ" : "Category", language === "km" ? "ចំនួន" : "Amount", language === "km" ? "មូលហេតុ" : "Reason", t.status]} rows={[["EXP-021", "30 Aug 2026", "Morning", "Supplies", "$84", "Welcome cards", <span className="status-pill approved">Approved</span>],["EXP-020", "29 Aug 2026", "Night", "Transport", "$32", "Guest transfer", <span className="status-pill approved">Approved</span>]]} />}{tab === "refunds" && <LedgerTable title={t.refunds} action={t.addRefund} headers={["ID", t.date, t.shift, language === "km" ? "ភ្ញៀវ" : "Guest", language === "km" ? "បន្ទប់" : "Room", language === "km" ? "ចំនួន" : "Amount", language === "km" ? "មូលហេតុ" : "Reason", t.status]} rows={[["REF-008", "30 Aug 2026", "Morning", "S. Vannak", "412", "$75", "Rate adjustment", <span className="status-pill approved">Approved</span>]]} />}{tab === "cash" && <CashVariance expected={expected} actual={actual} setExpected={setExpected} setActual={setActual} variance={variance} language={language} />}{tab === "deep" && <DeepCalculation language={language} />}{tab === "tracking" && <CashTracking language={language} />}</div>; }
function LedgerTable({ title, action, headers, rows }: { title: string; action: string; headers: string[]; rows: React.ReactNode[][] }) { return <div className="panel table-panel"><div className="table-toolbar"><h3>{title}</h3><button className="primary-button" onClick={() => toast.info(`${action} form ready`)}><Plus size={15} />{action}</button></div><DataTable headers={headers} rows={rows} /></div>; }
function CashVariance({ expected, actual, setExpected, setActual, variance, language }: { expected: number; actual: number; setExpected: (value: number) => void; setActual: (value: number) => void; variance: number; language: Language }) { return <div className="panel calculator-panel"><PanelHeading icon={<Banknote size={16} />} title={language === "km" ? "ពិនិត្យភាពខុសគ្នាសាច់ប្រាក់" : "Cash variance check"} /><div className="form-grid three"><Field label={language === "km" ? "សាច់ប្រាក់រំពឹង" : "Expected cash"}><input type="number" value={expected} onChange={(event) => setExpected(Number(event.target.value))} /></Field><Field label={language === "km" ? "សាច់ប្រាក់ជាក់ស្តែង" : "Actual cash"}><input type="number" value={actual} onChange={(event) => setActual(Number(event.target.value))} /></Field><Field label={language === "km" ? "ភាពខុសគ្នា" : "Variance"}><div className={cn("variance-value", variance < 0 ? "negative" : "positive")}>{variance < 0 ? "−" : "+"}${Math.abs(variance).toFixed(2)}</div></Field></div><div className={cn("variance-result", variance < 0 ? "negative" : "positive")}><AlertTriangle size={18} /><div><strong>{variance < 0 ? (language === "km" ? "ត្រូវការពិនិត្យបន្ថែម" : "Needs review") : language === "km" ? "សាច់ប្រាក់ត្រូវគ្នា" : "Cash is balanced"}</strong><span>{variance < 0 ? (language === "km" ? "កត់ត្រាមូលហេតុ មុនពេលបិទវេន។" : "Record the reason before closing the shift.") : (language === "km" ? "មិនមានភាពខុសគ្នាដែលត្រូវដោះស្រាយទេ។" : "No exception needs resolution.")}</span></div></div></div>; }
function DeepCalculation({ language }: { language: Language }) { return <div className="panel calculator-panel"><PanelHeading icon={<BarChart3 size={16} />} title={language === "km" ? "សេចក្តីសង្ខេបគណនាស៊ីជម្រៅ" : "Deep calculation summary"} /><div className="calc-metrics"><div><span>Gross revenue</span><strong>$5,320</strong><small>Room + F&B + services</small></div><div><span>Net revenue</span><strong>$5,214</strong><small>After fees & adjustments</small></div><div><span>Average room rate</span><strong>$54.35</strong><small>Based on 85 occupied rooms</small></div></div><div className="insight-note"><Sparkles size={17} /><span>{language === "km" ? "ចំណូលបន្ទប់មានចំណែក ៨៨% នៃចំណូលសរុបថ្ងៃនេះ។" : "Room revenue contributes 88% of today’s gross income."}</span></div></div>; }
function CashTracking({ language }: { language: Language }) { const [opening, setOpening] = useState(200); const [sales, setSales] = useState(780); const [refunds, setRefunds] = useState(30); const expected = opening + sales - refunds; return <div className="panel calculator-panel"><PanelHeading icon={<WalletCards size={16} />} title={language === "km" ? "តាមដានសាច់ប្រាក់ប្រចាំវេន" : "Shift cash tracking"} /><div className="form-grid four"><Field label={language === "km" ? "សាច់ប្រាក់បើក" : "Opening float"}><input type="number" value={opening} onChange={(event) => setOpening(Number(event.target.value))} /></Field><Field label={language === "km" ? "លក់សាច់ប្រាក់" : "Cash sales"}><input type="number" value={sales} onChange={(event) => setSales(Number(event.target.value))} /></Field><Field label={language === "km" ? "សងប្រាក់" : "Refunds"}><input type="number" value={refunds} onChange={(event) => setRefunds(Number(event.target.value))} /></Field><Field label={language === "km" ? "បិទរំពឹង" : "Expected close"}><div className="readonly-value"><strong>${expected.toFixed(2)}</strong><span>Auto-calculated</span></div></Field></div><div className="table-toolbar"><h3>{language === "km" ? "កំណត់ហេតុសាច់ប្រាក់" : "Cash log"}</h3><button className="secondary-button" onClick={() => toast.success(language === "km" ? "បានរក្សាទុកកំណត់ហេតុ" : "Cash log saved")}><Save size={15} />{language === "km" ? "រក្សាទុក" : "Save log"}</button></div><DataTable headers={["Date", "Shift", "Opening", "Cash sales", "Expected", "Actual", "Over / short"]} rows={[["30 Aug 2026", "Morning", "$200", "$780", `$${expected}`, "$950", <span className="negative-text">−$30</span>],["29 Aug 2026", "Night", "$180", "$720", "$900", "$900", <span className="success-text">$0</span>]]} /></div>; }

function InquiriesView({ language, t }: { language: Language; t: Copy }) { const [category, setCategory] = useState(""); const rows = [["INQ-119", "30 Aug 2026", "Phone", "Room info", "A. Sok", "Airport transfer at 17:00", <span className="status-pill approved">Yes</span>, "—", "John Doe"],["INQ-118", "30 Aug 2026", "WhatsApp", "Booking", "M. Lina", "Extend stay by 2 nights", <span className="status-pill approved">Yes</span>, "—", "John Doe"],["INQ-117", "30 Aug 2026", "Front desk", "Special", "K. Narin", "Quiet room request", <span className="status-pill pending">Follow up</span>, "Room move", "Dara Lim"]].filter((row) => !category || String(row[3]).toLowerCase().includes(category.toLowerCase())); return <div className="section-stack"><SectionHeader eyebrow="FDR / GUEST CARE" title={t.pageInquiries} description={language === "km" ? "កត់ត្រាសំណួរភ្ញៀវ ដើម្បីឱ្យការតាមដានមិនបាត់បង់។" : "Log every guest question so follow-up never gets lost."} actions={<button className="primary-button" onClick={() => toast.info(language === "km" ? "ទម្រង់កត់ត្រាសំណួរបានបើក" : "Inquiry form ready")}><Plus size={16} />{t.logInquiry}</button>} /><div className="toolbar-strip"><div className="toolbar-group"><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">{t.allCategories}</option><option value="Room">Room info</option><option value="Booking">Booking</option><option value="Special">Special request</option></select><select><option>{t.allOutcomes}</option><option>Successful</option><option>Follow up</option></select></div><span className="toolbar-note">{rows.length} {language === "km" ? "កំណត់ត្រា" : "records"}</span></div><div className="panel table-panel"><DataTable headers={["ID", t.date, language === "km" ? "បណ្តាញ" : "Channel", language === "km" ? "ប្រភេទ" : "Category", language === "km" ? "អតិថិជន" : "Guest", language === "km" ? "ព័ត៌មានលម្អិត" : "Details", language === "km" ? "ជោគជ័យ" : "Outcome", language === "km" ? "មូលហេតុ" : "Reason", language === "km" ? "បុគ្គលិក" : "Staff"]} rows={rows} /></div></div>; }

function CloseoutView({ language, t }: { language: Language; t: Copy }) { const [saved, setSaved] = useState(false); const [morningClose, setMorningClose] = useState(950); const [afternoonOpen, setAfternoonOpen] = useState(950); useEffect(() => setAfternoonOpen(morningClose), [morningClose]); const exportCloseoutCsv = () => { downloadCsv("fdr-daily-closeout-2026-08-30.csv", ["Date", "Shift", "Staff", "Opening float USD", "Closing float USD", "Handover note"], [["30 Aug 2026", "Morning", "John Doe", "200", String(morningClose), "Pending tasks recorded"], ["30 Aug 2026", "Afternoon", "Dara Lim", String(afternoonOpen), "1080", "Linked from morning"], ["30 Aug 2026", "Night", "Nary Chann", "1080", "720", "End-of-day summary recorded"]]); toast.success(language === "km" ? "ឯកសារ CSV បានទាញយក" : "Closeout CSV downloaded"); }; return <div className="section-stack"><SectionHeader eyebrow="FDR / THE LAST PAGE" title={t.pageCloseout} description={language === "km" ? "សន្លឹកបិទបញ្ជី និងប្រគល់វេនដែលភ្ជាប់សាច់ប្រាក់ពីវេនមួយទៅវេនបន្ទាប់។" : "A connected closeout and handover sheet that carries cash from one shift into the next."} actions={<div className="toolbar-actions"><button className="secondary-button" onClick={exportCloseoutCsv}><Download size={15} />CSV</button><button className="secondary-button" onClick={() => printSheet("closeout", "FDR Daily Closeout")}><Printer size={15} />PDF</button><button className="primary-button" onClick={() => { setSaved(true); toast.success(t.saved); }}><Save size={15} />{t.save}</button></div>} /><div className="closeout-sheet"><div className="closeout-banner"><div><span className="eyebrow">DAILY FRONT OFFICE CLOSEOUT</span><h3>{language === "km" ? "សន្លឹកបិទបញ្ជី និងផ្ទេរវេនការងារផ្នែកទទួលភ្ញៀវ" : "Daily front office closeout & connected handover"}</h3></div>{saved && <span className="status-pill approved"><CheckCircle2 size={13} />Saved</span>}</div><div className="form-grid two"><Field label={`${t.date} / Date`}><input type="date" defaultValue={todayIso()} /></Field><Field label={language === "km" ? "ថ្ងៃការងារ" : "Day of week"}><select defaultValue="Sun"><option>Sunday / អាទិត្យ</option><option>Monday / ចន្ទ</option><option>Tuesday / អង្គារ</option></select></Field></div><ShiftBlock title={language === "km" ? "១. របាយការណ៍ប្រតិបត្តិការវេនព្រឹក" : "1. Morning shift report"} tone="morning"><div className="form-grid three"><Field label={language === "km" ? "ឈ្មោះបុគ្គលិក" : "Staff name"}><input defaultValue="John Doe" /></Field><Field label="Opening float · USD"><input type="number" defaultValue="200" /></Field><Field label="Closing float · USD"><input type="number" value={morningClose} onChange={(event) => setMorningClose(Number(event.target.value))} /></Field></div><Field label={language === "km" ? "បញ្ហាដែលនៅសល់" : "Pending tasks"}><textarea rows={2} placeholder={language === "km" ? "កំណត់ចំណាំសម្រាប់វេនរសៀល..." : "Notes for the afternoon shift..."} /></Field></ShiftBlock><ShiftBlock title={language === "km" ? "២. របាយការណ៍ប្រតិបត្តិការវេនរសៀល" : "2. Afternoon shift report"} tone="afternoon"><div className="form-grid three"><Field label={language === "km" ? "ឈ្មោះបុគ្គលិក" : "Staff name"}><input defaultValue="Dara Lim" /></Field><Field label="Opening float · USD"><div className="readonly-value"><strong>${afternoonOpen.toFixed(2)}</strong><span>Linked from morning</span></div></Field><Field label="Closing float · USD"><input type="number" defaultValue="1,080" /></Field></div><div className="form-grid two"><Field label="Check-in average"><input placeholder="minutes" /></Field><Field label={language === "km" ? "បញ្ហាដែលនៅសល់" : "Pending tasks"}><textarea rows={2} /></Field></div></ShiftBlock><ShiftBlock title={language === "km" ? "៣. របាយការណ៍ប្រតិបត្តិការវេនយប់" : "3. Night shift report"} tone="night"><div className="form-grid three"><Field label={language === "km" ? "ឈ្មោះបុគ្គលិក" : "Staff name"}><input defaultValue="Nary Chann" /></Field><Field label="Opening float · USD"><div className="readonly-value"><strong>$1,080.00</strong><span>Linked from afternoon</span></div></Field><Field label="Closing float · USD"><input type="number" defaultValue="720" /></Field></div><Field label={language === "km" ? "សេចក្តីសង្ខេបបិទថ្ងៃ" : "End-of-day summary"}><textarea rows={2} placeholder={language === "km" ? "កត់ត្រាអ្វីដែលវេនព្រឹកត្រូវដឹង..." : "Capture what the morning team should know..."} /></Field></ShiftBlock></div><div className="panel image-panel closeout-photo"><img src={keyTrayImage} alt="Hotel key trays behind the front desk" /><div className="image-panel-overlay"><span className="eyebrow">FDR / FIELD NOTE</span><strong>{language === "km" ? "សោ និងកំណត់ហេតុបានត្រូវចាត់តាំង" : "Keys and logs, in order"}</strong><p>{language === "km" ? "សូមពិនិត្យថាសោទាំងអស់បានត្រឡប់មុនពេលចុះហត្ថលេខាបិទវេន។" : "Confirm every key is back on the board before signing the closeout."}</p></div></div></div>; }
function ShiftBlock({ title, tone, children }: { title: string; tone: string; children: React.ReactNode }) { return <section className={cn("shift-block", tone)}><div className="shift-block-heading"><span className="shift-block-rule" /><h3>{title}</h3><span className="shift-block-time">{tone === "morning" ? "07:00 — 15:00" : tone === "afternoon" ? "15:00 — 23:00" : "23:00 — 07:00"}</span></div>{children}</section>; }

function FeedbackView({ language, t }: { language: Language; t: Copy }) { const [submitted, setSubmitted] = useState(false); return <div className="section-stack"><SectionHeader eyebrow="FDR / LISTEN CLOSELY" title={t.customerFeedback} description={language === "km" ? "កត់ត្រាមតិដែលបានទទួលដោយផ្ទាល់ — មិនបង្កើតការវាយតម្លៃ ឬសក្ខីកម្មដែលមិនមានប្រភពទេ។" : "Log feedback received directly from guests — no invented ratings or testimonials."} actions={<button className="primary-button" onClick={() => setSubmitted(false)}><Plus size={16} />{t.addFeedback}</button>} />{submitted ? <div className="success-card"><CheckCircle2 size={22} /><h3>{language === "km" ? "បានកត់ត្រាមតិ" : "Feedback logged"}</h3><p>{language === "km" ? "ការកត់ត្រានេះត្រូវបានរក្សាទុកសម្រាប់ការតាមដានរបស់ក្រុម។" : "The entry has been saved for the team’s follow-up."}</p></div> : <div className="feedback-layout"><div className="panel feedback-form-panel"><PanelHeading icon={<Star size={16} />} title={t.addFeedback} /><div className="form-grid two"><Field label={language === "km" ? "កាលបរិច្ឆេទ" : "Date"}><input type="date" defaultValue={todayIso()} /></Field><Field label={language === "km" ? "ប្រភព" : "Channel"}><select><option>Front desk</option><option>Phone</option><option>Email</option><option>Review card</option></select></Field></div><div className="form-grid two"><Field label={language === "km" ? "ឈ្មោះភ្ញៀវ (ជាជម្រើស)" : "Guest name (optional)"}><input /></Field><Field label={language === "km" ? "លេខបន្ទប់ (ជាជម្រើស)" : "Room (optional)"}><input /></Field></div><Field label={language === "km" ? "មតិភ្ញៀវ" : "Guest feedback"}><textarea rows={5} placeholder={language === "km" ? "សរសេរតាមពាក្យដែលភ្ញៀវបានប្រាប់..." : "Capture the guest’s words as accurately as possible..."} /></Field><div className="form-actions"><button className="primary-button" onClick={() => setSubmitted(true)}><Save size={15} />{t.save}</button></div></div><div className="feedback-empty"><div className="empty-seal"><img src={sealImage} alt="" /></div><h3>{t.noFeedback}</h3><p>{language === "km" ? "ចាប់ផ្តើមដោយកត់ត្រាមតិពីការសន្ទនានៅផ្នែកទទួលភ្ញៀវ។" : "Start by recording feedback from a conversation at the front desk."}</p></div></div>}</div>; }

function MonthlyView({ language, t }: { language: Language; t: Copy }) { return <div className="section-stack"><SectionHeader eyebrow="FDR / MONTHLY PULSE" title={t.pageMonthly} description={language === "km" ? "ទិដ្ឋភាពប្រចាំខែសម្រាប់ចំណូល កាន់កាប់ និងគុណភាពការប្រគល់វេន។" : "A monthly view of income, occupancy, and handover quality."} actions={<div className="toolbar-actions"><input className="compact-input" type="month" defaultValue="2026-08" /><button className="secondary-button"><Download size={15} />Export</button></div>} /><div className="report-metric-grid"><MetricBlock label="Occupancy" value="83.4%" change="+3.8%" /><MetricBlock label="Gross income" value="$148,240" change="+9.4%" /><MetricBlock label="Reports submitted" value="92 / 93" change="98.9%" /><MetricBlock label="Open exceptions" value="06" change="−4" /></div><div className="content-grid two-column"><div className="panel"><PanelHeading icon={<BarChart3 size={16} />} title={language === "km" ? "និន្នាការចំណូលប្រចាំខែ" : "Monthly income trend"} /><div className="line-chart"><div className="line-chart-path"><span style={{ left: "4%", top: "72%" }} /><span style={{ left: "18%", top: "58%" }} /><span style={{ left: "32%", top: "64%" }} /><span style={{ left: "46%", top: "40%" }} /><span style={{ left: "60%", top: "48%" }} /><span style={{ left: "74%", top: "26%" }} /><span style={{ left: "88%", top: "18%" }} /></div><div className="line-labels"><span>01</span><span>07</span><span>14</span><span>21</span><span>30</span></div></div></div><div className="panel"><PanelHeading icon={<ClipboardCheck size={16} />} title={language === "km" ? "គុណភាពប្រគល់វេន" : "Handover quality"} /><div className="quality-list"><QualityRow label={language === "km" ? "របាយការណ៍ពេញលេញ" : "Complete reports"} value="94%" /><QualityRow label={language === "km" ? "បញ្ហាបានបិទក្នុង ២៤ ម៉ោង" : "Issues closed in 24h"} value="88%" /><QualityRow label={language === "km" ? "កំណត់ហេតុសាច់ប្រាក់ត្រូវគ្នា" : "Cash logs balanced"} value="97%" /></div></div></div></div>; }
function MetricBlock({ label, value, change }: { label: string; value: string; change: string }) { return <div className="metric-block"><span>{label}</span><strong>{value}</strong><small><ArrowUpRight size={12} />{change}</small></div>; }
function QualityRow({ label, value }: { label: string; value: string }) { return <div className="quality-row"><div><span>{label}</span><strong>{value}</strong></div><div className="quality-bar"><i style={{ width: value }} /></div></div>; }

function YearlyView({ language, t }: { language: Language; t: Copy }) { return <div className="section-stack"><SectionHeader eyebrow="FDR / ANNUAL VIEW" title={t.pageYearly} description={language === "km" ? "សេចក្តីសង្ខេបនៃការងារផ្នែកទទួលភ្ញៀវក្នុងឆ្នាំ ២០២៦។" : "A year-to-date view of front office operations in 2026."} actions={<button className="secondary-button"><Download size={15} />Export year</button>} /><div className="yearly-hero"><img src={hallwayImage} alt="Hotel corridor leading to reception" /><div><span className="eyebrow">2026 / YEAR TO DATE</span><h3>{language === "km" ? "ភាពទៀងទាត់នៅក្នុងរាល់ការប្រគល់វេន" : "Consistency in every handoff."}</h3><p>{language === "km" ? "ប្រព័ន្ធកត់ត្រាដែលជួយឱ្យក្រុមមានភាពច្បាស់លាស់ និងត្រៀមខ្លួនបានល្អជាងមុន។" : "A living record that helps the team stay clear, accountable, and ready."}</p></div></div><div className="report-metric-grid"><MetricBlock label="YTD occupancy" value="81.2%" change="+5.1%" /><MetricBlock label="YTD income" value="$1.72M" change="+13.2%" /><MetricBlock label="Reports" value="1,842" change="99.1% on time" /><MetricBlock label="Guest inquiries" value="8,294" change="91% resolved" /></div></div>; }

function HistoryView({ language, t, reports }: { language: Language; t: Copy; reports: ShiftReport[] }) {
  const [query, setQuery] = useState("");
  const filtered = reports.filter((report) => !query.trim() || report.id.toLowerCase().includes(query.trim().toLowerCase()) || report.reporter.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="section-stack"><SectionHeader eyebrow="FDR / ARCHIVE" title={t.pageHistory} description={language === "km" ? "ស្វែងរក និងពិនិត្យរបាយការណ៍ដែលបានរក្សាទុក។" : "Search and review saved reports."} actions={<div className="search-field"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={language === "km" ? "ស្វែងរកលេខរបាយការណ៍..." : "Search report ID..."} /></div>} /><div className="panel table-panel"><DataTable headers={["Report ID", t.date, t.shift, t.reporter, "Department", t.status, ""]} rows={filtered.map((report) => [report.id, formatDate(new Date(`${report.dateIso}T00:00:00`), language), report.shift, report.reporter, "Front office", <span className={cn("status-pill", report.status.toLowerCase())} key={report.id}>{report.status}</span>, <button className="text-button" key={`${report.id}-open`}>{language === "km" ? "បើក" : "Open"} <ArrowUpRight size={13} /></button>])} /></div></div>;
}
function AuditView({ language, t, audit }: { language: Language; t: Copy; audit: AuditEvent[] }) {
  return <div className="section-stack"><SectionHeader eyebrow="FDR / ACCOUNTABILITY" title={t.pageAudit} description={language === "km" ? "កំណត់ហេតុសកម្មភាពសម្រាប់ការតាមដានប្រព័ន្ធ។" : "A clear activity trail for operational accountability."} /><div className="panel timeline-panel">{audit.slice(0, 12).map((item, index) => (
    <div key={item.id}>
      {index === 0 && <div className="audit-date"><span className="eyebrow">{item.dateIso.toUpperCase()}</span><strong>{language === "km" ? "ថ្ងៃនេះ" : "Today"}</strong></div>}
      <div className="audit-row"><span className="audit-time">{item.time}</span><span className="audit-line" /><div className="audit-event"><div><strong>{item.event}</strong><span>{item.user}</span></div><em>{item.area}</em></div></div>
    </div>
  ))}</div></div>;
}
function ShiftsView({ language, t }: { language: Language; t: Copy }) { return <div className="section-stack"><SectionHeader eyebrow="FDR / ROTA" title={t.pageShifts} description={language === "km" ? "គ្រប់គ្រងអ្នកទទួលខុសត្រូវ និងការប្រគល់វេនប្រចាំថ្ងៃ។" : "Manage shift ownership and daily handoffs."} actions={<button className="primary-button" onClick={() => toast.info(language === "km" ? "ទម្រង់បន្ថែមវេនបានបើក" : "Shift form ready")}><Plus size={16} />{t.addShift}</button>} /><div className="shift-roster">{[{ name: "Morning", time: "07:00 — 15:00", owner: "John Doe", role: "Front office manager", tone: "sunrise" }, { name: "Afternoon", time: "15:00 — 23:00", owner: "Dara Lim", role: "Duty supervisor", tone: "sun" }, { name: "Night", time: "23:00 — 07:00", owner: "Nary Chann", role: "Night auditor", tone: "moon" }].map((item) => <div className="roster-card" key={item.name}><span className={cn("roster-icon", item.tone)}>{item.tone === "sunrise" ? <Sunrise size={18} /> : item.tone === "sun" ? <Sun size={18} /> : <Moon size={18} />}</span><div><span className="eyebrow">{item.time}</span><h3>{item.name} shift</h3><strong>{item.owner}</strong><p>{item.role}</p></div><span className="status-pill approved"><Check size={12} />Ready</span></div>)}</div></div>; }
function AdminView({ language, t, onLanguageToggle }: { language: Language; t: Copy; onLanguageToggle: () => void }) { return <div className="section-stack"><SectionHeader eyebrow="FDR / CONTROL ROOM" title={t.pageAdmin} description={language === "km" ? "ការកំណត់ដែលធ្វើឱ្យ FDR សមនឹងរបៀបធ្វើការរបស់ក្រុមអ្នក។" : "The settings that keep FDR aligned with the way your team works."} /><div className="settings-layout"><div className="settings-nav"><button className="settings-nav-active"><Palette size={16} />Appearance</button><button><ShieldCheck size={16} />Permissions</button><button><Bell size={16} />Notifications</button><button><FileText size={16} />Report rules</button></div><div className="panel settings-panel"><PanelHeading icon={<Palette size={16} />} title={language === "km" ? "ភាសា និងរូបរាង" : "Language & appearance"} /><div className="settings-row"><div><strong>{language === "km" ? "ភាសាប្រព័ន្ធ" : "System language"}</strong><span>{language === "km" ? "Khmer is the current display language." : "English is the current display language."}</span></div><button className="secondary-button" onClick={onLanguageToggle}>{language === "km" ? "Switch to English" : "ប្តូរទៅភាសាខ្មែរ"}</button></div><div className="settings-row"><div><strong>{language === "km" ? "តំបន់ពេលវេលា" : "Time zone"}</strong><span>Asia/Phnom_Penh · UTC+7</span></div><span className="setting-value">UTC +7</span></div><div className="settings-row"><div><strong>{language === "km" ? "ម៉ោងបិទរបាយការណ៍" : "Report close time"}</strong><span>{language === "km" ? "បញ្ចូនការរំលឹកមុនពេលវេនបន្ទាប់" : "Reminders are sent before the next shift."}</span></div><span className="setting-value">11:45</span></div></div></div></div>; }

function SectionHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) { return <div className="section-header"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2><p>{description}</p></div>{actions}</div>; }
function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) { return <div className="empty-state"><span>{icon}</span><h3>{title}</h3><p>{detail}</p></div>; }
function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) { return <div className="data-table-wrap"><table className="data-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>; }
function TaskModal({ language, t, onClose, onAdd }: { language: Language; t: Copy; onClose: () => void; onAdd: (title: string, priority: TaskPriority, due: string) => void }) { const [title, setTitle] = useState(""); const [priority, setPriority] = useState<TaskPriority>("Med"); const [due, setDue] = useState("12:00"); return <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><div className="modal-sheet"><div className="modal-heading"><div><span className="eyebrow">FDR / WORK QUEUE</span><h2>{t.newTask}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><div className="modal-body"><Field label={language === "km" ? "ចំណងជើងភារកិច្ច" : "Task title"}><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder={language === "km" ? "ឧ. ពិនិត្យបន្ទប់ VIP" : "e.g. Verify VIP rooms"} /></Field><div className="form-grid two"><Field label={language === "km" ? "អាទិភាព" : "Priority"}><select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}><option value="High">{t.high}</option><option value="Med">{t.med}</option><option value="Low">{t.low}</option></select></Field><Field label={language === "km" ? "ម៉ោងកំណត់" : "Due time"}><input type="time" value={due} onChange={(event) => setDue(event.target.value)} /></Field></div></div><div className="modal-actions"><button className="secondary-button" onClick={onClose}>{language === "km" ? "បោះបង់" : "Cancel"}</button><button className="primary-button" disabled={!title.trim()} onClick={() => onAdd(title.trim(), priority, due)}><Plus size={15} />{t.newTask}</button></div></div></div>; }
