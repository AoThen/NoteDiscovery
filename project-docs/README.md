# GoNote 项目文档

本目录包含 GoNote 项目的完整文档。

This directory contains comprehensive documentation for the GoNote project.

## 📚 文档分类 / Documentation Categories

### 👤 用户指南 / User Guide
面向最终用户的文档，涵盖功能和使用说明。

Documentation for end users covering features and usage.

| 文档 / Document | 描述 / Description |
|----------|-------------|
| [FEATURES.md](user-guide/FEATURES.md) / [中文版](user-guide/FEATURES_CN.md) | 完整功能列表和键盘快捷键 |
| [THEMES.md](user-guide/THEMES.md) / [中文版](user-guide/THEMES_CN.md) | 主题自定义和创建自定义主题 |
| [TAGS.md](user-guide/TAGS.md) / [中文版](user-guide/TAGS_CN.md) | 使用标签和组合过滤组织笔记 |
| [TEMPLATES.md](user-guide/TEMPLATES.md) / [中文版](user-guide/TEMPLATES_CN.md) | 使用可重用模板创建笔记 |
| [MATHJAX.md](user-guide/MATHJAX.md) / [中文版](user-guide/MATHJAX_CN.md) | LaTeX/MathJax 示例和语法参考 |
| [MERMAID.md](user-guide/MERMAID.md) / [中文版](user-guide/MERMAID_CN.md) | 使用 Mermaid 创建图表 |
| [PLUGINS.md](user-guide/PLUGINS.md) / [中文版](user-guide/PLUGINS_CN.md) | 插件系统和可用插件 |
| [SHARING.md](user-guide/SHARING.md) / [中文版](user-guide/SHARING_CN.md) | 使用分享令牌分享笔记 |

### 🔧 开发者指南 / Developer Guide
面向开发者的技术文档。

Technical documentation for developers and contributors.

| 文档 / Document | 描述 / Description |
|----------|-------------|
| [API.md](developer-guide/API.md) / [中文版](developer-guide/API_CN.md) | REST API 文档和示例 |
| [ENVIRONMENT_VARIABLES.md](developer-guide/ENVIRONMENT_VARIABLES.md) / [中文版](developer-guide/ENVIRONMENT_VARIABLES_CN.md) | 环境变量配置参考 |
| [MIGRATION.md](developer-guide/MIGRATION.md) | 文件重组迁移指南 |
| [STRUCTURE.md](developer-guide/STRUCTURE.md) | 项目结构概述 |
| [FRONTEND_REFACTOR.md](developer-guide/FRONTEND_REFACTOR.md) | 前端重构说明 |
| [STATE_VARIABLES_TODO.md](developer-guide/STATE_VARIABLES_TODO.md) | 状态管理待办事项 |

### 🔒 安全 / Security
安全指南和最佳实践。

Security guides and best practices.

| 文档 / Document | 描述 / Description |
|----------|-------------|
| [SECURITY.md](security/SECURITY.md) | 安全指南和最佳实践（英文） |
| [SECURITY_CN.md](security/SECURITY_CN.md) | 安全指南（中文） |
| [AUTHENTICATION.md](security/AUTHENTICATION.md) | 认证设置和配置 |
| [AUTHENTICATION_CN.md](security/AUTHENTICATION_CN.md) | 认证说明（中文） |

### 📋 项目 / Project
项目级文档。

Project-level documentation.

| 文档 / Document | 描述 / Description |
|----------|-------------|
| [CHANGELOG.md](CHANGELOG.md) | 版本历史和发布说明 |
| [CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md) | 清理总结 |
| [INSPECTION_REPORT.md](INSPECTION_REPORT.md) | 检查报告 |

### 📦 遗留 / Legacy (Python 后端)
遗留 Python FastAPI 后端的文档（维护模式）。

Documentation for the legacy Python FastAPI backend (maintenance mode).

| 文档 / Document | 描述 / Description |
|----------|-------------|
| [PLUGIN_NOTE_STATISTICS.md](legacy/PLUGIN_NOTE_STATISTICS.md) | 插件统计文档 |
| [README_CN.md](legacy/README_CN.md) | Go 后端文档（中文） |
| [README.md](legacy/README.md) | Go 后端文档（英文） |

> **注意 / Note:** Python 后端已进入维护模式。新部署请使用 Go 后端。
> **Note:** The Python backend is in maintenance mode. For new deployments, use the Go backend.

### 📝 模板 / Templates
笔记模板文件。

Template files for notes.

| 目录 / Directory | 描述 / Description |
|-----------|-------------|
| [templates/](templates/) | 笔记模板文件 |

---

## 🌐 额外文档 / Additional Documentation

### 根目录文档 / Root Documentation
- [README.md](../README.md) - 项目概述 / Main project README
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 贡献指南 / Contributing guidelines

### 网站文档 / Website Documentation
- [docs/](../docs/) - 网站文档和营销资源 / Website documentation and marketing assets

---

## 📖 快速链接 / Quick Links

- **[快速开始](../README.md#quick-start)** - 安装和设置 / Installation and setup
- **[功能列表](user-guide/FEATURES.md)** - GoNote 能做什么 / What GoNote can do
- **[安全指南](security/SECURITY.md)** - 安全最佳实践 / Security best practices
- **[API 参考](developer-guide/API.md)** - REST API 文档 / REST API documentation
- **[贡献](../CONTRIBUTING.md)** - 如何贡献 / How to contribute

---

## 🗂️ 目录结构 / Directory Structure

```
project-docs/
├── README.md                 # 本文件 / This file
├── CHANGELOG.md              # 版本历史 / Version history
├── CLEANUP_SUMMARY.md        # 清理总结 / Cleanup summary
├── INSPECTION_REPORT.md      # 检查报告 / Inspection report
├── SECURITY_CONTACT.md       # 安全报告联系人 / Security contact
├── user-guide/               # 面向用户的文档 / User-facing documentation
│   ├── FEATURES.md / FEATURES_CN.md
│   ├── THEMES.md / THEMES_CN.md
│   ├── TAGS.md / TAGS_CN.md
│   ├── TEMPLATES.md / TEMPLATES_CN.md
│   ├── MATHJAX.md / MATHJAX_CN.md
│   ├── MERMAID.md / MERMAID_CN.md
│   ├── PLUGINS.md / PLUGINS_CN.md
│   └── SHARING.md / SHARING_CN.md
├── developer-guide/          # 技术文档 / Technical documentation
│   ├── API.md / API_CN.md
│   ├── ENVIRONMENT_VARIABLES.md / ENVIRONMENT_VARIABLES_CN.md
│   ├── MIGRATION.md
│   ├── STRUCTURE.md
│   ├── FRONTEND_REFACTOR.md
│   └── STATE_VARIABLES_TODO.md
├── security/                 # 安全文档 / Security documentation
│   ├── SECURITY.md
│   ├── SECURITY_CN.md
│   ├── AUTHENTICATION.md
│   └── AUTHENTICATION_CN.md
├── legacy/                   # 遗留 Python 后端文档 / Legacy Python backend docs
│   ├── PLUGIN_NOTE_STATISTICS.md
│   ├── README_CN.md
│   └── README.md
└── templates/                # 笔记模板 / Note templates
    ├── daily-journal.md
    ├── meeting-notes.md
    └── project-plan.md
```

---

## 🤝 贡献文档 / Contributing to Documentation

如果发现错误或者想改进文档，请：
1. 查看[贡献指南](../CONTRIBUTING.md)
2. 针对重大更改先提交 issue 讨论
3. 提交包含改进的拉取请求

If you find errors or want to improve documentation, please:
1. Check the [Contributing Guidelines](../CONTRIBUTING.md)
2. Open an issue for discussion (for major changes)
3. Submit a pull request with your improvements

---

**最后更新 / Last Updated:** 2026-04-03
