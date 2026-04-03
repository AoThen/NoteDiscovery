package handlers

import (
	"io"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"

	"gonote/internal/models/config"
	"gonote/internal/services"
)

func TestNoteList(t *testing.T) {
	tmpDir := t.TempDir()
	cfg := &config.Config{
		Storage: config.StorageConfig{
			NotesDir: tmpDir,
		},
	}
	svc := services.NewNoteService(tmpDir)
	handler := NewNoteHandler(svc, cfg)

	app := fiber.New()
	app.Get("/api/notes", handler.List)

	t.Run("returns empty list with default pagination", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/notes", nil)
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		body, _ := io.ReadAll(resp.Body)
		assert.Contains(t, string(body), `"notes":[]`)
		assert.Contains(t, string(body), `"pagination"`)
		assert.Contains(t, string(body), `"page":1`)
		assert.Contains(t, string(body), `"limit":50`)
	})

	t.Run("respects page parameter", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/notes?page=2", nil)
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		body, _ := io.ReadAll(resp.Body)
		assert.Contains(t, string(body), `"page":2`)
	})

	t.Run("respects limit parameter", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/notes?limit=10", nil)
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		body, _ := io.ReadAll(resp.Body)
		assert.Contains(t, string(body), `"limit":10`)
	})

	t.Run("uses default values when no params", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/notes", nil)
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		body, _ := io.ReadAll(resp.Body)
		assert.Contains(t, string(body), `"page":1`)
		assert.Contains(t, string(body), `"limit":50`)
	})

	t.Run("returns pagination metadata", func(t *testing.T) {
		for i := 0; i < 5; i++ {
			path := filepath.Join(tmpDir, "note"+string(rune('a'+i))+".md")
			os.WriteFile(path, []byte("# Test Note"), 0644)
		}
		svc.InvalidateCache()

		req := httptest.NewRequest("GET", "/api/notes?page=1&limit=2", nil)
		resp, err := app.Test(req)

		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		body, _ := io.ReadAll(resp.Body)
		assert.Contains(t, string(body), `"total":5`)
		assert.Contains(t, string(body), `"total_pages":3`)
		assert.Contains(t, string(body), `"has_next":true`)
		assert.Contains(t, string(body), `"has_prev":false`)
	})
}
