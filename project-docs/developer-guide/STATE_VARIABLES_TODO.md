# 状态变量待处理问题

**记录日期**: 2026-03-12  
**相关文件**: `shared/frontend/app.js`, `shared/frontend/index.html`

---

## 1. `tags.expanded` - 未使用的状态变量

**问题描述**:
- `app.js` 中定义了 `tags.expanded` 状态和相关持久化逻辑
- 但 `index.html` 中 Tags 面板没有展开/收起功能，从未使用此变量

**涉及代码**:
```javascript
// app.js:178 - LOCAL_SETTINGS 定义
tagsExpanded: { key: 'tagsExpanded', type: 'boolean', default: false, target: 'tags.expanded' },

// app.js:381 - 状态定义
tags: {
    all: {},
    selected: [],
    expanded: false,  // ← 未使用
    reloadTimeout: null,
},

// app.js:760 - $watch 监听
this.$watch('tags.expanded', () => {
    this.saveTagsExpanded();
});

// app.js:5552 - 保存函数
saveTagsExpanded() {
    localStorage.setItem('tagsExpanded', this.tags.expanded.toString());
},
```

**处理方案**（二选一）:
1. **移除** - 删除 `tags.expanded` 相关代码（如果不需要展开功能）
2. **实现** - 参照 Favorites 面板，为 Tags 面板添加展开/收起功能

---

## 2. `media.attachmentsExpanded` - 未持久化

**问题描述**:
- `app.js:495` 定义了 `attachmentsExpanded: false`
- `index.html` 中有 4 处使用此变量控制附件面板展开/收起
- 但未在 `LOCAL_SETTINGS` 中定义，不会保存到 localStorage

**影响**: 每次刷新页面，附件面板重置为收起状态

**处理方案**（可选）:
如果需要持久化用户偏好，在 `LOCAL_SETTINGS` 中添加:
```javascript
attachmentsExpanded: { key: 'attachmentsExpanded', type: 'boolean', default: false, target: 'media.attachmentsExpanded' },
```

---

## 3. `stats.expanded` - 未持久化

**问题描述**:
- `app.js:487` 定义了 `stats.expanded`
- `index.html` 中有 4 处使用此变量控制统计面板展开/收起
- 但未在 `LOCAL_SETTINGS` 中定义，不会保存到 localStorage

**影响**: 每次刷新页面，统计面板重置为收起状态

**处理方案**（可选）:
如果需要持久化用户偏好，在 `LOCAL_SETTINGS` 中添加:
```javascript
statsExpanded: { key: 'statsExpanded', type: 'boolean', default: false, target: 'stats.expanded' },
```

---

## 已确认正常的变量

| 状态变量 | localStorage Key | 目标路径 | HTML 使用 | 状态 |
|---------|-----------------|---------|----------|------|
| `ui.viewMode` | `viewMode` | ✓ | ✓ (17处) | ✅ |
| `ui.sidebarWidth` | `sidebarWidth` | ✓ | ✓ (1处) | ✅ |
| `ui.editorWidth` | `editorWidth` | ✓ | ✓ (2处) | ✅ |
| `ui.syntaxHighlightEnabled` | `syntaxHighlightEnabled` | ✓ | ✓ (9处) | ✅ |
| `ui.readableLineLength` | `readableLineLength` | ✓ | ✓ (9处) | ✅ |
| `ui.hideUnderscoreFolders` | `hideUnderscoreFolders` | ✓ | ✓ (4处) | ✅ |
| `_favoritesState.list` | `noteFavorites` | ✓ | ✓ (通过 getter) | ✅ |
| `_favoritesState.expanded` | `favoritesExpanded` | ✓ | ✓ (5处) | ✅ |
| `folders.expanded` | `expandedFolders` | ✓ | ✓ (通过函数) | ✅ |
| `tags.expanded` | `tagsExpanded` | ✓ | ❌ 未使用 | ⚠️ |
| `media.attachmentsExpanded` | 未定义 | - | ✓ (4处) | ⚠️ 未持久化 |
| `stats.expanded` | 未定义 | - | ✓ (4处) | ⚠️ 未持久化 |
