
# Second Brain App

![Second Brain App Cover](repo-cover.svg)

Personal productivity suite with notes, todos, drawings, and health tracking. Built with serverless-first architecture.

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd second-brain-app
bun install

# Development
bun dev

# Build
bun build
```

## Architecture

**Monorepo Structure:**

- `apps/web` - React frontend (Vite + TypeScript)
- `apps/api-server` - Cloudflare Workers API (Hono + TypeScript)
- `apps/mcp-server` - AI integration server
- `packages/shared` - Shared types and utilities

**Tech Stack:**

- **Frontend**: React 18, Vite, ShadCN/UI, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono framework
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV
- **Build**: Turborepo + Bun workspaces

## Features

- **Notes**: Rich text editor with markdown export
- **Drawings**: tldraw canvas with cloud sync
- **Todos**: Eisenhower Matrix task management
- **Coupons**: LINE Man coupon manager
- **Health**: Meal logging and body composition tracking
- **AI**: MCP server integration for intelligent assistance

## Development

**Prerequisites:**

- Bun (latest)
- Cloudflare account (free tier)

**Environment Setup:**

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create second-brain-db

# Create KV namespace
wrangler kv:namespace create "CACHE"
```

**Local Development:**

- Frontend: `http://localhost:5173`
- API: `http://localhost:8787`
- Database: Local SQLite via Wrangler

## Deployment

**Staging:**

```bash
bun build
wrangler deploy --env staging
```

**Production:**

```bash
bun build
wrangler deploy --env production
```

## Security

- End-to-end encryption for sensitive data
- GitHub OAuth authentication
- Rate limiting and CORS protection
- Zero-trust architecture

## License

MIT
