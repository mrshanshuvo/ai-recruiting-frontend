# AI Recruiting Co-Worker Frontend

React 18 single-page application built with Vite, TypeScript, and Tailwind CSS. Provides a chat-first conversational UI powered by Server-Sent Events (SSE), rich interactive confirmation cards, and candidate pipeline dashboards.

## Architecture

- **UI Framework**: React 18, Vite 5, Tailwind CSS
- **State & Data Fetching**: TanStack React Query v5
- **Icons**: Lucide React
- **Real-Time Streaming**: Native HTTP Server-Sent Events (`EventSource`) listening on `/api/chat/stream/:conversationId`
- **Routing**: React Router v6 (`/`, `/jobs`, `/jobs/:id`, `/jobs/:id/dashboard`, `/mock-booking/:token`)

## LLM Configuration

The backend services powering this application are configured with:
- `LLM_MODEL=gemini-3.1-flash-lite` (Primary high-throughput model)
- `LLM_FALLBACK_MODEL=gemini-3.7-flash` (Automatic retry fallback model)

## Development Setup

```bash
# Install dependencies
npm install

# Start local development server on http://localhost:5173
npm run dev

# Run TypeScript type check and build
npm run build
```

## Environment Variables

Copy `.env.example` to `.env`:
```ini
VITE_API_BASE_URL=http://localhost:4000
```
