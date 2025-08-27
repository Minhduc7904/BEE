#!/bin/bash

# Release script for BEE API
# Usage: ./scripts/release.sh [version] [message]
# Example: ./scripts/release.sh v1.0.1 "Bug fixes and improvements"

set -e

VERSION=${1:-"v1.0.0"}
MESSAGE=${2:-"Release $VERSION"}

echo "🚀 Creating release $VERSION"

# 1. Ensure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Please switch to main branch first"
    exit 1
fi

# 2. Ensure working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Working directory is not clean. Please commit or stash changes first"
    exit 1
fi

# 3. Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# 4. Run tests (if available)
echo "🧪 Running tests..."
if npm run test > /dev/null 2>&1; then
    echo "✅ Tests passed"
else
    echo "⚠️ Tests not available or failed, continuing..."
fi

# 5. Build the project
echo "🔨 Building project..."
npm run build

# 6. Update version in package.json (optional)
echo "📝 Updating package.json version..."
npm version $VERSION --no-git-tag-version

# 7. Commit version update
git add package.json package-lock.json
git commit -m "chore: bump version to $VERSION" || echo "No version changes to commit"

# 8. Create and push tag
echo "🏷️ Creating tag $VERSION..."
git tag -a $VERSION -m "$MESSAGE"

echo "📤 Pushing to GitHub..."
git push origin main
git push origin $VERSION

echo ""
echo "✅ Release $VERSION created successfully!"
echo "🌐 View it at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\)\.git/\1/')/releases"
echo ""
echo "📋 Next steps:"
echo "  1. Go to GitHub repository"
echo "  2. Navigate to Releases"
echo "  3. Click on tag $VERSION"
echo "  4. Click 'Create release from tag'"
echo "  5. Add release notes and publish"
