# LeadHunter AI

LeadHunter is a local-business prospecting MVP for website and AI-automation service providers.

## Workflow
**Search → Analyze → Score → Organize → Export**

## Stack
- React + Vite + Tailwind CSS
- Node.js + Express
- Axios
- Recharts
- PostgreSQL/Supabase-ready environment
- Safe HTTP website checks
- Ollama-ready configuration for future AI enrichment

## Current MVP
- Search form for location, category and lead count
- Provider-neutral demo business source
- Website HTTP/HTTPS audit with timeout and redirect limits
- Transparent 0–100 opportunity score with visible reasons
- Lead details drawer
- Save/remove leads
- CSV export
- Responsive dashboard

> The repository deliberately does **not** scrape Google Maps, directories, emails, or phone numbers without an appropriate data provider. Replace the sample source in `server/src/index.js` with a compliant places/business-data API when credentials and terms permit.

## Run locally
Requirements: Node.js 20+.

```bash
npm install
npm run dev
```

Client: http://localhost:5173
API: http://localhost:4000

Copy `.env.example` to `.env` if you want to configure the API URL, PostgreSQL/Supabase connection, or Ollama later.

## Database phase
The first MVP uses an in-memory saved-lead store so the product can run without a paid service or credentials. The next phase should add Supabase/PostgreSQL migrations, a `leads` table, and persistent CRUD.

## Scoring rules
- +35 no website
- +12 no HTTPS
- +18 website unhealthy/unreachable
- +8 mobile viewport signal missing
- +8 response over 3 seconds
- +8 no public email
- +5 no public phone
- +4 category present

Scores are capped at 100 and are intended as an opportunity signal, not a claim about a business.
