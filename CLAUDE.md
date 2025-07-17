# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo project called "second-brain-app" - a personal productivity suite built with modern web technologies. It uses:

- **pnpm** as package manager
- **Turbo** for build orchestration and caching
- **Cloudflare Workers** for serverless API
- **React + Vite** for the frontend
- **Monorepo structure** with apps and packages

## Common Commands

### Development

```bash
pnpm dev          # Start development servers for all apps
pnpm build        # Build all apps and packages
pnpm test         # Run tests across all packages
pnpm lint         # Run linting across all packages
pnpm deploy       # Build and deploy API to Cloudflare
```

### Individual App Development

```bash
# API development
pnpm dev:api      # Start API dev server with Wrangler (localhost:8787)
pnpm --filter @second-brain/api dev
pnpm --filter @second-brain/api deploy

# Web development
pnpm dev:web      # Start web dev server (localhost:3000)
pnpm --filter @second-brain/web dev
pnpm --filter @second-brain/web build
```

### Turbo Filtering

```bash
turbo run dev --filter=api     # Run dev for API app only
turbo run build --filter=web   # Build web app only
turbo run test --filter=@second-brain/web  # Run tests for specific package
```

## Architecture

### Monorepo Structure

```plain
apps/
├── api/          # Cloudflare Workers API (Hono + TypeScript)
├── mcp-server/   # AI integration server (currently empty)
└── web/          # React frontend (Vite + TypeScript)

packages/
├── database/     # Database utilities (currently empty)
└── shared/       # Shared utilities and types (currently empty)

docs/
└── prds/         # Product Requirements Documents
```

### Technology Stack

#### Frontend (React Web App)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6.1.0
- **Routing**: TanStack Router v1.121.2 (file-based routing)
- **Styling**: Tailwind CSS 4.0.6 with shadcn/ui components (New York style)
- **State Management**: Zustand 5.0.6 for authentication state
- **Data Fetching**: TanStack Query 5.81.5
- **Testing**: Vitest 3.0.5 with React Testing Library and jsdom
- **Icons**: Lucide React 0.476.0

#### Backend (Cloudflare Workers API)
- **Runtime**: Cloudflare Workers
- **Framework**: Hono 4.0.0
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV storage
- **Validation**: Zod 3.22.0
- **Deployment**: Wrangler 4.23.0

### Key Architecture Patterns

#### API Structure
- Base URL: `/api/v1/` for versioned endpoints
- Health check at `/api/health`
- Static asset serving for SPA fallback
- CORS configured for frontend integration

#### Frontend Structure
- File-based routing with TanStack Router
- Component library using shadcn/ui (New York style)
- Theme provider for dark/light mode
- Responsive design with Tailwind utilities

#### Build Pipeline
- Uses Turbo for efficient builds with dependency management
- Build outputs: `dist/**`, `.next/**`, `build/**`
- Tests depend on build completion
- Development mode with persistent caching disabled

## Development Environment

### Local Development
- **Frontend**: `http://localhost:3000` (Vite dev server)
- **API**: `http://localhost:8787` (Wrangler dev server)
- **Production**: `https://2b.thitphon.me`

### Database & Storage
- **Database**: Cloudflare D1 (SQLite) with comprehensive schema for users, OAuth, and sessions
- **Cache**: Cloudflare KV for session storage and caching
- **Deployment**: Automated via scripts in `/scripts/`

### Authentication System
- **OAuth 2.1**: GitHub integration with secure token handling
- **State Management**: Zustand store with persistence located in `apps/web/src/auth/store.ts`
- **Route Protection**: AuthGuard components and RequireAuth wrappers in `apps/web/src/auth/components/`
- **UI Components**: LoginCard, UserMenu, AuthStatus with modern design

## Development Notes

This is a well-architected foundation for a personal productivity application with planned features including:
- Authentication (OAuth 2.1 with GitHub) - **IMPLEMENTED**
- Notes with rich text editor
- Drawings with tldraw canvas
- Todos with Eisenhower Matrix
- AI integration via MCP server

### Component Installation
For adding new shadcn/ui components, use:
```bash
pnpx shadcn@latest add button
```

### Testing Commands
```bash
# Run all tests
pnpm test

# Run tests for specific app
pnpm --filter @second-brain/web test

# Run tests in watch mode
pnpm --filter @second-brain/web test:watch
```

When working in this codebase:
1. Use `pnpm` for package management
2. Leverage Turbo's caching and parallel execution
3. Follow the monorepo structure when adding new functionality
4. Consider Cloudflare Workers limitations (edge runtime)
5. Use shadcn/ui components for consistent UI - add via `pnpx shadcn@latest add [component]`
6. Check `/docs/prds/` for feature specifications before implementation
7. Authentication patterns are in `apps/web/src/auth/` - follow established patterns
8. **ALWAYS ensure files end with a newline character (EOL)** - this is required for proper git handling and POSIX compliance