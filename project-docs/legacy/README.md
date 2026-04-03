# Legacy Documentation

This directory contains documentation for legacy and maintenance-mode components.

## Contents

| File | Description |
|------|-------------|
| [PLUGIN_NOTE_STATISTICS.md](PLUGIN_NOTE_STATISTICS.md) | Plugin statistics documentation |
| [README_CN.md](README_CN.md) | Go backend documentation (Chinese) |

## Note on Legacy Components

The following components are in **maintenance mode**:

- **Python FastAPI Backend** - No new features, bug fixes only
- **Go Backend (Chinese docs)** - Moved here for consolidation; English docs are in `../developer-guide/` and `../user-guide/`

For new deployments, always use:
- **Go backend** (see main documentation in `../user-guide/` and `../developer-guide/`)
- Latest stable version from the main branch

## Migration

If you're using legacy components, consider migrating:

| From | To |
|------|-----|
| Python backend | Go backend |
| Old documentation | Categorized docs in `../` |

See [MIGRATION.md](../developer-guide/MIGRATION.md) for detailed migration instructions.
