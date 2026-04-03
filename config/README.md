# Configuration Files

This directory contains configuration files for GoNote.

## Files

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Playwright E2E test configuration |
| `tsconfig.json` | TypeScript configuration |
| `render.yaml` | Render.com deployment configuration |
| `docker-compose.ghcr.yml` | Docker Compose shortcut (production) |

## Usage

### Playwright Tests

```bash
npx playwright test --config=config/playwright.config.ts
```

### Docker Compose

```bash
# Using the config directory shortcut
docker-compose -f config/docker-compose.ghcr.yml up -d
```

## Note

These configuration files were moved from the project root to reduce clutter.
For most common operations, you can use the Makefile commands instead:

```bash
make docker-prod-up   # Start production Docker
make css-build        # Build Tailwind CSS
make test             # Run Go tests
```
