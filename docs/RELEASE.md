# Release Guide - BEE API

Hướng dẫn chi tiết về quy trình tạo và quản lý release cho dự án BEE API.

## 📋 Table of Contents

- [Quy trình Release](#quy-trình-release)
- [Semantic Versioning](#semantic-versioning)
- [Cách tạo Release](#cách-tạo-release)
- [Release Scripts](#release-scripts)
- [Release Notes Template](#release-notes-template)
- [Checklist trước khi Release](#checklist-trước-khi-release)
- [Troubleshooting](#troubleshooting)

## 🚀 Quy trình Release

### 1. Pre-release Preparation
```bash
# Đảm bảo code đã được test kỹ
npm run test
npm run test:e2e
npm run lint

# Build project để kiểm tra không có lỗi compile
npm run build

# Kiểm tra working directory sạch sẽ
git status
```

### 2. Version Strategy
Dự án sử dụng [Semantic Versioning (SemVer)](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes, API incompatible
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes, backward compatible

### 3. Release Flow
```
Development → Testing → Release Branch → Tag → GitHub Release
```

## 📊 Semantic Versioning

| Version Type | When to Use | Example | Command |
|-------------|-------------|---------|---------|
| **Patch** | Bug fixes, security patches | 1.0.0 → 1.0.1 | `npm run release:patch` |
| **Minor** | New features, backwards compatible | 1.0.1 → 1.1.0 | `npm run release:minor` |
| **Major** | Breaking changes, API changes | 1.1.0 → 2.0.0 | `npm run release:major` |

### Version Examples:
- `v1.0.0` - Initial stable release
- `v1.0.1` - Bug fix release
- `v1.1.0` - Feature release
- `v2.0.0` - Breaking changes release
- `v1.0.0-beta.1` - Pre-release version

## 🔧 Cách tạo Release

### Method 1: Automated Scripts (Khuyến nghị)

#### Quick Release
```powershell
# Release với version hiện tại
npm run release

# Release với version và message cụ thể
npm run release -- -Version "v1.2.3" -Message "Feature: Add user management"
```

#### Semantic Version Release
```powershell
# Tự động bump patch version (1.0.0 → 1.0.1)
npm run release:patch

# Tự động bump minor version (1.0.0 → 1.1.0)  
npm run release:minor

# Tự động bump major version (1.0.0 → 2.0.0)
npm run release:major
```

### Method 2: Manual Git Commands

```powershell
# 1. Tạo tag
git tag -a v1.0.1 -m "Release v1.0.1 - Bug fixes and improvements"

# 2. Push tag lên GitHub
git push origin v1.0.1

# 3. Tạo release trên GitHub UI
# Vào https://github.com/Minhduc7904/BEE/releases
# Click "Create a new release" và chọn tag vừa tạo
```

### Method 3: GitHub UI

1. Vào repository: `https://github.com/Minhduc7904/BEE`
2. Click tab **"Releases"**
3. Click **"Create a new release"**
4. Điền thông tin:
   - **Tag version**: `v1.0.1`
   - **Release title**: `v1.0.1 - Bug Fixes and Improvements`
   - **Description**: Copy từ CHANGELOG.md
5. Click **"Publish release"**

## 🛠 Release Scripts

### PowerShell Script (`scripts/release.ps1`)

```powershell
# Cơ bản
.\scripts\release.ps1

# Với parameters
.\scripts\release.ps1 -Version "v1.2.0" -Message "New authentication features"

# Thông qua npm
npm run release -- -Version "v1.2.0" -Message "New features"
```

### Bash Script (`scripts/release.sh`)

```bash
# Cơ bản
./scripts/release.sh

# Với parameters
./scripts/release.sh v1.2.0 "New authentication features"
```

### Script Features

- ✅ Kiểm tra branch hiện tại (phải là `main`)
- ✅ Kiểm tra working directory sạch sẽ
- ✅ Pull latest changes
- ✅ Run tests (nếu có)
- ✅ Build project
- ✅ Update package.json version
- ✅ Commit version bump
- ✅ Tạo và push git tag
- ✅ Hiển thị link GitHub release

## 📝 Release Notes Template

### Format chuẩn:
```markdown
## [v1.2.0] - 2025-08-27

### 🆕 Added
- New user management API endpoints
- Email verification system
- Rate limiting middleware

### 🔧 Changed  
- Improved JWT token validation
- Updated Swagger documentation
- Enhanced error messages

### 🐛 Fixed
- Fixed memory leak in authentication
- Resolved CORS issues
- Fixed database connection timeout

### 🔒 Security
- Updated dependencies to latest versions
- Enhanced password validation
- Fixed potential SQL injection vulnerability

### 💥 Breaking Changes
- Changed API response format for /auth/login
- Removed deprecated /api/v1/users endpoint
- Updated minimum Node.js version to 18.x

### 📋 Dependencies
- Updated @nestjs/core to v11.0.2
- Added helmet for security headers
- Removed unused lodash dependency
```

## ✅ Checklist trước khi Release

### Development Checklist
- [ ] Code đã được review
- [ ] Tests pass (unit + e2e)
- [ ] No lint errors
- [ ] Build successfully
- [ ] Environment variables documented
- [ ] API documentation updated
- [ ] Database migrations tested

### Release Checklist  
- [ ] Version number follows SemVer
- [ ] CHANGELOG.md updated
- [ ] Package.json version updated
- [ ] Git working directory clean
- [ ] On main branch
- [ ] Latest changes pulled
- [ ] Tag created and pushed
- [ ] GitHub release created
- [ ] Release notes complete

### Post-release Checklist
- [ ] Deployment successful
- [ ] Smoke tests pass in production
- [ ] Monitoring alerts configured
- [ ] Team notified
- [ ] Documentation updated

## 🎯 Release History

| Version | Date | Type | Description |
|---------|------|------|-------------|
| v1.0.0 | 2025-08-27 | Major | Initial stable release |

## 🔍 Troubleshooting

### Common Issues:

#### 1. Tag already exists
```powershell
# Delete local tag
git tag -d v1.0.1

# Delete remote tag
git push origin :refs/tags/v1.0.1

# Create new tag
git tag -a v1.0.1 -m "Fixed release"
git push origin v1.0.1
```

#### 2. Working directory not clean
```powershell
# Check status
git status

# Stash changes
git stash

# Or commit changes
git add .
git commit -m "Pre-release cleanup"
```

#### 3. Build fails
```powershell
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

#### 4. Tests fail
```powershell
# Run tests individually
npm run test
npm run test:e2e

# Check specific test file
npm run test -- auth.controller.spec.ts
```

## 🔗 Useful Links

- [Repository](https://github.com/Minhduc7904/BEE)
- [Releases](https://github.com/Minhduc7904/BEE/releases)
- [Issues](https://github.com/Minhduc7904/BEE/issues)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

## 📞 Support

Nếu gặp vấn đề với release process:

1. Check [Troubleshooting](#troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/Minhduc7904/BEE/issues)
3. Create new issue with `release` label
4. Contact team lead hoặc DevOps engineer

---

**Last updated**: August 27, 2025
**Document version**: 1.0
**Maintainer**: Development Team
