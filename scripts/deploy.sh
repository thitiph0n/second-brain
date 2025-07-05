#!/bin/bash

# Deploy script for Second Brain Frontend to Cloudflare Pages
# This script builds and deploys only the web frontend
# Backend API will be deployed separately

set -e

# Default to staging if no environment specified
ENVIRONMENT=${1:-staging}
PROJECT_NAME=""

case $ENVIRONMENT in
  "production" | "prod")
    PROJECT_NAME="second-brain-web-prod"
    echo "🚀 Starting PRODUCTION deployment to Cloudflare Pages..."
    ;;
  "staging" | "stage")
    PROJECT_NAME="second-brain-web-staging"
    echo "🧪 Starting STAGING deployment to Cloudflare Pages..."
    ;;
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [staging|production]"
    exit 1
    ;;
esac

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please login first:"
    echo "wrangler login"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build the frontend only
echo "🔨 Building the web frontend..."
pnpm --filter=@second-brain/web build

# Deploy to Cloudflare Pages
echo "🌐 Deploying frontend to Cloudflare Pages..."
wrangler pages deploy apps/web/dist --project-name="$PROJECT_NAME" --compatibility-date=2025-01-01

echo "✅ Frontend deployment completed successfully!"
echo "🔗 Your frontend should be available at: https://$PROJECT_NAME.pages.dev"
echo "📝 Note: This is only the frontend. Backend API will be deployed separately."
