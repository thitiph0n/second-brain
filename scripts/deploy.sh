#!/bin/bash

# Deploy script for Second Brain Frontend to Cloudflare Workers with Static Assets
# This script builds and deploys only the web frontend
# Backend API will be deployed separately

set -e

# Default to staging if no environment specified
ENVIRONMENT=${1:-staging}

case $ENVIRONMENT in
  "production" | "prod")
    echo "🚀 Starting PRODUCTION deployment to Cloudflare Workers..."
    ;;
  "staging" | "stage")
    echo "🧪 Starting STAGING deployment to Cloudflare Workers..."
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
bun install

# Build the frontend only
echo "🔨 Building the web frontend..."
bun --filter=@second-brain/web build

# Deploy to Cloudflare Workers
echo "🌐 Deploying frontend to Cloudflare Workers..."
if [[ "$ENVIRONMENT" == "production" || "$ENVIRONMENT" == "prod" ]]; then
    wrangler deploy --env production
    WORKER_NAME="second-brain-web-prod"
else
    wrangler deploy
    WORKER_NAME="second-brain-web-staging"
fi

echo "✅ Frontend deployment completed successfully!"
echo "🔗 Your frontend should be available at: https://$WORKER_NAME.your-domain.workers.dev"
echo "📝 Note: This is only the frontend. Backend API will be deployed separately."
