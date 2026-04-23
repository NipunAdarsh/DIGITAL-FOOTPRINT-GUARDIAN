# 🛡️ Digital Footprint Guardian

> **A production-ready cybersecurity intelligence dashboard** — scan email breaches, analyse password strength, detect phishing URLs, track data broker removals, and get AI-driven remediation guidance, all in one sleek terminal-themed UI.

---

## 📸 Screenshots

> _(Add your own screenshots here after running the app)_

---

## 🚀 Features

| Module | What it does |
|---|---|
| **Dashboard** | Live overview of risk score, recent scan history, and threat summary |
| **Active Threats** | Real-time feed of HIGH/CRITICAL risk scans pulled from Supabase |
| **Security Scan** | One-click full-spectrum scan entry point |
| **Breach Scanner** | Check any email against the Leak-Lookup database; get a risk score + AI remediation plan |
| **Password Analyser** | Shannon-entropy analysis, crack-time estimation, pattern detection, and AI feedback via Groq |
| **Phishing Detector** | Heuristic + Levenshtein typosquatting engine, HTTP/signal checks, AI verdict |
| **Scan History** | Persistent log of all past scans stored in Supabase |
| **Data Brokers** | Track & manage removal requests from known data-broker sites |
| **PDF Report** | Export full scan reports as downloadable PDFs via `jsPDF` + `html2canvas` |

---

## 🧠 Tech Stack

### Frontend
- **React 18** — component-based UI
- **Vite 5** — ultra-fast dev server & bundler
- **Tailwind CSS 3** — utility-first styling
- **Recharts** — responsive data visualisation
- **Google Material Symbols** + **Google Fonts** (Syne, DM Mono, JetBrains Mono)

### Backend & Data
- **Supabase** (PostgreSQL + Edge Functions) — persistent storage & serverless proxy
- **Groq API** (`llama-3.3-70b-versatile`) — AI-driven security analysis
- **Leak-Lookup API** — real-time email breach data
- **HaveIBeenPwned API** *(optional)* — secondary breach source via `/api/breach.js` Vercel function

### Deployment
- **Vercel** — SPA hosting with `vercel.json` rewrites for client-side routing

---

## 🗂️ Project Structure

```
digital-footprint-guardian/
├── api/
│   └── breach.js              # Vercel serverless fn — HIBP proxy (optional)
├── public/
│   └── shield.svg             # Favicon
├── src/
│   ├── App.jsx                # Root layout: sidebar, header, tab router, footer
│   ├── main.jsx               # React DOM entry point
│   ├── index.css              # Global base styles
│   │
│   ├── components/
│   │   ├── Header.jsx         # Top navigation bar
│   │   ├── tabs/              # ── Full page views ──
│   │   │   ├── Dashboard.jsx          # Overview & stats
│   │   │   ├── ActiveThreats.jsx      # HIGH/CRITICAL threat feed
│   │   │   ├── SecurityScan.jsx       # Scan entry & orchestration
│   │   │   ├── BreachScanner.jsx      # Email breach search + AI plan
│   │   │   ├── PasswordAnalyser.jsx   # Password strength + AI feedback
│   │   │   ├── PhishingDetector.jsx   # URL phishing check + AI verdict
│   │   │   ├── ScanHistory.jsx        # Past scan log
│   │   │   └── DataBrokers.jsx        # Broker removal tracker
│   │   ├── breach/            # Sub-components for breach module
│   │   │   ├── BreachList.jsx
│   │   │   ├── EmailInput.jsx
│   │   │   ├── RemediationPlan.jsx
│   │   │   └── RiskDashboard.jsx
│   │   ├── analytics/
│   │   │   └── StatsBar.jsx
│   │   └── shared/
│   │       ├── ErrorState.jsx
│   │       ├── LoadingState.jsx
│   │       └── ReportDownload.jsx
│   │
│   ├── utils/
│   │   ├── geminiApi.js       # Groq LLM calls (breach, password, URL analysis)
│   │   ├── leakLookupApi.js   # Leak-Lookup fetch + response normaliser
│   │   ├── passwordAnalyser.js  # Entropy, crack-time, pattern detection
│   │   ├── phishingDetector.js  # Heuristic URL scanner + typosquatting
│   │   ├── riskScorer.js      # Weighted breach risk scoring algorithm
│   │   ├── hashUtils.js       # SHA-256 hashing + email/URL masking
│   │   └── supabaseClient.js  # Supabase JS client initialisation
│   │
│   └── db/
│       └── queries.js         # All Supabase CRUD operations
│
├── .env.example               # ← Template: copy to .env.local and fill keys
├── .gitignore                 # Protects .env.local and sensitive files
├── index.html                 # HTML entry point (loads fonts + React root)
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── vercel.json                # SPA route rewrites for Vercel
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com/keys) API key (free tier)
- A [Leak-Lookup](https://leak-lookup.com/api) API key

### 2. Clone the Repository

```bash
git clone https://github.com/<your-username>/digital-footprint-guardian.git
cd digital-footprint-guardian
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_GROQ_API_KEY=<your-groq-api-key>
VITE_LEAK_LOOKUP_API_KEY=<your-leak-lookup-api-key>
```

> ⚠️ **Never commit `.env.local` to version control.** It is already in `.gitignore`.

### 5. Set Up the Supabase Database

Run the following SQL in your Supabase **SQL Editor** to create all required tables:

<details>
<summary>Click to expand SQL schema</summary>

```sql
-- Breach scan results
CREATE TABLE scans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  email_hash    text NOT NULL,
  email_masked  text,
  breach_count  int DEFAULT 0,
  risk_score    int DEFAULT 0,
  risk_level    text DEFAULT 'LOW',
  ai_summary    text
);

-- Individual breaches per scan
CREATE TABLE breach_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id       uuid REFERENCES scans(id) ON DELETE CASCADE,
  site_name     text,
  site_domain   text,
  breach_date   date,
  pwn_count     int DEFAULT 0,
  data_classes  text[],
  is_sensitive  boolean DEFAULT false,
  is_verified   boolean DEFAULT true
);

-- AI-generated remediation steps
CREATE TABLE remediation_steps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id       uuid REFERENCES scans(id) ON DELETE CASCADE,
  step_order    int,
  priority      text,
  action        text,
  reason        text,
  time_to_fix   text,
  is_completed  boolean DEFAULT false
);

-- Password strength checks
CREATE TABLE password_checks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at      timestamptz DEFAULT now(),
  strength_score  int,
  strength_label  text,
  entropy_bits    int,
  crack_time      text,
  patterns_found  text[],
  ai_feedback     jsonb
);

-- URL phishing checks
CREATE TABLE url_checks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at    timestamptz DEFAULT now(),
  url_hash      text,
  url_domain    text,
  verdict       text,
  risk_signals  jsonb,
  signal_count  int DEFAULT 0,
  ai_verdict    jsonb
);

-- Data broker removal tracking
CREATE TABLE data_broker_removals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  broker_name       text NOT NULL,
  broker_category   text,
  data_found        text[],
  removal_status    text DEFAULT 'NOT_REQUESTED',
  date_requested    timestamptz,
  date_confirmed    timestamptz
);

-- Global platform statistics
CREATE TABLE platform_stats (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_scans      int DEFAULT 0,
  breaches_found   int DEFAULT 0,
  users_protected  int DEFAULT 0,
  threats_blocked  int DEFAULT 0
);

-- Seed a single stats row
INSERT INTO platform_stats (total_scans, breaches_found, users_protected, threats_blocked)
VALUES (0, 0, 0, 0);
```
</details>

### 6. Set Up the Supabase Edge Function (Leak-Lookup Proxy)

The Breach Scanner routes requests through a Supabase Edge Function to keep your Leak-Lookup API key server-side.

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli)
2. Create the function:
   ```bash
   supabase functions new leak-lookup-proxy
   ```
3. Implement the function to forward POST requests to `https://leak-lookup.com/api/search` using your `LEAK_LOOKUP_API_KEY` secret.
4. Deploy:
   ```bash
   supabase functions deploy leak-lookup-proxy --no-verify-jwt
   ```

### 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Build for Production

```bash
npm run build
```

Output is in the `dist/` folder (already gitignored).

---

## ☁️ Deploy to Vercel

1. Push your code to GitHub (the `.gitignore` ensures no secrets are included)
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables under **Project → Settings → Environment Variables**
4. Deploy — the `vercel.json` handles SPA route rewrites automatically

---

## 🔐 Security Architecture

| Concern | How it's handled |
|---|---|
| **Email privacy** | Emails are SHA-256 hashed before storage; only masked versions (`jo****@gmail.com`) are persisted |
| **URL privacy** | URLs are SHA-256 hashed before storage; only the hostname is saved |
| **API key exposure** | All keys are VITE env vars — never hardcoded. Leak-Lookup key is proxied server-side via Supabase Edge Function |
| **Password privacy** | Passwords are **never sent** to any server or stored; all analysis runs locally in the browser |

---

## 🧮 Core Algorithms

### Risk Scorer (`riskScorer.js`)
A weighted, multi-factor scoring system:
- **Data class weights** — Passwords (35pts), Credit cards (45pts), SSNs (50pts), etc.
- **Recency multiplier** — Breaches ≤1 year old score 1.5×; breaches >10 years score 0.5×
- **Compounding factor** — Multiple breaches amplify risk (up to 1.8×)
- **Sensitivity flag** — Sensitive breaches (passwords, addresses, phones) add a 1.3× multiplier
- **Normalised 0-100** with four bands: LOW / MEDIUM / HIGH / CRITICAL

### Password Analyser (`passwordAnalyser.js`)
- **Shannon entropy** = `length × log₂(charset size)`
- **Crack time** estimated at 10 billion guesses/sec
- **Pattern detection**: common passwords, keyboard walks, leet-speak, repeating chars, sequential numbers, length check

### Phishing Detector (`phishingDetector.js`)
- **IP-based URL** detection
- **Excessive subdomain** check
- **HTTPS** enforcement check
- **Suspicious keyword** density (login, verify, banking, credential…)
- **Levenshtein typosquatting** against 16 major legitimate domains (Δ ≤ 2)
- Verdict: `LIKELY_SAFE` / `SUSPICIOUS` / `DANGEROUS`

---

## 🤖 AI Integration (Groq — Llama 3.3 70B)

All AI analysis is performed by **Groq's `llama-3.3-70b-versatile`** model via `geminiApi.js`:

- **Breach analysis** → `summary`, `topThreats[]`, `remediationSteps[]`
- **Password analysis** → `feedback`, `suggestion`
- **URL analysis** → `verdict`, `explanation`, `userAdvice`

The API is called with `response_format: { type: 'json_object' }` for deterministic, parseable output. All prompts are contextualised with real local analysis data before being sent, ensuring AI responses are specific — not generic.

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `@supabase/supabase-js` | Database + Edge Function client |
| `recharts` | Responsive charts and graphs |
| `jspdf` | PDF report generation |
| `html2canvas` | Screenshot → PDF conversion |
| `vite` + `@vitejs/plugin-react` | Build tooling |
| `tailwindcss` | Utility CSS framework |

---

## 🗺️ Roadmap

- [ ] Authentication (Supabase Auth — email/password)
- [ ] HaveIBeenPwned (HIBP) API integration as secondary breach source
- [ ] Browser extension for real-time phishing alerts
- [ ] Scheduled re-scan notifications
- [ ] Dark/Light theme toggle
- [ ] Mobile responsive sidebar

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is open-sourced under the **MIT License**. See `LICENSE` for details.

---

## 👤 Author

Built with 🛡️ by **Nipun**  
[GitHub](https://github.com/<your-username>) · [LinkedIn](https://linkedin.com/in/<your-handle>)

---

> _"Know your footprint. Guard your data."_
