# 项目文件整理总结

**整理日期:** 2026-04-01
**整理版本:** v0.24.0

---

## ✅ 整理完成项

### 阶段 1: 配置和文档整理

| 任务 | 状态 | 详情 |
|------|------|------|
| 创建 `deploy/` 目录 | ✅ | 集中管理部署配置 |
| 迁移配置文件 | ✅ | `playwright.config.ts` → `tests/`, `render.yaml` → `deploy/`, `tsconfig.json` → `build/` |
| 移动文档到 `project-docs/` | ✅ | `STRUCTURE.md`, `CHANGELOG.md`, `SECURITY_CONTACT.md` |
| 整理 `project-docs/` 子目录 | ✅ | 文档按类别分类 |

### 阶段 2: 消除重复文件

| 任务 | 状态 | 详情 |
|------|------|------|
| 删除重复 docker-compose | ✅ | 根目录 `docker-compose.ghcr.yml` |
| 删除空目录 | ✅ | `config/test-results/` |

### 阶段 3: 测试目录整理

| 任务 | 状态 | 详情 |
|------|------|------|
| 迁移 playwright 配置 | ✅ | `config/playwright.config.ts` → `tests/playwright.config.ts` |

### 阶段 4: 清理构建产物

| 任务 | 状态 | 详情 |
|------|------|------|
| 清理 Go 编译产物 | ✅ | 删除 `server`, `main`, `gonote`, `coverage.out` |
| 清理测试输出 | ✅ | 删除 `test-results/`, `playwright-report/` |

### 阶段 5: 清理脚本和过时文件

| 任务 | 状态 | 详情 |
|------|------|------|
| 删除 scripts/ 目录 | ✅ | release 脚本不再需要 |
| 删除 config/ 目录 | ✅ | 文件已迁移到新位置 |

### 阶段 6: 配置更新

| 任务 | 状态 | 详情 |
|------|------|------|
| 更新 Makefile | ✅ | 更新路径，删除 release 相关命令 |
| 更新 .gitignore | ✅ | 添加新路径，清理旧路径 |
| 更新 .dockerignore | ✅ | 完善排除项 |
| 更新文档引用 | ✅ | `CHANGELOG.md`, `STRUCTURE.md`, `MIGRATION.md` |

---

## 📁 最终目录结构

```
NoteDiscovery/
├── .github/                 # GitHub 配置 (workflows, CODEOWNERS)
├── .dockerignore           # Docker 忽略
├── .gitignore              # Git 忽略
├── LICENSE                 # 许可证
├── Makefile                # 构建命令
├── README.md               # 项目说明
├── VERSION                 # 版本号
│
├── build/                  # 构建配置
│   ├── tailwind/           # Tailwind CSS 配置
│   │   ├── input.css
│   │   ├── tailwind.config.js
│   │   └── postcss.config.js
│   ├── tsconfig.json       # TypeScript 配置
│   └── README.md
│
├── deploy/                 # 部署配置
│   ├── render.yaml         # Render.com 部署
│   └── README.md
│
├── docker/                 # Docker 配置
│   ├── compose/
│   │   ├── development.yml # 开发环境
│   │   └── production.yml  # 生产环境
│   ├── go/
│   │   └── Dockerfile
│   └── README.md
│
├── docs/                   # 网站文档和资产
├── go/                     # Go 后端（主要后端）
│
├── project-docs/           # 项目文档
│   ├── README.md           # 文档索引
│   ├── CHANGELOG.md        # 版本历史
│   ├── SECURITY_CONTACT.md # 安全联系方式
│   ├── user-guide/         # 用户指南
│   ├── developer-guide/    # 开发者指南
│   ├── security/           # 安全文档
│   ├── legacy/             # 旧版 Python 后端文档
│   └── templates/          # 笔记模板
│
├── shared/                 # 共享资源
│   ├── assets/             # 项目资源
│   ├── frontend/           # 前端应用
│   ├── locales/            # 翻译
│   ├── plugins/            # 插件
│   └── themes/             # 主题
│
└── tests/                  # 测试
    ├── e2e/                # Playwright E2E 测试
    │   ├── auth/
    │   ├── bugs/
    │   ├── export/
    │   ├── general/
    │   └── ...
    ├── playwright.config.ts # Playwright 配置
    └── README.md
```

---

## 📋 路径变更

| 旧路径 | 新路径 |
|--------|--------|
| `config/playwright.config.ts` | `tests/playwright.config.ts` |
| `config/tsconfig.json` | `build/tsconfig.json` |
| `config/render.yaml` | `deploy/render.yaml` |
| `docker-compose.ghcr.yml` | `docker/compose/production.yml` |
| `scripts/release.sh` | 已删除 |
| `scripts/release.ps1` | 已删除 |

---

## 🔧 使用建议

### Docker 用户（无影响）

```bash
# 启动生产环境
make docker-prod-up

# 启动开发环境
make docker-up
```

### 开发者

```bash
# 运行 Go 测试
make test

# 运行 E2E 测试
make test-e2e

# 构建 CSS
make css-build

# 监听 CSS 变化
make css-watch
```

---

## 📖 相关文档

- [project-docs/README.md](project-docs/README.md) - 文档索引
- [project-docs/CHANGELOG.md](project-docs/CHANGELOG.md) - 版本历史
- [project-docs/developer-guide/STRUCTURE.md](project-docs/developer-guide/STRUCTURE.md) - 项目结构说明
- [project-docs/developer-guide/MIGRATION.md](project-docs/developer-guide/MIGRATION.md) - 迁移指南
- [docker/README.md](docker/README.md) - Docker 说明
- [deploy/README.md](deploy/README.md) - 部署说明
- [build/README.md](build/README.md) - 构建配置说明

---

**整理完成！** 项目结构现在更加清晰和易于维护。
