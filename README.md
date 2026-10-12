# EventFlow AI 🚀

> **Universal Event Operations & AI Registration Growth Platform** for conferences, corporate summits, tech communities, meetups, cultural fests, sports leagues, and college clubs.

EventFlow AI powers end-to-end event operations with real-time PostgreSQL tracking, universal attendee registration, referral tracking attribution, an AI Attendee Assistant, QR/token check-in scanning, 5-star feedback analytics, verified digital certificates, and a grounded **Google Gemini AI Agent** with database tool calling.

---

## 🎨 Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Supabase JS Client (Realtime)
- **Backend**: Python 3.11, FastAPI, Pydantic v2, Supabase Admin Client, Google Gemini API (`google-genai` SDK)
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & Supabase Auth
- **AI Agent**: Gemini 2.5 Flash API with 11 database function calling tools (Registration velocity, campaigns, attendee Q&A, absentees, reminders, and feedback sentiment)

```
React Frontend (Vite + Tailwind) 
  ↳ FastAPI Backend (Python)
    ↳ Supabase PostgreSQL (RLS + Auth)
    ↳ Google Gemini 2.5 API (Function Calling & Live DB Tools)
```

---

## ✨ Universal Organizer & Registration Features

- **Universal Organizer Support**: Tailored workflows for Tech Communities, Corporate Summits, Academic Chapters, Cultural Fests, Gaming Leagues, and Independent Creators.
- **Adaptive Registration Forms**: Dynamically switches between **Professional / General** (Company, Role) and **Student / Academic** (College, Branch, Year, Student ID).
- **Custom Registration Questions**: Organizers can add bespoke questions (Text, Dropdown select, Confirmation checkboxes).
- **AI Attendee Assistant**: Prospective attendees can ask questions on public registration pages (*"What is the schedule?", "Is there parking?", "What should I bring?"*) answered strictly from real event details without hallucinations.
- **1-Click Ticket Recovery**: Attendees can recover their registration token and check-in pass by entering their email.
- **Referral Tracking & Attribution (`?ref=...`)**: Generates tracked links for WhatsApp, LinkedIn, Email Newsletters, and Ambassador codes with real-time conversion counters.
- **AI Outreach Studio**: Generates high-converting promotional copy tailored to WhatsApp communities, LinkedIn, Twitter threads, and Email newsletters.
- **Registration Velocity & Growth Agent**: Analyzes hourly/daily registration velocity, assesses capacity timelines, and suggests proven growth tactics.
- **Proactive Event Operations Monitor**: Real-time monitoring of attendance rate, absentee alerts, capacity proximity, and feedback sentiment.
- **Rapid QR & Token Check-in**: Scan device cameras or enter tokens (`EVT-XXXX`) with real-time duplicate check-in prevention.
- **Automated Digital Certificates**: Issue verifiable digital participation credentials for attendees who checked in.

---

## ⚙️ Local Development Setup

### 1. Database Setup (Supabase PostgreSQL)
Run the SQL migration scripts in order on your Supabase SQL Editor:
1. `supabase/migrations/01_schema.sql`
2. `supabase/migrations/02_rls.sql`
3. `supabase/migrations/03_universal_expansion.sql`

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and GEMINI_API_KEY
python main.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, and VITE_API_URL
npm run dev
```

### 4. 1-Click Server Launcher (Windows PowerShell)
```powershell
.\start_servers.ps1
```
Launches both the FastAPI backend on port 8000 and the React Vite frontend on port 5173.

---

## 📜 License
MIT License
