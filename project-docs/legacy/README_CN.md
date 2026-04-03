# GoNote Go 后端

轻量级、自托管的笔记应用 Go 语言实现版本。

## 目录

- [环境要求](#环境要求)
- [本地构建](#本地构建)
- [部署方式](#部署方式)
  - [直接运行](#直接运行)
  - [Docker 部署](#docker-部署)
  - [Docker Compose 部署](#docker-compose-部署)
- [配置说明](#配置说明)
- [环境变量](#环境变量)
- [生产环境注意事项](#生产环境注意事项)

## 环境要求

- **Go**: 1.24 或更高版本
- **操作系统**: Linux / macOS / Windows
- **Docker**（可选）: 用于容器化部署

## 本地构建

### 1. 克隆项目

```bash
git clone https://github.com/AoThen/GoNote.git
cd GoNote/go
```

### 2. 下载依赖

```bash
go mod download
```

### 3. 编译项目

```bash
# 普通编译
go build -o gonote ./cmd/server

# 优化编译（减小二进制体积）
CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -trimpath \
    -o gonote ./cmd/server
```

### 4. 准备运行环境

编译后需要准备以下文件结构：

```
gonote/          # 编译后的二进制文件
config.yaml            # 配置文件
frontend/              # 前端文件（从 shared/frontend 复制）
themes/                # 主题文件（从 shared/themes 复制）
locales/               # 语言文件（从 shared/locales 复制）
data/                  # 笔记数据目录（自动创建）
```

### 5. 运行

```bash
./gonote
```

服务将在 `http://localhost:9000` 启动。

## 部署方式

### 直接运行

适合开发环境或简单的生产部署：

```bash
# 开发模式（使用默认配置）
cd go
go run ./cmd/server/main.go

# 指定配置文件
go run ./cmd/server/main.go --config config.yaml

# 生产模式（编译后运行）
./gonote --config config.yaml
```

### Docker 部署

#### 手动构建镜像

```bash
# 在项目根目录执行
docker build -f go/Dockerfile -t gonote-go .

# 运行容器
docker run -d \
  --name gonote \
  -p 9000:9000 \
  -v $(pwd)/go/data:/app/data \
  gonote-go
```

#### 使用预构建镜像

```bash
# 从 GitHub Container Registry 拉取
docker pull ghcr.io/aothen/gonote-go:latest

# 运行
docker run -d \
  --name gonote \
  -p 9000:9000 \
  -v $(pwd)/data:/app/data \
  ghcr.io/aothen/gonote-go:latest
```

### Docker Compose 部署

推荐用于生产环境：

```bash
# 在 go 目录下执行
cd go
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

或使用生产配置：

```bash
# 使用预构建镜像
docker-compose -f docker-compose.ghcr.yml up -d
```

## 配置说明

配置文件 `config.yaml` 包含以下主要配置项：

### 服务器配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `server.host` | 0.0.0.0 | 服务绑定地址 |
| `server.port` | 9000 | 服务端口 |
| `server.debug` | false | 调试模式（生产环境必须为 false） |
| `server.allowed_origins` | ["*"] | CORS 允许的源 |

### 认证配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `authentication.enabled` | false | 是否启用认证 |
| `authentication.password` | admin | 登录密码（**生产环境必须修改**） |
| `authentication.secret_key` | (需修改) | 会话密钥（**生产环境必须修改**） |
| `authentication.secure_cookie` | false | HTTPS 环境下自动启用 |

### 存储配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `storage.notes_dir` | ./data | 笔记存储目录 |
| `storage.plugins_dir` | ../shared/plugins | 插件目录 |

### 缓存配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `cache.ttl` | 60 | 缓存过期时间（秒） |
| `cache.capacity` | 1000 | 缓存最大条目数 |
| `cache.scan_interval` | 30 | 后台扫描间隔（秒） |

### 限流配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `rate_limit.enabled` | false | 是否启用限流 |
| `rate_limit.max_requests` | 30 | 时间窗口内最大请求数 |
| `rate_limit.window_seconds` | 1 | 时间窗口（秒） |

### 上传配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `upload.max_file_size_mb` | 50 | 单文件最大大小（MB） |
| `upload.max_body_size_mb` | 100 | 请求体最大大小（MB） |
| `upload.allowed_types` | [] | 允许的 MIME 类型（空=允许所有） |

## 环境变量

所有配置项都可通过环境变量覆盖，格式为 `大写_配置路径`：

```bash
# 服务器配置
export PORT=9000
export DEBUG=false
export ALLOWED_ORIGINS="http://localhost:9000,https://example.com"

# 认证配置
export AUTHENTICATION_ENABLED=true
export AUTHENTICATION_PASSWORD=your_secure_password
export AUTHENTICATION_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")

# 缓存配置
export CACHE_TTL=120
export CACHE_CAPACITY=2000

# 限流配置
export RATE_LIMIT_ENABLED=true
export RATE_LIMIT_MAX=60

# 上传配置
export UPLOAD_MAX_FILE_SIZE_MB=100
```

## 生产环境注意事项

### 安全配置清单

⚠️ **在暴露到互联网之前，必须完成以下配置：**

1. **修改默认密码**（默认 `admin` 不安全）
   ```yaml
   authentication:
     enabled: true
     password: "your_strong_password_here"
   ```

2. **生成随机密钥**
   ```bash
   # 使用 OpenSSL
   openssl rand -hex 32
   # 或使用 Python
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```

3. **启用认证**
   ```yaml
   authentication:
     enabled: true
   ```

4. **关闭调试模式**
   ```yaml
   server:
     debug: false
   ```

5. **启用 HTTPS**
   - 配置反向代理（Nginx/Caddy）
   - 或设置 `AUTHENTICATION_SECURE_COOKIE=true`

6. **启用限流**
   ```yaml
   rate_limit:
     enabled: true
     max_requests: 30
   ```

7. **配置 CORS**（不要使用 `*`）
   ```yaml
   server:
     allowed_origins:
       - "https://yourdomain.com"
   ```

**详细安全配置请参考：** [SECURITY_CN.md](../project-docs/SECURITY_CN.md)

### 性能优化

1. **调整缓存大小**
   ```yaml
   cache:
     capacity: 2000
     ttl: 120
   ```

2. **使用反向代理**
   - Nginx 处理静态文件和 SSL
   - Go 应用专注 API 请求

### 数据备份

笔记以 Markdown 文件形式存储在 `data/` 目录：

```bash
# 简单备份
tar -czf gonote-backup-$(date +%Y%m%d).tar.gz data/

# 定时备份（crontab）
0 2 * * * cd /path/to/gonote && tar -czf /backup/gonote-$(date +\%Y\%m\%d).tar.gz data/
```

### 健康检查

应用提供健康检查端点：

```bash
curl http://localhost:9000/health
```

Docker Compose 已配置自动健康检查。

## 常见问题

### 端口被占用

```bash
# 查看端口占用
lsof -i :9000

# 使用其他端口
export PORT=9080
./gonote
```

### 权限问题

```bash
# 确保 data 目录可写
chmod 755 data/
```

### Docker 数据持久化

确保正确挂载卷：

```yaml
volumes:
  - ./data:/app/data  # 笔记数据
  - ./config.yaml:/app/config.yaml  # 配置文件（可选）
```

## 更多文档

- [API 文档](../documentation/API.md)
- [认证说明](../documentation/AUTHENTICATION.md)
- [环境变量](../documentation/ENVIRONMENT_VARIABLES.md)
- [功能列表](../documentation/FEATURES.md)
