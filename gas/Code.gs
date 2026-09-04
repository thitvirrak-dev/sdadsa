/**
 * FDR — Front Desk Report · Google Apps Script backend
 * របាយការណ៍ផ្នែកទទួលភ្ញៀវ · ម៉ាស៊ីនបម្រើ Google Apps Script
 *
 * The database is a real Google Spreadsheet (auto-created on first use and
 * stored in the same Drive account as the script). Every sheet mirrors the
 * FDR tables:
 *
 *   Users     — accounts (name, email, salted SHA-256 hash, role, status)
 *   Sessions  — sign-in tokens (1 year lifetime)
 *   Tasks     — shift work queue
 *   Reports   — submitted / draft shift reports (RPT-####)
 *   Inquiries — guest questions & follow-ups
 *   Feedback  — guest comments
 *   Finance   — income / expense / refund ledger
 *   Audit     — activity trail
 *
 * Deployment: Extensions → Apps Script → paste this file (Code.gs) plus the
 * index.html + assets.html files → Deploy → Web app (Execute as: me).
 * See README.md (កម្មន័យដំឡើង) for the full bilingual guide.
 */

var DB_NAME = 'FDR — Front Desk Report (Database)';
var PROP_KEY = 'FDR_SPREADSHEET_ID';
var TZ = 'Asia/Phnom_Penh';
var ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

/** Sheet name → column headers (order matters). */
var SHEETS = {
  Users: ['id', 'name', 'email', 'password_hash', 'salt', 'role', 'department', 'shift', 'status', 'created_at'],
  Sessions: ['token', 'user_id', 'created_at', 'expires_at'],
  Tasks: ['id', 'title', 'detail', 'status', 'priority', 'due', 'created_by', 'created_at'],
  Reports: ['id', 'date_iso', 'shift', 'reporter_id', 'reporter_name', 'total_rooms', 'occupied', 'occupancy_pct', 'income', 'status', 'notes', 'created_at'],
  Inquiries: ['id', 'date_iso', 'channel', 'category', 'guest_name', 'details', 'outcome', 'follow_up', 'staff', 'created_at'],
  Feedback: ['id', 'date_iso', 'channel', 'guest_name', 'room', 'comment', 'staff', 'created_at'],
  Finance: ['id', 'date_iso', 'shift', 'type', 'category', 'description', 'amount', 'staff', 'created_at'],
  Audit: ['id', 'ts', 'user_id', 'user_name', 'event', 'area']
};

// ---------------------------------------------------------------------------
// Web app entry point
// ---------------------------------------------------------------------------

function doGet() {
  ensureDatabase_();
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('FDR · របាយការណ៍ផ្នែកទទួលភ្ញៀវ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Manual hook: run once from the editor to create/repair the spreadsheet. */
function setupDatabase() {
  ensureDatabase_();
}

// ---------------------------------------------------------------------------
// Database bootstrap
// ---------------------------------------------------------------------------

function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_KEY);
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (err) {
      // File was moved/deleted — recreate below.
    }
  }
  var ss = SpreadsheetApp.create(DB_NAME);
  props.setProperty(PROP_KEY, ss.getId());
  return ss;
}

function ensureDatabase_() {
  var ss = getSpreadsheet_();
  var first = true;
  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      var headers = SHEETS[name];
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sh.setFrozenRows(1);
      sh.hideSheet();
    }
    if (first) {
      // Keep the default sheet out of the way.
      var sheet1 = ss.getSheetByName('Sheet1');
      if (sheet1 && sheet1.getName() === 'Sheet1') ss.deleteSheet(sheet1);
      first = false;
    }
  });
  seedIfEmpty_(ss);
}

function sh_(name) {
  return getSpreadsheet_().getSheetByName(name);
}

/** Read all data rows of a sheet as objects (plus internal __row number). */
function readSheet_(name) {
  var sh = sh_(name);
  var headers = SHEETS[name];
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, headers.length).getValues();
  return values.map(function (row, i) {
    var obj = { __row: i + 2 };
    headers.forEach(function (col, c) {
      obj[col] = row[c];
    });
    return obj;
  });
}

function appendRow_(name, values) {
  sh_(name).appendRow(values);
}

function setCell_(name, rowNumber, columnName, value) {
  var col = SHEETS[name].indexOf(columnName) + 1;
  sh_(name).getRange(rowNumber, col).setValue(value);
}

function col_(name, columnName) {
  return SHEETS[name].indexOf(columnName) + 1;
}

function writeRow_(name, rowNumber, values) {
  sh_(name).getRange(rowNumber, 1, 1, values.length).setValues([values]);
}

// ---------------------------------------------------------------------------
// Passwords + sessions
// ---------------------------------------------------------------------------

function sha256Hex_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    var h = (b < 0 ? b + 256 : b).toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
}

function hashPassword_(password, salt) {
  return sha256_(salt + ':' + password);
}

function verifyPassword_(password, salt, expected) {
  return hashPassword_(password, salt) === expected;
}

function createSession_(userId) {
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  var now = Date.now();
  appendRow_('Sessions', [token, userId, now, now + ONE_YEAR_MS]);
  return token;
}

function destroySession_(token) {
  readSheet_('Sessions').forEach(function (row) {
    if (String(row.token) === token) sh_('Sessions').deleteRow(row.__row);
  });
}

function userByToken_(token) {
  if (!token) return null;
  var now = Date.now();
  var sessions = readSheet_('Sessions').filter(function (row) {
    return String(row.token) === token && Number(row.expires_at) > now;
  });
  if (!sessions.length) return null;
  return userById_(Number(sessions[0].user_id));
}

function userById_(id) {
  return readSheet_('Users').filter(function (row) {
    return Number(row.id) === id;
  })[0] || null;
}

function userByEmail_(email) {
  return readSheet_('Users').filter(function (row) {
    return String(row.email).toLowerCase() === String(email).trim().toLowerCase();
  })[0] || null;
}

function requireUser_(token) {
  var user = userByToken_(token);
  if (!user || user.status !== 'active') throw new Error('FDR:unauthorized');
  return user;
}

function publicUser_(row) {
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role === 'admin' ? 'Admin' : 'Staff',
    department: String(row.department),
    shift: String(row.shift),
    status: String(row.status)
  };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function todayIso_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
}

function isoDate_(ms) {
  return Utilities.formatDate(new Date(ms), TZ, 'yyyy-MM-dd');
}

function hhmm_(ms) {
  return Utilities.formatDate(new Date(ms), TZ, 'HH:mm');
}

function asString_(value, max) {
  return String(value === null || value === undefined ? '' : value).trim().slice(0, max || 500);
}

function formatUsd_(amount) {
  return '$' + Math.round(Number(amount) || 0).toLocaleString('en-US');
}

function estimateIncome_(occupied) {
  return Math.round((Number(occupied) * 61.2) / 10) * 10;
}

/** Next RPT-####/TSK-###-style id for a sheet's id column. */
function nextId_(sheetName, prefix) {
  var max = 0;
  var width = 3;
  readSheet_(sheetName).forEach(function (row) {
    var id = String(row.id || '');
    if (id.indexOf(prefix) !== 0) return;
    var suffix = id.slice(prefix.length);
    var numeric = Number(suffix);
    if (isFinite(numeric) && numeric > 0) {
      if (numeric > max) max = numeric;
      width = Math.max(width, suffix.length);
    }
  });
  return prefix + ('000000' + (max + 1)).slice(-width);
}

function audit_(user, event, area) {
  var rows = readSheet_('Audit');
  appendRow_('Audit', [rows.length + 1, Date.now(), user ? user.id : '', user ? user.name : 'System', event, area]);
}

/** Serialize rows the same way the client store expects. */
function listTasks_() {
  return readSheet_('Tasks').sort(function (a, b) {
    return Number(b.created_at) - Number(a.created_at);
  }).map(function (row) {
    return {
      id: String(row.id),
      title: String(row.title),
      detail: String(row.detail || ''),
      status: String(row.status),
      priority: String(row.priority),
      due: String(row.due || '')
    };
  });
}

function listReports_() {
  return readSheet_('Reports').sort(function (a, b) {
    if (a.date_iso !== b.date_iso) return String(a.date_iso) < String(b.date_iso) ? 1 : -1;
    return Number(b.created_at) - Number(a.created_at);
  }).map(function (row) {
    return {
      id: String(row.id),
      dateIso: String(row.date_iso),
      shift: String(row.shift),
      reporter: String(row.reporter_name),
      occupancy: Number(row.occupancy_pct) + '%',
      income: formatUsd_(row.income),
      incomeAmount: Number(row.income) || 0,
      status: row.status === 'draft' ? 'Draft' : row.status === 'approved' ? 'Approved' : 'Submitted',
      notes: String(row.notes || ''),
      createdAt: Number(row.created_at)
    };
  });
}

function listInquiries_() {
  return readSheet_('Inquiries').sort(function (a, b) {
    return Number(b.created_at) - Number(a.created_at);
  }).map(function (row) {
    return {
      id: String(row.id),
      dateIso: String(row.date_iso),
      channel: String(row.channel),
      category: String(row.category),
      guestName: String(row.guest_name || ''),
      details: String(row.details || ''),
      outcome: String(row.outcome),
      followUp: String(row.follow_up || ''),
      staff: String(row.staff || '')
    };
  });
}

function listFeedback_() {
  return readSheet_('Feedback').sort(function (a, b) {
    return Number(b.created_at) - Number(a.created_at);
  }).map(function (row) {
    return {
      id: String(row.id),
      dateIso: String(row.date_iso),
      channel: String(row.channel),
      guestName: String(row.guest_name || ''),
      room: String(row.room || ''),
      comment: String(row.comment || ''),
      staff: String(row.staff || '')
    };
  });
}

function listFinance_() {
  return readSheet_('Finance').sort(function (a, b) {
    if (a.date_iso !== b.date_iso) return String(a.date_iso) < String(b.date_iso) ? 1 : -1;
    return Number(b.created_at) - Number(a.created_at);
  }).map(function (row) {
    return {
      id: String(row.id),
      dateIso: String(row.date_iso),
      shift: String(row.shift),
      type: String(row.type),
      category: String(row.category || ''),
      description: String(row.description || ''),
      amount: Number(row.amount) || 0,
      staff: String(row.staff || '')
    };
  });
}

function listAudit_() {
  return readSheet_('Audit').sort(function (a, b) {
    return Number(b.ts) - Number(a.ts);
  }).slice(0, 200).map(function (row) {
    return {
      id: 'EV-' + row.id,
      dateIso: isoDate_(row.ts),
      time: hhmm_(row.ts),
      user: String(row.user_name),
      event: String(row.event),
      area: String(row.area)
    };
  });
}

function listUsers_(pendingOnly) {
  return readSheet_('Users')
    .filter(function (row) {
      return pendingOnly ? row.status === 'pending' : row.status !== 'pending';
    })
    .sort(function (a, b) {
      return Number(a.created_at) - Number(b.created_at);
    })
    .map(publicUser_);
}

function buildState_(user) {
  var admin = user.role === 'admin';
  return {
    tasks: listTasks_(),
    reports: listReports_(),
    inquiries: listInquiries_(),
    feedback: listFeedback_(),
    finance: listFinance_(),
    audit: listAudit_(),
    users: admin ? listUsers_(false) : [],
    pendingUsers: admin ? listUsers_(true) : []
  };
}

// ---------------------------------------------------------------------------
// Public API — called from index.html via google.script.run.
// Every handler receives ONE plain payload object (the client always sends a
// single argument) and returns plain JSON-serializable objects. Failures are
// thrown as Error('FDR:…') codes that the client maps to friendly messages.
//
//   me({ token })                 → user | null
//   login({ email, password })    → { user, token }   (FDR:invalid|pending|rejected)
//   register({ name, email, … })  → { ok, status }
//   logout({ token })             → { ok }
//   getState({ token })           → combined state
//   addTask({ token, … })         → { id }
//   setTaskStatus({ token, id, status })          → { ok }
//   submitReport({ token, … })   → { id, status, occupancy?, income? }
//   setReportStatus({ token, id, status })        → { ok } (admin)
//   addInquiry / addFeedback / addFinance          → { id }
//   setUserStatus({ token, id, status })           → { ok } (admin)
// ---------------------------------------------------------------------------

/** Current signed-in user, or null. */
function me(payload) {
  ensureDatabase_();
  var user = userByToken_(payload && payload.token ? String(payload.token) : '');
  if (!user || user.status !== 'active') return null;
  return publicUser_(user);
}

/** Sign in. Returns { user, token }. Throws FDR:invalid|pending|rejected. */
function login(payload) {
  ensureDatabase_();
  var user = userByEmail_(payload.email);
  if (!user || !verifyPassword_(payload.password, String(user.salt), String(user.password_hash))) {
    throw new Error('FDR:invalid');
  }
  if (user.status === 'pending') throw new Error('FDR:pending');
  if (user.status === 'rejected') throw new Error('FDR:rejected');
  var token = createSession_(Number(user.id));
  audit_(user, 'Signed in', 'Access');
  return { user: publicUser_(user), token: token };
}

/** Self-registration → pending account (admin approves). */
function register(payload) {
  ensureDatabase_();
  var name = asString_(payload.name, 80);
  var email = asString_(payload.email, 120).toLowerCase();
  var password = String(payload.password || '');
  var department = asString_(payload.department, 60) || 'Front office';
  var shift = asString_(payload.shift, 20) || 'Morning';
  if (!name || !email) throw new Error('Name and email are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');
  if (userByEmail_(email)) throw new Error('An account with this email already exists');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var rows = readSheet_('Users');
    var salt = Utilities.getUuid().replace(/-/g, '').slice(0, 32);
    appendRow_('Users', [
      rows.length + 1, name, email, hashPassword_(password, salt), salt,
      'staff', department, shift, 'pending', Date.now()
    ]);
    var created = userByEmail_(email);
    audit_(created, 'Requested an account (awaiting admin approval)', 'Access');
  } finally {
    lock.releaseLock();
  }
  return { ok: true, status: 'pending' };
}

function logout(payload) {
  var token = payload && payload.token ? String(payload.token) : '';
  try {
    var user = userByToken_(token);
    if (user) audit_(user, 'Signed out', 'Access');
  } finally {
    if (token) destroySession_(token);
  }
  return { ok: true };
}

/** Combined state for the signed-in user. */
function getState(payload) {
  return buildState_(requireUser_(payload.token));
}

// ---- Tasks ------------------------------------------------------------------

function addTask(payload) {
  var user = requireUser_(payload.token);
  var title = asString_(payload.title, 140);
  if (!title) throw new Error('Task title is required');
  var priority = ['High', 'Med', 'Low'].indexOf(payload.priority) !== -1 ? payload.priority : 'Med';
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var id = nextId_('Tasks', 'TSK-');
    appendRow_('Tasks', [id, title, asString_(payload.detail, 200), 'Pending', priority, asString_(payload.due, 10), user.name, Date.now()]);
    audit_(user, 'Added task ' + id, 'Tasks');
    return { id: id };
  } finally {
    lock.releaseLock();
  }
}

function setTaskStatus(payload) {
  var user = requireUser_(payload.token);
  if (['Pending', 'In Progress', 'Completed'].indexOf(payload.status) === -1) throw new Error('Invalid task status');
  var row = readSheet_('Tasks').filter(function (task) {
    return String(task.id) === payload.id;
  })[0];
  if (!row) throw new Error('Task not found');
  setCell_('Tasks', row.__row, 'status', payload.status);
  audit_(user, 'Task ' + payload.id + ' → ' + payload.status, 'Tasks');
  return { ok: true };
}

// ---- Reports ------------------------------------------------------------------

/** payload: { token, dateIso, shift, totalRooms, occupied, notes, status?: 'draft' } */
function submitReport(payload) {
  var user = requireUser_(payload.token);
  var dateIso = asString_(payload.dateIso, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) throw new Error('A valid date is required');
  var shift = ['Morning', 'Afternoon', 'Night'].indexOf(payload.shift) !== -1 ? payload.shift : 'Morning';
  var isDraft = payload.status === 'draft';
  var totalRooms = Math.max(0, Math.min(2000, Number(payload.totalRooms) || 0));
  var occupied = Math.max(0, Math.min(totalRooms, Number(payload.occupied) || 0));
  var notes = asString_(payload.notes, 2000);
  var pct = totalRooms ? Math.min(100, Math.round((occupied / totalRooms) * 100)) : 0;
  var income = estimateIncome_(occupied);

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (isDraft) {
      var existing = readSheet_('Reports').filter(function (report) {
        return report.status === 'draft' && String(report.date_iso) === dateIso && report.shift === shift && Number(report.reporter_id) === Number(user.id);
      })[0];
      if (existing) {
        writeRow_('Reports', existing.__row, [
          existing.id, dateIso, shift, existing.reporter_id, existing.reporter_name,
          totalRooms, occupied, pct, income, 'draft', notes, Date.now()
        ]);
        audit_(user, 'Updated draft ' + existing.id, 'Report');
        return { id: existing.id, status: 'draft' };
      }
      var draftId = nextId_('Reports', 'RPT-');
      appendRow_('Reports', [draftId, dateIso, shift, user.id, user.name, totalRooms, occupied, pct, income, 'draft', notes, Date.now()]);
      audit_(user, 'Saved draft ' + draftId, 'Report');
      return { id: draftId, status: 'draft' };
    }
    var id = nextId_('Reports', 'RPT-');
    appendRow_('Reports', [id, dateIso, shift, user.id, user.name, totalRooms, occupied, pct, income, 'submitted', notes, Date.now()]);
    audit_(user, 'Submitted shift report ' + id, 'Report');
    return { id: id, status: 'submitted', occupancy: pct + '%', income: formatUsd_(income) };
  } finally {
    lock.releaseLock();
  }
}

/** Admin: approve / reopen a report. */
function setReportStatus(payload) {
  var user = requireUser_(payload.token);
  if (user.role !== 'admin') throw new Error('Admin access required');
  if (['approved', 'submitted'].indexOf(payload.status) === -1) throw new Error('Invalid report status');
  var row = readSheet_('Reports').filter(function (report) {
    return String(report.id) === payload.id;
  })[0];
  if (!row) throw new Error('Report not found');
  setCell_('Reports', row.__row, 'status', payload.status);
  audit_(user, (payload.status === 'approved' ? 'Approved' : 'Reopened') + ' report ' + payload.id, 'Report');
  return { ok: true };
}

// ---- Inquiries ------------------------------------------------------------------

function addInquiry(payload) {
  var user = requireUser_(payload.token);
  var details = asString_(payload.details, 500);
  if (!details) throw new Error('Inquiry details are required');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var id = nextId_('Inquiries', 'INQ-');
    appendRow_('Inquiries', [
      id,
      asString_(payload.dateIso, 10) || todayIso_(),
      asString_(payload.channel, 40) || 'Front desk',
      asString_(payload.category, 40) || 'General',
      asString_(payload.guestName, 80),
      details,
      payload.outcome === 'resolved' ? 'resolved' : 'follow_up',
      asString_(payload.followUp, 200),
      user.name,
      Date.now()
    ]);
    audit_(user, 'Logged inquiry ' + id, 'Report');
    return { id: id };
  } finally {
    lock.releaseLock();
  }
}

// ---- Guest feedback ------------------------------------------------------------------

function addFeedback(payload) {
  var user = requireUser_(payload.token);
  var comment = asString_(payload.comment, 1000);
  if (!comment) throw new Error('Feedback text is required');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var id = nextId_('Feedback', 'FB-');
    appendRow_('Feedback', [
      id,
      asString_(payload.dateIso, 10) || todayIso_(),
      asString_(payload.channel, 40) || 'Front desk',
      asString_(payload.guestName, 80),
      asString_(payload.room, 10),
      comment,
      user.name,
      Date.now()
    ]);
    audit_(user, 'Logged guest feedback ' + id, 'Report');
    return { id: id };
  } finally {
    lock.releaseLock();
  }
}

// ---- Finance ------------------------------------------------------------------

/** payload: { token, type: income|expense|refund, dateIso, shift, category, description, amount } */
function addFinance(payload) {
  var user = requireUser_(payload.token);
  var type = ['income', 'expense', 'refund'].indexOf(payload.type) !== -1 ? payload.type : null;
  if (!type) throw new Error('Invalid entry type');
  var amount = Number(payload.amount);
  if (!isFinite(amount) || amount <= 0) throw new Error('Enter an amount greater than zero');
  var prefix = type === 'income' ? 'INC-' : type === 'expense' ? 'EXP-' : 'REF-';
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var id = nextId_('Finance', prefix);
    appendRow_('Finance', [
      id,
      asString_(payload.dateIso, 10) || todayIso_(),
      ['Morning', 'Afternoon', 'Night'].indexOf(payload.shift) !== -1 ? payload.shift : 'Morning',
      type,
      asString_(payload.category, 60),
      asString_(payload.description, 200),
      amount,
      user.name,
      Date.now()
    ]);
    audit_(user, 'Recorded ' + type + ' ' + id + ' (' + formatUsd_(amount) + ')', 'Finance');
    return { id: id };
  } finally {
    lock.releaseLock();
  }
}

// ---- Admin: account approvals ------------------------------------------------------------------

/** payload: { token, id, status: active|rejected|pending } */
function setUserStatus(payload) {
  var user = requireUser_(payload.token);
  if (user.role !== 'admin') throw new Error('Admin access required');
  if (['active', 'rejected', 'pending'].indexOf(payload.status) === -1) throw new Error('Invalid account status');
  var target = userById_(Number(payload.id));
  if (!target) throw new Error('User not found');
  if (Number(target.id) === Number(user.id) && payload.status !== 'active') {
    throw new Error('You cannot change your own account status');
  }
  setCell_('Users', target.__row, 'status', payload.status);
  var verb = payload.status === 'active' ? 'Approved' : payload.status === 'rejected' ? 'Rejected' : 'Reset';
  audit_(user, verb + ' account ' + target.name, 'Access');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Seed — only when the Users sheet is empty (same demo data as the web build)
// ---------------------------------------------------------------------------

function seedIfEmpty_(ss) {
  var users = ss.getSheetByName('Users');
  if (users.getLastRow() > 1) return;

  var now = Date.now();
  var day = 86400000;

  function user(name, email, password, role, department, shift, status) {
    var salt = Utilities.getUuid().replace(/-/g, '').slice(0, 32);
    var rows = users.getLastRow(); // includes header
    users.appendRow([rows, name, email, hashPassword_(password, salt), salt, role, department, shift, status, now - Math.floor(Math.random() * day)]);
    return Number(rows);
  }

  var adminId = user('John Doe', 'admin@hotel.com', 'admin123', 'admin', 'Front office', 'Morning', 'active');
  var staffId = user('Sokha Chan', 'staff@hotel.com', 'staff123', 'staff', 'Front office', 'Afternoon', 'active');
  user('Nary Chann', 'nary@hotel.com', 'trainee123', 'staff', 'Front office', 'Night', 'pending');

  var seedDate = isoDate_(now - day);
  var olderDate = isoDate_(now - 2 * day);

  var tasks = ss.getSheetByName('Tasks');
  tasks.appendRow(['TSK-104', 'Verify late check-outs', 'Rooms 302, 415 and 608', 'Pending', 'High', '10:30', 'John Doe', now - 3600000]);
  tasks.appendRow(['TSK-103', 'Prepare VIP arrival notes', 'Ms. Sokha · room 706', 'In Progress', 'High', '11:00', 'John Doe', now - 7200000]);
  tasks.appendRow(['TSK-102', 'Review card settlement', 'POS batch #8841', 'In Progress', 'Med', '12:00', 'John Doe', now - 10800000]);
  tasks.appendRow(['TSK-101', 'Restock welcome cards', 'Front desk cabinet', 'Completed', 'Low', '08:45', 'John Doe', now - 14400000]);

  var reports = ss.getSheetByName('Reports');
  function report(id, dateIso, shift, reporterId, reporterName, occupied, status, notes) {
    var total = 100;
    reports.appendRow([id, dateIso, shift, reporterId, reporterName, total, occupied, Math.round((occupied / total) * 100), estimateIncome_(occupied), status, notes, Date.parse(dateIso + 'T09:40:00Z')]);
  }
  report('RPT-2404', seedDate, 'Morning', adminId, 'John Doe', 85, 'submitted', 'VIP arrival handled at check-in.');
  report('RPT-2403', seedDate, 'Afternoon', staffId, 'Sokha Chan', 81, 'submitted', 'Two walk-ins accommodated.');
  report('RPT-2402', seedDate, 'Night', staffId, 'Sokha Chan', 82, 'approved', 'Night audit balanced.');
  report('RPT-2401', olderDate, 'Morning', adminId, 'John Doe', 77, 'draft', '');

  var inquiries = ss.getSheetByName('Inquiries');
  inquiries.appendRow(['INQ-119', seedDate, 'Phone', 'Room info', 'A. Sok', 'Airport transfer at 17:00', 'resolved', '', 'John Doe', now - 5400000]);
  inquiries.appendRow(['INQ-118', seedDate, 'WhatsApp', 'Booking', 'M. Lina', 'Extend stay by 2 nights', 'resolved', '', 'John Doe', now - 5800000]);
  inquiries.appendRow(['INQ-117', seedDate, 'Front desk', 'Special', 'K. Narin', 'Quiet room request', 'follow_up', 'Room move', 'Sokha Chan', now - 6300000]);

  var feedback = ss.getSheetByName('Feedback');
  feedback.appendRow(['FB-032', seedDate, 'Front desk', 'D. Vichea', '412', 'Check-in was quick and the room was ready early. Very much appreciated.', 'Sokha Chan', now - 5000000]);
  feedback.appendRow(['FB-031', seedDate, 'Review card', 'Anonymous', '', 'Loved the breakfast; lobby coffee could start earlier.', 'John Doe', now - 6600000]);

  var finance = ss.getSheetByName('Finance');
  finance.appendRow(['INC-031', seedDate, 'Morning', 'income', 'Room nights', 'Room revenue', 4680, 'John Doe', now - 5200000]);
  finance.appendRow(['INC-030', seedDate, 'Afternoon', 'income', 'Restaurant', 'Dinner service', 520, 'Sokha Chan', now - 4700000]);
  finance.appendRow(['INC-029', seedDate, 'Night', 'income', 'Airport transfer', 'Two transfers', 120, 'Sokha Chan', now - 4300000]);
  finance.appendRow(['EXP-021', seedDate, 'Morning', 'expense', 'Supplies', 'Welcome cards', 84, 'John Doe', now - 5100000]);
  finance.appendRow(['EXP-020', seedDate, 'Night', 'expense', 'Transport', 'Guest transfer', 32, 'Sokha Chan', now - 4200000]);
  finance.appendRow(['REF-008', seedDate, 'Morning', 'refund', 'Rate adjustment', 'Room 412 rate fix', 75, 'John Doe', now - 4900000]);

  ss.getSheetByName('Audit').appendRow([1, now, adminId, 'John Doe', 'Seeded the FDR database', 'Access']);
}
