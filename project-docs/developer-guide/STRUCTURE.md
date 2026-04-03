# GoNote Project Structure

This document provides an overview of the GoNote project structure after the v0.24.0 reorganization.

## Quick Reference

```
GoNote/
├── 📁 .github/              # GitHub configuration (CODEOWNERS, workflows)
├── 📁 build/                # Build configuration (Tailwind CSS, TypeScript)
├── 📁 deploy/               # Deployment configuration (Render.com, etc.)
├── 📁 docker/               # Docker configuration (centralized)
├── 📁 docs/                 # Website documentation and assets
├── 📁 go/                   # Go backend (primary)
├── 📁 project-docs/         # Project documentation (categorized)
├── 📁 shared/               # Shared resources
│   ├── 📁 assets/          # Project-owned assets
│   ├── 📁 frontend/        # Frontend application
│   ├── 📁 locales/         # Translations
│   ├── 📁 plugins/         # Plugins
│   └── 📁 themes/          # CSS themes
├── 📁 tests/                # Test suites (Playwright E2E)
├── 📄 CHANGELOG.md          # Version history
├── 📄 CONTRIBUTING.md       # Contributing guidelines
├── 📄 LICENSE               # MIT License
├── 📄 Makefile              # Build commands
├── 📄 README.md             # Project overview
├── 📄 SECURITY_CONTACT.md   # Security reporting contact
└── 📄 VERSION               # Current version number
```

## Directory Details

### `.github/`
GitHub-specific configuration files.

| File | Purpose |
|------|---------|
| `CODEOWNERS` | Code ownership for automated review assignment |
| `workflows/` | CI/CD pipeline definitions |

### `build/`
Build tooling configuration.

| File | Purpose |
|------|---------|
| `tailwind/input.css` | Tailwind CSS source |
| `tailwind/tailwind.config.js` | Tailwind configuration |
| `tailwind/postcss.config.js` | PostCSS configuration |
| `tsconfig.json` | TypeScript configuration |
| `README.md` | Build documentation |

**Usage:**
```bash
make css-build   # Build CSS
make css-watch   # Watch for changes
```

### `docker/`
Centralized Docker configuration.

| Directory | Purpose |
|-----------|---------|
| `compose/development.yml` | Go backend development |
| `compose/production.yml` | Production (pre-built image) |
| `compose/python-legacy.yml` | Python backend (legacy) |
| `go/Dockerfile` | Go backend Dockerfile |
| `python/Dockerfile` | Python backend Dockerfile |

**Usage:**
```bash
make docker-up        # Start development
make docker-prod-up   # Start production
```

### `deploy/`
Deployment configuration for various platforms.

| File | Platform | Purpose |
|------|----------|---------|
| `render.yaml` | Render.com | Deployment blueprint |
| `README.md` | — | Deployment documentation |

### `docs/`
Website documentation, screenshots, and marketing assets.

| File | Purpose |
|------|---------|
| `*.md` | Website documentation |
| `*.jpg` | Screenshots |
| `*.svg` | Graphics and logos |

### `go/`
Go backend implementation (primary backend).

| Directory | Purpose |
|-----------|---------|
| `cmd/server/` | Application entry point |
| `internal/` | Private packages (handlers, services, middleware) |
| `data/` | Default data directory |
| `config.yaml` | Go configuration |
| `Dockerfile` | Docker build (legacy path, still works) |
| `docker-compose.yml` | Docker Compose (legacy path, still works) |

**Usage:**
```bash
cd go && go run cmd/server/main.go
```

### `project-docs/`
Comprehensive project documentation, categorized by audience.

| Directory | Purpose |
|-----------|---------|
| `user-guide/` | User-facing documentation (features, themes, etc.) |
| `developer-guide/` | Technical documentation (API, environment variables) |
| `security/` | Security guides and best practices |
| `legacy/` | Legacy Python backend documentation |
| `templates/` | Note templates |
| `README.md` | Documentation index |
| `MIGRATION.md` | Migration guide for v0.24.0 changes |

### `shared/`
Shared resources used by both backends.

#### `shared/assets/`
Project-owned assets (not third-party).

| Directory | Purpose |
|-----------|---------|
| `css/` | Compiled CSS output |
| `icons/` | Project icons |
| `images/` | Project images |

#### `shared/frontend/`
Frontend application (shared between backends).

| File | Purpose |
|------|---------|
| `app.js` | Main application logic |
| `index.html` | Single-page application |
| `login.html` | Login page |
| `libs/` | Third-party library cache (CDN-free) |

#### `shared/themes/`
CSS themes (16 built-in themes: 11 dark + 5 light).

#### `shared/plugins/`
Plugin system and default plugins.

#### `shared/locales/`
Internationalization files (en-US, zh-CN).

### `tests/`
All test suites.

| Directory | Purpose |
|-----------|---------|
| `e2e/` | Playwright E2E tests (20+ specs) |
| `fixtures/` | Test data and fixtures |
| `README.md` | Test documentation |

**Usage:**
```bash
npx playwright test              # Run all E2E tests
npx playwright test tests/e2e/notes/  # Run specific tests
```

### `go/internal/`
Go backend internal packages (clean architecture).

| Directory | Purpose |
|-----------|---------|
| `config/` | Configuration loading |
| `handlers/` | HTTP request handlers (13 files) |
| `middleware/` | Auth, CORS, CSRF, rate limiting (5 files) |
| `models/` | Data structures |
| `services/` | Business logic (17 files) |

## File Locations by Task

| Task | Location |
|------|----------|
| **Start Go server** | `go/cmd/server/main.go` |
| **Start Python server** | `python/backend/main.py` |
| **Modify handlers** | `go/internal/handlers/` |
| **Modify services** | `go/internal/services/` |
| **Add middleware** | `go/internal/middleware/` |
| **Change frontend** | `shared/frontend/` |
| **Add theme** | `shared/themes/` |
| **Add translation** | `shared/locales/` |
| **Add plugin** | `shared/plugins/` |
| **Write E2E test** | `tests/e2e/` |
| **Write unit test** | `go/internal/**/*_test.go` |
| **Update docs** | `project-docs/` |
| **Build CSS** | `build/tailwind/` |
| **Docker config** | `docker/` |

## Key Changes in v0.24.0

| Change | Reason |
|--------|--------|
| `build/` directory | Centralize build configuration |
| `deploy/` directory | Platform-specific deployment configs |
| `docker/` directory | Unify Docker configuration |
| `shared/assets/` | Separate project assets from third-party libs |
| `tests/e2e/` | Clarify test type (E2E vs unit) |
| `project-docs/` categories | Organize documentation by audience |
| `config/` migration | Files moved to appropriate locations |

## Backward Compatibility

The following legacy paths still work but are deprecated:

- `go/Dockerfile` → Use `docker/go/Dockerfile`
- `go/docker-compose.yml` → Use `docker/compose/development.yml`
- `input.css` → Use `build/tailwind/input.css`
- `tailwind.config.js` → Use `build/tailwind/tailwind.config.js`

**These will be removed in v0.26.0.**

## Related Documentation

- [README.md](../README.md) - Project overview and quick start
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines
- [project-docs/README.md](project-docs/README.md) - Documentation index
- [tests/README.md](tests/README.md) - Test documentation
- [docker/README.md](docker/README.md) - Docker documentation
- [build/README.md](build/README.md) - Build configuration
- [project-docs/MIGRATION.md](project-docs/MIGRATION.md) - Migration guide

---

**Last Updated:** 2026-04-01  
**Version:** 0.24.0
