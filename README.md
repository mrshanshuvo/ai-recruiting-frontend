# AI Recruiting Co-Worker Frontend

React 18 single-page application built with Vite, TypeScript, and Tailwind CSS. Provides a chat-first conversational UI powered by Server-Sent Events (SSE), rich interactive confirmation cards, candidate management tables, and pipeline analytics dashboards.

## Architecture

- **UI Framework**: React 18, Vite 5, Tailwind CSS
- **State & Data Fetching**: Native React state & TanStack React Query patterns
- **Icons**: Lucide React
- **Real-Time Streaming**: Native HTTP Server-Sent Events (`EventSource`) listening on `/api/chat/stream/:conversationId`
- **Routing**: React Router v6 (`/`, `/jobs`, `/jobs/:id`, `/jobs/:id/dashboard`, `/mock-booking/:token`)
- **Reverse Proxy**: Nginx Alpine with `proxy_buffering off;`, HTTP/1.1, and 300s timeout for SSE streams

## Quick Start

### Option A: Local Development Server (Vite HMR)
```bash
# Install dependencies
npm install

# Start local development server on http://localhost:5173
npm run dev

# Run TypeScript type check and production build
npm run build
```

### Option B: Standalone Docker Container (Nginx)
The standalone frontend container runs Nginx to serve the SPA and proxies API requests (`/api/`, `/health`, `/simulate-reply`) to the backend. Because the Nginx container runs isolated, it uses Docker's `extra_hosts: ["api:host-gateway"]` to route API traffic to the host machine where the backend runs.

**Prerequisite**: The backend API must be running first on the host at `http://localhost:4000` (via `npm run dev` in `apps/backend` or the backend stack).

```bash
# Build and launch standalone frontend container on port 5173
docker compose up --build -d
```
The application will be served at `http://localhost:5173`. Nginx automatically proxies `/api/` and SSE streams to `http://api:4000/` on the host gateway.

## Environment Variables

Copy `.env.example` to `.env`:
```ini
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:4000
```

---

## Honest Architecture Evaluation

### What is Done
- **Real-Time Conversational Streaming**: Live assistant tokens stream via SSE with connection auto-recovery.
- **8 Interactive Human-in-the-Loop Cards**: `job_confirmation`, `sourcing_confirmation`, `candidate_table`, `campaign_preview`, `reply_draft`, `booking_link`, `status_update`, and `stats_summary`.
- **Inbound Reply Simulator**: Dedicated modal to trigger realistic candidate replies (`Interested`, `Question`, `Wants a meeting`, `Unsubscribe`, and arbitrary text) via `POST /simulate-reply`.
- **Self-Service Candidate Interview Booking**: Standalone booking page (`/mock-booking/:token`) offering 5 business days with UTC slots, immediate validation, and slot updates.
- **Full Candidate Pipeline & Drawer**: Detailed candidate list with score badges, missing info breakdown, status transition dropdowns, and "Needs review" badges with "Retry classification" action.
- **Live Recruitment Metrics Dashboard**: 12-stage pipeline funnel, channel breakdown, and token cost metrics.

### What is Mocked
- **Browser-Side Email Client**: Outreach messages and replies are previewed via Ethereal URLs rather than an integrated IMAP/Gmail client in the browser.
- **Calendar UI**: Direct Google/Outlook Calendar grid UI is replaced with a mobile-responsive slot selector (`MockBookingPage`).

### What is Skipped
- **Custom Theming / Dark Mode**: Built with clean, accessible Tailwind light theme with high-contrast slate, emerald, amber, and indigo accents.
- **Multi-Recruiter Collaboration Presence**: Avatar indicators for concurrent recruiters editing the same job simultaneously.

### Trade-offs
- **Single-Page Polling vs WebSocket**: Used native Server-Sent Events (SSE) for unidirectional assistant streaming paired with REST endpoints for user mutations. This eliminates WebSocket connection state overhead and works seamlessly through standard HTTP/1.1 reverse proxies.
- **Optimistic UI vs Ground-Truth Confirmation**: Action cards transition to loading and wait for server response rather than optimistically mutating client state to avoid desynchronization with BullMQ workers.

### Known Issues
- Rapid double-clicks on card confirmation buttons before server response can trigger duplicate requests if not debounced.
- If backend Redis/Mongo containers are stopped while SSE is streaming, EventSource will repeatedly retry reconnecting until services recover.
