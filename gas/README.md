# FDR · Front Desk Report — Google Apps Script Web App
# របាយការណ៍ផ្នែកទទួលភ្ញៀវ · វេបអាប់ Google Apps Script

A complete port of the FDR hotel front-desk operations app to **Google Apps Script + Google Spreadsheet**.
The UI is Khmer-first with an English toggle (EN button), visually identical to the original web build — same
Heritage Operations theme, same 14 views, same modals, same print/CSV exports.

វេបអាប់ប្រព័ន្ធរបាយការណ៍ផ្នែកទទួលភ្ញៀវ (FDR) ដែលពង្រីកជា **Google Apps Script + Google Spreadsheet** ពេញលេញ —
រូបរាងដូចទីលំនដើម ភាសាខ្មែរជាផ្លូវការ (ប្តូរទៅ EN បាន) មើលឃើញទាំង ១៤ ទំព័រ បង្អួច Modal និងការបោះពុម្ព / ទាញ CSV។

---

## 1 · What is in this folder · អ្វីដែលមានក្នុងថតនេះ

| File | ឯកសារ | Purpose · តួនាទី |
|---|---|---|
| `Code.gs` | `Code.gs` | Backend + auto-created spreadsheet database (Users, Sessions, Tasks, Reports, Inquiries, Feedback, Finance, Audit) |
| `index.html` | `index.html` | The whole front-end UI (Khmer + English) |
| `assets.html` | `assets.html` | Embedded base64 photos + FDR seal (keeps the app self-contained — no external image hosting) |

## 2 · Install · ដំឡើង

### Khmer
1. ចូល [script.google.com](https://script.google.com) → ចុច **New project** (គម្រោងថ្មី)។
2. ប្តូរឈ្មោះគម្រោងទៅ `FDR — Front Desk Report`។
3. បើក **Project Settings** (ក្តារប៊ីកុំ / ⚙️) → បញ្ជាក់ថា **Runtime = V8** — ត្រូវការ V8 សុទ្ធ (មិនមែន Rhino ទេ)។
4. នៅក្នុងឯកសារ `Code.gs` → សូម **បិទភ្ជាប់ (paste) ខ្សែអក្សរទាំងមូល** នៃ `gas/Code.gs` ទៅជំនួស។
5. ចុច **+** → **HTML** → ដាក់ឈ្មោះ `index` (ត្រូវតែជា `index` ពិតប្រាកដ) → paste ខ្សែអក្សរទាំងមូលនៃ `gas/index.html`។
6. ចុច **+** → **HTML** ម្តងទៀត → ដាក់ឈ្មោះ `assets` → paste ខ្សែអក្សរទាំងមូលនៃ `gas/assets.html`។
7. ចុច **Deploy** → **New deployment** → ជ្រើសរើស **Web app** ៖
   - **Execute as:** `Me` (ខ្លួនឯង)
   - **Who has access:** `Anyone with a Google account` (បើចង់ឱ្យបុគ្គលិករបស់អ្នកប្រើបាន ជ្រើសយ៉ាងនេះ; ឬក៏ `Only myself` សម្រាប់សាកល្បង)
8. ចុច **Deploy** → អនុញ្ញាត (Authorize) ពេល Google រួចសួរអំពីសិទ្ធិ។
9. ចំណាយពេលបន្តិច រួច **Web app URL** នឹងបង្ហាញ — ចុច URL ដើម្បីបើកកម្មវិធី។ ដើម្បីឃើញទិន្នន័យប្រតិបត្តិការពិត សូមចុច **Deploy → Manage deployments → Edit (✏️) → Version: New version** រាល់ពេលកែកូដ។

### English
1. Go to [script.google.com](https://script.google.com) → **New project**.
2. Rename the project to `FDR — Front Desk Report`.
3. Open **Project Settings** (⚙️) → confirm **Runtime = V8** — V8 is required (not Rhino).
4. In the `Code.gs` file → **paste the entire contents** of `gas/Code.gs`.
5. Click **+** → **HTML** → name it exactly `index` → paste the entire contents of `gas/index.html`.
6. Click **+** → **HTML** again → name it `assets` → paste the entire contents of `gas/assets.html`.
7. Click **Deploy** → **New deployment** → type **Web app**:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone with a Google account` (so your team can use it; or `Only myself` while testing)
8. Click **Deploy** and approve the permissions prompt.
9. Wait a moment — the **Web app URL** appears; open it to launch the app. After any code change, publish **Deploy → Manage deployments → Edit (✏️) → Version: New version**.

## 3 · The database (spreadsheet) · ទិន្នន័យ (Spreadsheet)

**ខ្មែរ**
- ដំណើរការលើដំបូង កម្មវិធី **បង្កើត Google Spreadsheet ដោយស្វ័យប្រវត្តិ** ឈ្មោះ `FDR — Front Desk Report (Database)` នៅក្នុង Drive របស់អ្នក ហើយ ID ត្រូវបានរក្សាទុកក្នុង **Script Properties** (key: `FDR_SPREADSHEET_ID`) — អ្នកមិនចាំបាច់រៀបចំអ្វីទេ។
- គ្រប់នក្នុង Spreadsheet ត្រូវបាន **លាក់ (hidden)** ដោយស្វ័យប្រវត្តិ ដើម្បីឱ្យប្រើប្រាស់ស្អាត៖ ចុចឆ្វេងលើ tab នក → **Show sheet** ដើម្បីមើលទិន្នន័យ។ មាន ៨ ន៖ `Users`, `Sessions`, `Tasks`, `Reports`, `Inquiries`, `Feedback`, `Finance`, `Audit`។
- (ជម្រើស) បើចង់បង្កើត/ជួសជុល database មុនពេលបើក web app — បើក editor ជ្រើសរើស function **`setupDatabase()`** រួចចុច **Run** ម្តង ហើយអនុញ្ញាតសិទ្ធិ។

**English**
- On first use the app **auto-creates a Google Spreadsheet** named `FDR — Front Desk Report (Database)` in your Drive; its ID is stored in **Script Properties** (key `FDR_SPREADSHEET_ID`) — nothing to set up.
- All data sheets are **hidden by default** for a clean workspace: right-click a sheet tab → **Show sheet** to inspect data. Eight sheets: `Users`, `Sessions`, `Tasks`, `Reports`, `Inquiries`, `Feedback`, `Finance`, `Audit` (each with a frozen header row).
- (Optional) To create/repair the database before opening the web app: in the editor select the **`setupDatabase()`** function and click **Run** once, then authorize.

## 4 · Demo accounts · គណនីសាកល្បង

| Email | Password | Role | ឧបករណ៍ |
|---|---|---|---|
| `admin@hotel.com` | `admin123` | **Admin** — full access incl. account approvals | អ្នកគ្រប់គ្រង |
| `staff@hotel.com` | `staff123` | **Staff** — all views except Administration | បុគ្គលិក |
| `nary@hotel.com` | `trainee123` | **Pending** — for testing the approval flow (login blocked until admin approves) | រង់ចាំអនុម័ត |

Passwords are stored as **salted SHA-256 hashes** in the `Users` sheet (never plain text). Sessions last **1 year**.
Time zone: **Asia/Phnom_Penh (UTC+7)**.

ពាក្យសម្ងាត់ត្រូវបានរក្សាទុកជា **hash SHA-256 ពន្យល់** (មិនមែនអក្សរស្របទេ)។ សំណាកសម្របច្របល់មានអាយុ ១ ឆ្នាំ។ តំបន់ពេលវេលា៖ Asia/Phnom_Penh (UTC+7)។

## 5 · Feature map · មុខងារ

- **Login / Register** — staff self-register; accounts sit *pending* until an admin approves or rejects them (Administration panel). ចុះឈ្មោះដោយខ្លួនឯង រួច Admin អនុម័ត/បដិសេធ។
- **Dashboard** — live occupancy, income, open tasks, alerts, 7-day chart, recent reports. ផ្ទាំងគ្រប់គ្រង។
- **Daily report** — draft (upsert: one draft per reporter + date + shift) or submit → `RPT-####` ID, occupancy % and estimated income computed on the server. សេចក្តីព្រាង/ដាក់ស្នើ។
- **Shift reports sheet** — pick a date → generates the 3-shift handover sheet from real submitted reports; CSV + print/PDF. សន្លឹកវេន។
- **Tasks** — 3-column kanban (Pending / In Progress / Completed), `TSK-###`, priority chips, add via modal. ក្តារភារកិច្ច។
- **Finance** — income / expenses / refunds ledger (`INC-###` `EXP-###` `REF-###`) + cash variance check, deep calculation, cash tracking, CSV export. ហិរញ្ញវត្ថុ។
- **Guest inquiries** — `INQ-###`, channel/category/outcome filters, add via modal. សំណួរអតិថិជន។
- **Closeout & handover** — connected shift sheet (afternoon float links from morning), print/PDF + CSV. បិទបញ្ជី។
- **Guest feedback** — `FB-###` log with saved-entries list. មតិភ្ញៀវ។
- **Monthly / Yearly** — computed from submitted reports (avg occupancy, gross income, days covered, quality bars, YTD). ប្រចាំខែ/ប្រចាំឆ្នាំ។
- **Report history** — search by report ID or reporter, live filtering. ប្រវត្តិរបាយការណ៍។
- **Audit log** — every mutation is recorded (who/what/when). កំណត់ហេតុសវនកម្ម។
- **Shift management** — 3-shift roster. គ្រប់គ្រងវេន។
- **Administration (admin only)** — approve/reject pending accounts, team table. អ្នកគ្រប់គ្រង។

## 6 · Notes & limits · ចំណាំ

- **V8 runtime required** on both the script and the client (the UI uses modern JS). ត្រូវការ V8។
- The web app must be deployed as **Web app** (not API-only). `index.html` embeds `<?!= include('assets'); ?>` — this is Google's server-side include that injects `assets.html` at render time; do **not** remove that line or rename the `assets` file. កុំលុបបញ្ជា include។
- `doGet()` grants `XFrameOptionsMode.ALLOWALL` so the app also embeds cleanly in Google Sites if you later put it on an intranet page.
- Data lives in the Drive spreadsheet: **back it up by making a copy** of that file; deleting the spreadsheet is safe (a fresh one is rebuilt on next run, with seed demo data). មកូបី spreadsheet ដើម្បីរក្សាទុក។
- The 7-day dashboard chart, closeout roster names, and notification count are static display elements (identical to the original design); every data table (tasks, reports, finance, inquiries, feedback, history, audit, users) is live from the spreadsheet.

---
*Folder: `gas/` · 3 files · no build step, no npm, no external image hosting — just paste & deploy.*
