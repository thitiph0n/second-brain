# Second Brain - Deployment Guide

This document outlines how to deploy the Second Brain application. The application is structured as a monorepo with separate frontend and backend components.

## Architecture Overview

- **Frontend** (`apps/web`): React SPA deployed to Cloudflare Pages
- **Backend** (`apps/api`): API server (planned - not yet implemented)
- **MCP Server** (`apps/mcp-server`): Model Context Protocol server (planned)
- **Packages**: Shared libraries (`packages/shared`, `packages/database`)

## Frontend Deployment (Cloudflare Pages)

### Deployment Environments

The application supports two deployment environments:

- **Staging**: Automatically deployed when merging to `main` branch
  - URL: `https://second-brain-web-staging.pages.dev`
  - Project: `second-brain-web-staging`
  
- **Production**: Automatically deployed when creating a git tag (e.g., `v1.0.0`)
  - URL: `https://second-brain-web-prod.pages.dev`
  - Project: `second-brain-web-prod`

### Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account with Pages enabled
2. **GitHub Repository**: Your code should be pushed to GitHub (already set up)
3. **Wrangler CLI**: Install the Cloudflare Wrangler CLI for local deployments

### Installation

#### Install Wrangler CLI

```bash
npm install -g wrangler
```

#### Login to Cloudflare

```bash
wrangler login
```

## Deployment Methods

### Method 1: Automatic Deployment via GitHub Actions (Recommended)

This is the easiest method and provides continuous deployment.

#### Setup GitHub Secrets

1. Go to your GitHub repository settings
2. Navigate to **Secrets and variables** → **Actions**
3. Add the following secrets:

   - `CLOUDFLARE_API_TOKEN`: Get this from Cloudflare Dashboard → My Profile → API Tokens → Create Token (Custom token with Zone:Read, Page:Edit permissions)
   - `CLOUDFLARE_ACCOUNT_ID`: Get this from Cloudflare Dashboard → Right sidebar

#### Create Cloudflare Pages Projects

You need to create two separate Cloudflare Pages projects:

1. **Staging Project**:
   - Go to Cloudflare Dashboard → Pages
   - Click **Create a project**
   - Connect to your GitHub repository (`thitiph0n/second-brain`)
   - Project name: `second-brain-web-staging`
   - Configure build settings:
     - **Framework preset**: None
     - **Build command**: `pnpm --filter=@second-brain/web build`
     - **Build output directory**: `apps/web/dist`
     - **Root directory**: `/` (leave empty)

2. **Production Project**:
   - Repeat the same steps but name it: `second-brain-web-prod`

#### Automatic Deployment Triggers

- **Staging**: Every push to `main` branch triggers staging deployment
- **Production**: Creating a git tag (e.g., `v1.0.0`) triggers production deployment
- **Preview**: Pull requests create preview deployments on the staging project

### Method 2: Creating Production Releases

To deploy to production, create a release using the release script:

```bash
# Create and deploy version 1.0.0 to production
pnpm release 1.0.0
```

This script will:

1. Validate the version format
2. Check that you're on the main branch
3. Ensure working directory is clean
4. Create a git tag (e.g., `v1.0.0`)
5. Push the tag, which triggers production deployment

### Method 3: Manual Deployment with Scripts

For manual deployments, use the provided deployment scripts:

```bash
# Deploy to staging
pnpm deploy:frontend:staging

# Deploy to production
pnpm deploy:frontend:production

# Deploy to preview environment
pnpm deploy:frontend:preview
```

### Method 4: Direct Wrangler Deployment

```bash
# Build the application first
pnpm build

# Deploy to staging
wrangler pages deploy apps/web/dist --project-name=second-brain-web-staging --compatibility-date=2025-01-01

# Deploy to production
wrangler pages deploy apps/web/dist --project-name=second-brain-web-prod --compatibility-date=2025-01-01
```

## Backend Deployment (Future)

The backend API deployment is planned but not yet implemented. When ready, it will likely be deployed to:

- **Cloudflare Workers** (for serverless functions)
- **Railway/Vercel** (for full Node.js backend)
- **Other hosting services** as needed

A placeholder script is available at `scripts/deploy-backend.sh` for future implementation.

## Configuration Files

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

- Automatically builds and deploys on push to main
- Uses pnpm for dependency management
- Caches dependencies for faster builds

### Wrangler Configuration (`wrangler.toml`)

- Defines build settings
- Sets up redirects for SPA routing
- Configures headers for security and performance

### Cloudflare Pages Files

- `apps/web/public/_redirects`: SPA routing configuration
- `apps/web/public/_headers`: Security and caching headers

## Custom Domain (Optional)

To use a custom domain:

1. Go to Cloudflare Pages → Your Project → Custom domains
2. Add your domain
3. Update your domain's DNS to point to Cloudflare

## Environment Variables

For production deployments, you may need to set environment variables:

1. In Cloudflare Pages Dashboard → Your Project → Settings → Environment variables
2. Add any required environment variables for production

## Troubleshooting

### Build Failures

- Check that all dependencies are properly installed
- Ensure TypeScript compilation succeeds locally
- Verify that the build output directory contains the expected files

### Routing Issues

- Ensure `_redirects` file is in the `apps/web/public` directory
- Check that your routes are properly defined in TanStack Router

### Performance

- Monitor build times and optimize if necessary
- Use the caching headers defined in `_headers` for better performance

## Local Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build locally
cd apps/web && pnpm serve
```

## Monitoring

Monitor your deployment at:

- Cloudflare Pages Dashboard: <https://dash.cloudflare.com/pages>
- Site URL: <https://second-brain-web.pages.dev> (or your custom domain)
- GitHub Actions: Check the Actions tab in your repository
