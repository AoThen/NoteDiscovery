# GoNote Project Documentation

This directory contains comprehensive documentation for the GoNote project.

## 📚 Documentation Categories

### 👤 User Guide
Documentation for end users covering features and usage.

| Document | Description |
|----------|-------------|
| [FEATURES.md](user-guide/FEATURES.md) | Complete feature list and keyboard shortcuts |
| [THEMES.md](user-guide/THEMES.md) | Theme customization and creating custom themes |
| [TAGS.md](user-guide/TAGS.md) | Organize notes with tags and combined filtering |
| [TEMPLATES.md](user-guide/TEMPLATES.md) | Create notes from reusable templates |
| [MATHJAX.md](user-guide/MATHJAX.md) | LaTeX/Math notation examples and syntax |
| [MERMAID.md](user-guide/MERMAID.md) | Diagram creation with Mermaid |
| [PLUGINS.md](user-guide/PLUGINS.md) | Plugin system and available plugins |
| [SHARING.md](user-guide/SHARING.md) | Share notes with tokens |

### 🔧 Developer Guide
Technical documentation for developers and contributors.

| Document | Description |
|----------|-------------|
| [API.md](developer-guide/API.md) | REST API documentation and examples |
| [ENVIRONMENT_VARIABLES.md](developer-guide/ENVIRONMENT_VARIABLES.md) | Environment variable configuration reference |
| [MIGRATION.md](developer-guide/MIGRATION.md) | File reorganization migration guide |
| [STRUCTURE.md](developer-guide/STRUCTURE.md) | Project structure overview |
| [FRONTEND_REFACTOR.md](developer-guide/FRONTEND_REFACTOR.md) | Frontend refactoring notes |
| [STATE_VARIABLES_TODO.md](developer-guide/STATE_VARIABLES_TODO.md) | State management TODOs |

### 🔒 Security
Security guides and best practices.

| Document | Description |
|----------|-------------|
| [SECURITY.md](security/SECURITY.md) | Security guide and best practices (English) |
| [SECURITY_CN.md](security/SECURITY_CN.md) | Security guide (Chinese) |
| [AUTHENTICATION.md](security/AUTHENTICATION.md) | Authentication setup and configuration |
| [SECURITY_CONTACT.md](SECURITY_CONTACT.md) | Security vulnerability reporting contact |

### 📋 Project
Project-level documentation.

| Document | Description |
|----------|-------------|
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes |

### 📦 Legacy (Python Backend)
Documentation for the legacy Python FastAPI backend (maintenance mode).

| Document | Description |
|----------|-------------|
| [PLUGIN_NOTE_STATISTICS.md](legacy/PLUGIN_NOTE_STATISTICS.md) | Plugin statistics documentation |
| [README_CN.md](legacy/README_CN.md) | Go backend documentation (Chinese) |

> **Note:** The Python backend is in maintenance mode. For new deployments, use the Go backend.

### 📝 Templates
Template files for notes.

| Directory | Description |
|-----------|-------------|
| [templates/](templates/) | Note template files |

---

## 🌐 Additional Documentation

### Root Documentation
- [README.md](../README.md) - Main project README
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines

### Website Documentation
- [docs/](../docs/) - Website documentation and assets

---

## 📖 Quick Links

- **[Getting Started](../README.md#quick-start)** - Installation and setup
- **[Features](user-guide/FEATURES.md)** - What GoNote can do
- **[Security Guide](security/SECURITY.md)** - Security best practices
- **[API Reference](developer-guide/API.md)** - REST API documentation
- **[Contributing](../CONTRIBUTING.md)** - How to contribute

---

## 🗂️ Directory Structure

```
project-docs/
├── README.md                 # This file
├── CHANGELOG.md              # Version history
├── SECURITY_CONTACT.md       # Security contact
├── user-guide/               # User-facing documentation
│   ├── FEATURES.md
│   ├── THEMES.md
│   ├── TAGS.md
│   ├── TEMPLATES.md
│   ├── MATHJAX.md
│   ├── MERMAID.md
│   ├── PLUGINS.md
│   └── SHARING.md
├── developer-guide/          # Technical documentation
│   ├── API.md
│   ├── ENVIRONMENT_VARIABLES.md
│   ├── MIGRATION.md
│   ├── STRUCTURE.md
│   ├── FRONTEND_REFACTOR.md
│   └── STATE_VARIABLES_TODO.md
├── security/                 # Security documentation
│   ├── SECURITY.md
│   ├── SECURITY_CN.md
│   └── AUTHENTICATION.md
├── legacy/                   # Legacy Python backend docs
│   └── PLUGIN_NOTE_STATISTICS.md
└── templates/                # Note templates
    └── ...
```

---

## 🤝 Contributing to Documentation

If you find errors or want to improve documentation, please:
1. Check the [Contributing Guidelines](../CONTRIBUTING.md)
2. Open an issue for discussion (for major changes)
3. Submit a pull request with your improvements

---

**Last Updated:** 2026-04-01
