# Release script for BEE API (PowerShell)
# Usage: .\scripts\release.ps1 -Version "v1.0.1" -Message "Bug fixes and improvements"

param(
    [string]$Version = "v1.0.0",
    [string]$Message = "Release $Version"
)

Write-Host "🚀 Creating release $Version" -ForegroundColor Green

try {
    # 1. Ensure we're on main branch
    $currentBranch = git branch --show-current
    if ($currentBranch -ne "main") {
        Write-Host "❌ Please switch to main branch first" -ForegroundColor Red
        exit 1
    }

    # 2. Ensure working directory is clean
    $status = git status --porcelain
    if ($status) {
        Write-Host "❌ Working directory is not clean. Please commit or stash changes first" -ForegroundColor Red
        exit 1
    }

    # 3. Pull latest changes
    Write-Host "📥 Pulling latest changes..." -ForegroundColor Yellow
    git pull origin main

    # 4. Run tests (if available)
    Write-Host "🧪 Running tests..." -ForegroundColor Yellow
    try {
        npm run test 2>$null
        Write-Host "✅ Tests passed" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Tests not available or failed, continuing..." -ForegroundColor Yellow
    }

    # 5. Build the project
    Write-Host "🔨 Building project..." -ForegroundColor Yellow
    npm run build

    # 6. Update version in package.json
    Write-Host "📝 Updating package.json version..." -ForegroundColor Yellow
    npm version $Version --no-git-tag-version

    # 7. Commit version update
    git add package.json package-lock.json
    try {
        git commit -m "chore: bump version to $Version"
    }
    catch {
        Write-Host "No version changes to commit" -ForegroundColor Yellow
    }

    # 8. Create and push tag
    Write-Host "🏷️ Creating tag $Version..." -ForegroundColor Yellow
    git tag -a $Version -m $Message

    Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main
    git push origin $Version

    Write-Host ""
    Write-Host "✅ Release $Version created successfully!" -ForegroundColor Green
    
    # Get repository URL
    $repoUrl = git config --get remote.origin.url
    $repoPath = $repoUrl -replace '.*github\.com[:/]([^.]*)(\.git)?', '$1'
    
    Write-Host "🌐 View it at: https://github.com/$repoPath/releases" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Go to GitHub repository" -ForegroundColor White
    Write-Host "  2. Navigate to Releases" -ForegroundColor White
    Write-Host "  3. Click on tag $Version" -ForegroundColor White
    Write-Host "  4. Click 'Create release from tag'" -ForegroundColor White
    Write-Host "  5. Add release notes and publish" -ForegroundColor White

} catch {
    Write-Host "❌ Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
