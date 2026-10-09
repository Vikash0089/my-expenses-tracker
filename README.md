# Spendwise — Personal Expense & Finance Tracker (MERN)

A responsive personal-finance app for tracking expenses, income, money sent/received, budgets, recurring payments, savings goals and reports — with a calendar-first workflow.

## Features

- **Auth** — register, login, persistent login (JWT), protected routes, bcrypt-hashed passwords
- **Dashboard** — month selector, six summary cards (income, expenses, sent, received, balance, savings rate), quick actions, compact calendar with day summary, recent transactions, charts, budget progress, month-over-month comparison
- **Calendar** (primary feature) — full month grid with per-day income / expense / sent / received indicators, transaction counts, today + selected highlighting, month/year pickers, Today button, full keyboard navigation (arrows, PageUp/PageDown, Home/End, Enter), mobile-simplified cells (colour dots), day drawer with summary + transactions, deep links (`/calendar/2026/10/08`)
- **Transactions** — four types (expense, income, sent, received); dynamic add/edit form; search, filters (month, date, type, category, payment method, amount), sorting, pagination, edit, delete
- **Smart "Add" button** — available everywhere; pre-fills the date (calendar), person (People), or category (Categories)
- **Categories** — 13 defaults seeded per user + custom categories (icon, colour)
- **Budgets** — monthly total + per-category limits, progress bars, warnings at 80% and when exceeded
- **Recurring** — daily / weekly / monthly / yearly; posted automatically on the due date
- **People** — lending & borrowing balances ("you gave / you received / remaining"), totals to receive / pay, per-person history
- **Savings goals** — target, saved, target date, notes, progress
- **Reports** — daily / weekly / monthly / yearly / custom range; totals, highest expense, top category, average daily spend, CSV + PDF export
- **Receipts** — upload to Cloudinary, URL stored in MongoDB, viewable from any transaction
- **Alerts** — budget warnings, upcoming recurring payments, spending vs last month, goals within reach
- **UX** — light/dark mode (persisted), skeleton loaders, empty states, toasts, confirmation dialogs, mobile bottom-nav + floating "+ Add"

## Tech stack

| Frontend | Backend |
| --- | --- |
| React 18 + Vite, React Router 6 | Node.js + Express 4 |
| Tailwind CSS 3, Lucide icons | MongoDB Atlas + Mongoose 8 |
| Recharts, React Hook Form, Axios | JWT, bcryptjs, zod validation |
| react-hot-toast | PDFKit, Cloudinary, multer, helmet, CORS, rate limiting |

All dashboard / calendar / report numbers come from **MongoDB aggregation pipelines** (`backend/src/services/analyticsService.js`) — nothing is summed in React.

## Project structure

```
backend/src
  config/       db + cloudinary
  controllers/  thin request handlers
  middleware/   auth, validation, sanitising, uploads, error handling
  models/       User, Transaction, Category, Budget, RecurringTransaction, Person, SavingsGoal
  routes/       all routes (index.js)
  services/     analytics (aggregations), recurring, notifications, reports, categories
  utils/        dates, zod schemas, ownership helpers
frontend/src
  components/   reusable UI (calendar grid, modal, forms, charts)
  pages/        Dashboard, Calendar, Transactions, Budgets, Reports, People, Categories, Goals, Recurring, Settings
  layouts/      AppLayout (sidebar / topbar / bottom nav), AuthLayout
  context/      Auth, Theme, TransactionForm
  hooks/ services/ utils/
```

## Installation

Requirements: **Node.js 18+** and a free MongoDB Atlas cluster.

```bash
npm install        # installs root, backend and frontend dependencies
# edit backend/.env (see below)
npm run dev        # starts API on :5000 and web app on :5173
```

Or run each side separately:

```bash
cd backend  && npm install && npm run dev     # http://localhost:5000
cd frontend && npm install && npm run dev     # http://localhost:5173
```

Open http://localhost:5173, create an account, and a default set of categories is created for you.

## Environment variables

`backend/.env` (copy from `.env.example`; never commit it):

| Variable | Description |
| --- | --- |
| `PORT` | API port (default `5000`) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | Token lifetime, default `7d` |
| `CLIENT_URL` | Allowed browser origin(s), comma-separated. `http://localhost:5173` in dev |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Optional — only needed for receipt uploads |

`frontend/.env` — `VITE_API_URL` is empty in development (Vite proxies `/api` to `localhost:5000`). In production set it to your API URL, e.g. `https://your-api.onrender.com/api`.

## MongoDB Atlas setup

1. Create a free account at https://www.mongodb.com/cloud/atlas and a **free (M0) cluster**.
2. **Database Access → Add New Database User** (username + password, read/write access).
3. **Network Access → Add IP Address**. Use *Allow access from anywhere* (`0.0.0.0/0`) for development, or your host's IPs in production.
4. **Connect → Drivers** and copy the connection string.
5. Paste it into `MONGODB_URI`, replacing `<password>` and adding a database name:
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/expense-tracker?retryWrites=true&w=majority`

Collections and indexes (`userId`, `date`, `type`, `categoryId`) are created automatically on first run.

## Cloudinary setup (receipts)

Create a free account at https://cloudinary.com, copy the cloud name / API key / API secret from the dashboard into `backend/.env`. Without them everything else works; attaching a receipt shows a friendly "not configured" message.

## API documentation

All responses: `{ "success": true, "data": ... }` (lists with pagination also include `meta`) or `{ "success": false, "message": "..." }`. Everything except register/login needs `Authorization: Bearer <token>`. Every query is scoped to the authenticated user.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` · `PUT /api/auth/me` (name, currency) |
| Transactions | `GET /api/transactions` · `POST /api/transactions` · `GET/PUT/DELETE /api/transactions/:id` · `POST /api/transactions/receipt` (multipart field `receipt`) |
| Dashboard | `GET /api/dashboard/summary` · `/monthly` (comparison) · `/daily` · `/categories` · `/payment-methods` — all take `?month=10&year=2026` |
| Calendar | `GET /api/calendar?month=10&year=2026` · `GET /api/calendar/:date` (`YYYY-MM-DD`) |
| Budgets | `GET /api/budgets?month&year` · `POST /api/budgets` (upsert per month) · `PUT/DELETE /api/budgets/:id` |
| Categories | `GET/POST /api/categories` · `PUT/DELETE /api/categories/:id` |
| People | `GET/POST /api/people` · `GET/PUT/DELETE /api/people/:id` |
| Goals | `GET/POST /api/goals` · `PUT/DELETE /api/goals/:id` |
| Recurring | `GET/POST /api/recurring` · `PUT/DELETE /api/recurring/:id` |
| Reports | `GET /api/reports?period=monthly&date=2026-10-08` (or `period=custom&from=&to=`) · `GET /api/reports/export?format=csv\|pdf&...same params` |
| Alerts | `GET /api/notifications` |

**Transaction list filters:** `page, limit, search, type, categoryId, personId, paymentMethod, month+year, date, from, to, minAmount, maxAmount, sort (newest|oldest|highest|lowest)`.

**Transaction body**

```json
{ "type": "expense", "amount": 500, "date": "2026-10-08", "time": "13:15",
  "categoryId": "…", "merchant": "Swiggy", "paymentMethod": "UPI",
  "description": "Dinner", "tags": ["food"], "receiptUrl": "https://…" }
```
`sent` uses `to` (or `personId`), `received` uses `from` (or `personId`); people are created automatically by name.

## Design notes

- **Dates** are stored as UTC midnight of the chosen calendar day, so a transaction on "Oct 8" appears on Oct 8 in every time zone.
- **Lending balances:** remaining = sent − received per person. Positive → they owe you; negative → you owe them.
- **Recurring transactions** are posted automatically (on login, when the page loads, and by an hourly server job); missed periods are back-filled.
- **PDF exports** show amounts with the ISO currency code (e.g. `INR 1,200.00`) because built-in PDF fonts lack the ₹ glyph. CSV and the UI use the proper symbol.
- Passwords use `bcryptjs` (pure JS, same algorithm as `bcrypt`, no native build step).
- The calendar is a custom component rather than FullCalendar so each cell can show compact income/expense indicators and be fully keyboard accessible.

## Security

bcrypt password hashing (cost 12) · JWT auth middleware · per-user query scoping on every route (including ownership checks on referenced categories/people) · zod input validation with field stripping · NoSQL-operator sanitising · helmet · CORS allow-list · login/register rate limiting · CSV formula-injection guard · passwords never returned · secrets only via environment variables.

## Deployment

**API (Render / Railway / Fly.io)**
1. Create a web service from the `backend` folder. Build: `npm install`, start: `npm start`.
2. Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (your frontend URL), plus Cloudinary vars.
3. In Atlas Network Access, allow your host's outbound IPs (or `0.0.0.0/0`).

**Frontend (Vercel / Netlify / Cloudflare Pages)**
1. Root directory `frontend`, build `npm run build`, output `dist`.
2. Set `VITE_API_URL=https://<your-api-host>/api`.
3. Add an SPA fallback so deep links work — Netlify: `/* /index.html 200` in `public/_redirects`; Vercel: a rewrite of `/(.*)` to `/index.html`.

After deploying, update `CLIENT_URL` on the API to the final frontend origin.
