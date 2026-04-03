# Python Backend - DEPRECATED

⚠️ **This Python/FastAPI backend is no longer actively developed.**

## Status

- **Maintenance Mode**: Security fixes only
- **Recommended**: Use the Go backend for all new development

## Migration

All features from the Python backend have been ported to the Go backend.

| Feature | Python Backend | Go Backend |
|---------|---------------|------------|
| Notes CRUD | ✅ | ✅ |
| Search | ✅ | ✅ (improved) |
| Tags | ✅ | ✅ |
| Templates | ✅ | ✅ |
| Themes | ✅ | ✅ |
| Sharing | ✅ | ✅ |
| Media Upload | ✅ | ✅ |
| Graph View | ✅ | ✅ |
| Authentication | ✅ | ✅ |
| Rate Limiting | ✅ | ✅ |
| WebSocket | ❌ | ✅ |
| Performance | Good | **Excellent** |

## Use Go Backend Instead

The Go backend is located at `/go` and provides:
- Better performance (Fiber framework)
- Lower memory footprint
- Faster startup time
- Active development and support

### Quick Start (Go Backend)

```bash
# Development
cd go && go run cmd/server/main.go

# Docker
docker-compose -f go/docker-compose.yml up

# Production
docker pull ghcr.io/gamosoft/gonote:go
```

## Why Deprecated?

The Go backend was chosen because:
1. **Performance**: Go is significantly faster than Python for this use case
2. **Memory**: Lower memory footprint, better for self-hosting
3. **Simplicity**: Single binary deployment, no virtual environments
4. **Type Safety**: Compile-time type checking catches errors early

---

**Last Updated**: 2024
**Final Python Version**: See `VERSION` file
