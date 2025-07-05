#!/bin/bash

# Release script for Second Brain
# This script creates a git tag and pushes it to trigger production deployment

set -e

# Check if version is provided
if [ -z "$1" ]; then
    echo "❌ Please provide a version number"
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.0"
    exit 1
fi

VERSION=$1

# Validate version format (basic semver check)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ Invalid version format. Please use semantic versioning (e.g., 1.0.0)"
    exit 1
fi

TAG_NAME="v$VERSION"

echo "🚀 Creating release $TAG_NAME..."

# Check if tag already exists
if git tag -l | grep -q "^$TAG_NAME$"; then
    echo "❌ Tag $TAG_NAME already exists"
    exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ You must be on the main branch to create a release"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Working directory is not clean. Please commit or stash your changes first."
    git status --short
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Create and push tag
echo "🏷️  Creating tag $TAG_NAME..."
git tag -a "$TAG_NAME" -m "Release $TAG_NAME"

echo "📤 Pushing tag to remote..."
git push origin "$TAG_NAME"

echo "✅ Release $TAG_NAME created successfully!"
echo "🌐 This will trigger a production deployment to Cloudflare Pages"
echo "📊 Check GitHub Actions for deployment progress: https://github.com/thitiph0n/second-brain/actions"
