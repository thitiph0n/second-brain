# Cloudflare Pages Build Configuration Guide

For optimal monorepo setup, configure build watch paths in your Cloudflare Pages dashboard:

## Web App Project (apps/web)

- Include paths: `apps/web/**`, `packages/shared/**`, `packages/database/**`
- Exclude paths: `apps/api/**`, `apps/mcp-server/**`, `docs/**`, `scripts/**`

## API Project (apps/api)

- Include paths: `apps/api/**`, `packages/shared/**`, `packages/database/**`
- Exclude paths: `apps/web/**`, `apps/mcp-server/**`, `docs/**`, `scripts/**`

## MCP Server Project (apps/mcp-server)

- Include paths: `apps/mcp-server/**`, `packages/shared/**`, `packages/database/**`
- Exclude paths: `apps/web/**`, `apps/api/**`, `docs/**`, `scripts/**`

This ensures that changes to unrelated apps don't trigger unnecessary builds.
