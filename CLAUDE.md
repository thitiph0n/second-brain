# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo project called "second-brain-app" that uses:

- **pnpm** as package manager
- **Turbo** for build orchestration and caching
- **Monorepo structure** with apps and packages

## Common Commands

### Development

```bash
pnpm dev          # Start development servers for all apps
pnpm build        # Build all apps and packages
pnpm test         # Run tests across all packages
pnpm lint         # Run linting across all packages
```

### Individual Package Development

Use turbo's filtering to work on specific packages:

```bash
turbo run dev --filter=api     # Run dev for API app only
turbo run build --filter=web   # Build web app only
turbo run test --filter=@scope/package-name  # Run tests for specific package
```

## Architecture

### Monorepo Structure

```plain
apps/
├── api/          # Backend API application
├── mcp-server/   # MCP (Model Context Protocol) server
└── web/          # Frontend web application

packages/
├── config/       # Shared configuration
├── database/     # Database utilities and schemas
└── shared/       # Shared utilities and types
```

### Build Pipeline

- Uses Turbo for efficient builds with dependency management
- Build outputs: `dist/**`, `.next/**`, `build/**`
- Tests depend on build completion
- Development mode runs with persistent caching disabled

## Development Notes

This appears to be a newly initialized monorepo with the basic structure in place but minimal code content. The project is set up for a "second brain" application, likely involving knowledge management or note-taking functionality given the MCP server component.

When working in this codebase:

1. Use `pnpm` for package management
2. Leverage Turbo's caching and parallel execution
3. Follow the monorepo structure when adding new functionality
4. Consider the MCP server integration for AI/ML features
