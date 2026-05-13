<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Parish Outreach Control Tower (UI + Hosted API)

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1zFVLhc7Bl-pC0klQYANwZin63Pub6wp4

## Prerequisites

- Node.js (LTS) installed (this gives you `node` + `npm`)
- A Gemini key in `.env.local`

Your `.env.local` should contain:

```
GEMINI_API_KEY=YOUR_KEY_HERE
```

## Run locally (recommended)

1. Install dependencies

```
npm install
```

2. Start the API (Terminal 1)

```
npm run api:dev
```

3. Start the UI (Terminal 2)

```
npm run dev
```

- UI: `http://localhost:3000`
- API health check: `http://localhost:8787/api/health`

The UI calls the API at `/api/*` and Vite proxies to the API server.

## Test the API (PowerShell)

Health:

```
Invoke-RestMethod http://localhost:8787/api/health
```

Discover:

```
Invoke-RestMethod -Method Post http://localhost:8787/api/discover -ContentType "application/json" -Body '{"location":"Dallas, TX"}'
```

Research:

```
Invoke-RestMethod -Method Post http://localhost:8787/api/research -ContentType "application/json" -Body '{"orgName":"St Mary Parish","websiteUrl":"https://example.com"}'
```

Draft:

```
Invoke-RestMethod -Method Post http://localhost:8787/api/draft -ContentType "application/json" -Body '{"orgName":"St Mary Parish","need":"Tech Audit","evidence":"Website is slow and not mobile friendly"}'
```

## Deploy / host the API

For production, build and run the API:

```
npm run api:build
npm run api:start
```

Set environment variables on the server:

- `GEMINI_API_KEY` (required)
- `PORT` (optional; defaults to 8787)
