# File Reorganization Migration Guide

**Date:** 2026-04-01  
**Version:** 0.24.0

This document guides you through the changes made to the GoNote project structure.

## Overview

The project has been reorganized to improve maintainability, consistency, and developer experience. The changes are **backward-compatible** for end users, but developers and contributors need to update their workflows.

## What Changed

### 📁 New Directories

| Directory | Purpose |
|-----------|---------|
| `build/tailwind/` | Tailwind CSS configuration |
| `docker/` | Centralized Docker configuration |
| `docker/compose/` | Docker Compose files |
| `docker/go/` | Go backend Dockerfile |
| `docker/python/` | Python backend Dockerfile |
| `shared/assets/` | Project-owned assets |
| `tests/e2e/` | Playwright E2E tests |
| `project-docs/user-guide/` | User documentation |
| `project-docs/developer-guide/` | Developer documentation |
| `project-docs/security/` | Security documentation |
| `project-docs/legacy/` | Legacy Python backend docs |

### 📄 New Files

| File | Purpose |
|------|---------|
| `scripts/release.sh` | Bash release script |
| `CHANGELOG.md` | Version history |
| `SECURITY_CONTACT.md` | Security reporting contact |
| `.github/CODEOWNERS` | Code ownership |
| `project-docs/README.md` | Documentation index |
| `tests/README.md` | Test documentation |
| `shared/assets/README.md` | Assets documentation |
| `build/README.md` | Build configuration docs |
| `docker/README.md` | Docker documentation |

### 🗑️ Removed Directories

| Directory | Reason |
|-----------|--------|
| `documentation/` | Merged into `project-docs/` |

### 🔄 Moved Files

| Old Path | New Path |
|----------|----------|
| `input.css` | `build/tailwind/input.css` |
| `tailwind.config.js` | `build/tailwind/tailwind.config.js` |
| `go/docker-compose.yml` | `docker/compose/development.yml` |
| `docker-compose.ghcr.yml` | `docker/compose/production.yml` |
| `python/docker-compose.yml` | `docker/compose/python-legacy.yml` |
| `go/Dockerfile` | `docker/go/Dockerfile` |
| `python/Dockerfile` | `docker/python/Dockerfile` |
| `documentation/ENVIRONMENT_VARIABLES.md` | `project-docs/developer-guide/ENVIRONMENT_VARIABLES.md` |
| `project-docs/THEMES.md` | `project-docs/user-guide/THEMES.md` |
| `project-docs/FEATURES.md` | `project-docs/user-guide/FEATURES.md` |
| `project-docs/SECURITY.md` | `project-docs/security/SECURITY.md` |
| `project-docs/AUTHENTICATION.md` | `project-docs/security/AUTHENTICATION.md` |
| `tests/*.spec.ts` | `tests/e2e/*.spec.ts` |
| `tests/*/` | `tests/e2e/*/` |

## Impact Assessment

### ✅ No Impact (End Users)

If you only use GoNote via Docker, **no changes are required**:

```bash
# This still works exactly the same
docker run -d -p 9000:9000 -v ./data:/app/data ghcr.io/gamosoft/gonote:go
```

### ⚠️ Minor Changes (Developers)

#### CSS Build Commands

**Old:**
```bash
npx tailwindcss -i ./input.css -o ./shared/frontend/libs/tailwind/tailwind.css
```

**New:**
```bash
npx tailwindcss -i ./build/tailwind/input.css -o ./shared/frontend/libs/tailwind/tailwind.css
```

**Or use Make:**
```bash
make css-build
make css-watch
```

#### Docker Commands

**Old:**
```bash
docker-compose -f go/docker-compose.yml up
docker-compose -f docker-compose.ghcr.yml up
```

**New:**
```bash
docker-compose -f docker/compose/development.yml up
docker-compose -f docker/compose/production.yml up
```

**Or use Make:**
```bash
make docker-up        # Development
make docker-prod-up   # Production
```

#### Dockerfile Paths

**Old:**
```bash
docker build -f go/Dockerfile -t gonote .
```

**New:**
```bash
docker build -f docker/go/Dockerfile -t gonote .
```

#### Release Script

**Old (PowerShell only):**
```powershell
./scripts/release.ps1 -Version 0.24.0
```

**New (Cross-platform):**
```bash
# Bash
./scripts/release.sh 0.24.0

# Or via Make
make release-version VERSION=0.24.0
```

#### Test Paths

**Old:**
```bash
npx playwright test tests/auth/login.spec.ts
```

**New:**
```bash
npx playwright test tests/e2e/auth/login.spec.ts
```

### 📚 Documentation Updates

All documentation has been reorganized into categories:

| Category | Location |
|----------|----------|
| User guides | `project-docs/user-guide/` |
| Developer docs | `project-docs/developer-guide/` |
| Security | `project-docs/security/` |
| Legacy | `project-docs/legacy/` |

**Old links will break.** Update bookmarks:

- `project-docs/THEMES.md` → `project-docs/user-guide/THEMES.md`
- `project-docs/API.md` → `project-docs/developer-guide/API.md`
- `project-docs/SECURITY.md` → `project-docs/security/SECURITY.md`

## Backward Compatibility

### Old Files Preserved

The old Docker Compose files remain in their original locations for backward compatibility:

- `go/docker-compose.yml` (still works)
- `docker-compose.ghcr.yml` (still works)
- `python/docker-compose.yml` (still works)

**However, these will be removed in a future release.** Please update your scripts.

### Migration Timeline

| Date | Action |
|------|--------|
| **Now (v0.24.0)** | New structure introduced, old paths still work |
| **v0.25.0** | Deprecation warnings in CI/CD |
| **v0.26.0** | Old paths removed (breaking change) |

## CI/CD Updates

If you have CI/CD pipelines, update these paths:

### GitHub Actions

**Old:**
```yaml
- run: docker-compose -f go/docker-compose.yml up
```

**New:**
```yaml
- run: docker-compose -f docker/compose/development.yml up
```

### GitLab CI

**Old:**
```yaml
script:
  - docker build -f go/Dockerfile -t $CI_REGISTRY_IMAGE .
```

**New:**
```yaml
script:
  - docker build -f docker/go/Dockerfile -t $CI_REGISTRY_IMAGE .
```

## Testing Your Setup

After migrating, verify everything works:

### 1. CSS Build

```bash
make deps
make css-build
ls -la shared/frontend/libs/tailwind/tailwind.css
```

### 2. Docker

```bash
make docker-up
# Access http://localhost:9000
make docker-down
```

### 3. Tests

```bash
npx playwright install
npx playwright test tests/e2e/notes/
```

### 4. Documentation Links

Open `project-docs/README.md` and verify all links work.

## Rollback Plan

If you need to revert to the old structure:

```bash
# 1. Move Tailwind config back
mv build/tailwind/input.css ./input.css
mv build/tailwind/tailwind.config.js ./tailwind.config.js

# 2. Restore old Docker paths (if deleted originals)
# (Files were copied, not moved, so originals still exist)

# 3. Restore old test structure
mv tests/e2e/* tests/
rmdir tests/e2e

# 4. Restore old documentation structure
# (Requires git checkout or manual restoration)
```

**Better approach:** Use git to checkout the previous version:

```bash
git checkout v0.23.0
```

## Questions or Issues?

If you encounter problems:

1. **Check the logs** - Most issues will show clear error messages
2. **Review this guide** - Double-check all path updates
3. **Open an issue** - https://github.com/gamosoft/gonote/issues
4. **Discussions** - https://github.com/gamosoft/gonote/discussions

## Summary

| Component | Action Required | Deadline |
|-----------|----------------|----------|
| **Docker users** | None | - |
| **Developers** | Update local scripts | v0.26.0 |
| **CI/CD** | Update pipeline paths | v0.26.0 |
| **Documentation links** | Update bookmarks | Now |
| **Contributors** | Use new test paths | Now |

---

**Thank you for your patience during this reorganization!** The new structure will make the project easier to maintain and extend.
