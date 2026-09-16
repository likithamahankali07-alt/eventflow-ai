# EventFlow AI 🚀

> **Production-Oriented Event Operations & Real-Time AI Intelligence Platform** for college events, student clubs, workshops, hackathons, and GDG chapters.

EventFlow AI powers seamless event operations with real-time database tracking, automated attendee registration, QR/token check-in scanning, 5-star rating feedback analytics, digital certificate issuance, and an embedded **Google Gemini AI Operations Agent** for live event intelligence.

---

## 🎨 Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Supabase JS Client
- **Backend**: Python 3.11, FastAPI, Pydantic v2, Supabase Admin Client, Google Gemini API (`google-genai` SDK)
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & Supabase Auth
- **AI Agent**: Gemini 2.5 Flash API with database tool calling (`get_event_summary_tool`, `get_participant_demographics_tool`, `get_feedback_analysis_tool`)

```
React Frontend (Vite + Tailwind) 
  ↳ FastAPI Backend (Python)
    ↳ Supabase PostgreSQL (RLS + Auth)
    ↳ Google Gemini 2.5 API (Function Calling & Tools)
```

---

## ✨ Features

- **Empty Database Ready**: Zero mock or fake data. Works dynamically against empty tables with clean empty state indicators.
- **Organizer Command Center**: Dashboard overview for seating capacity, attendance rate, feedback average, and certificate counters.
- **Public Attendee Registration (`/register/:eventId`)**: Real-time capacity validation, duplicate signup detection, and unique token ticket generation (`EVT-XXXX`).
- **Rapid Check-in Scanner**: Organizers check in attendees via registration tokens in real-time.
- **Feedback & Rating Analytics (`/feedback/:eventId`)**: Category ratings (Overall, Content, Speaker, Organization, Hands-on) & text comments visualized via Recharts.
- **Automated Digital Certificates (`/verify/:certificateId`)**: Issue verifiable digital participation certificates for checked-in attendees.
- **Gemini AI Operations Copilot**: Embedded AI assistant capable of analyzing demographics, feedback sentiment, capacity pacing, and generating announcement copy directly from database queries.

---

## ⚙️ Local Development Setup

### 1. Database Setup (Supabase PostgreSQL)
Run the SQL migration scripts in order on your Supabase project:
1. `supabase/migrations/01_schema.sql`
2. `supabase/migrations/02_rls.sql`

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

---

## 📜 License
MIT License
