package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/shitcodebykaushik/EventWallah/apps/api/internal/httpapi"
	"github.com/shitcodebykaushik/EventWallah/apps/api/internal/store"
	"golang.org/x/crypto/bcrypt"
)

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	dbPath := env("EVENTWALLAH_DB", "./data/eventwallah.db")
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		logger.Error("create data directory", "error", err)
		os.Exit(1)
	}
	st, err := store.Open(dbPath)
	if err != nil {
		logger.Error("open database", "error", err)
		os.Exit(1)
	}
	defer st.Close()
	password := env("EVENTWALLAH_ADMIN_PASSWORD", "change-me-now")
	webURL := env("EVENTWALLAH_WEB_URL", "http://localhost:3000")
	securityKey := env("EVENTWALLAH_SECURITY_KEY", "eventwallah-development-security-key")
	if password == "change-me-now" && strings.HasPrefix(webURL, "https://") {
		logger.Error("refusing production startup with the development admin password")
		os.Exit(1)
	}
	if securityKey == "eventwallah-development-security-key" && strings.HasPrefix(webURL, "https://") {
		logger.Error("refusing production startup without EVENTWALLAH_SECURITY_KEY")
		os.Exit(1)
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("hash seed password", "error", err)
		os.Exit(1)
	}
	if err = st.Seed(context.Background(), string(hash)); err != nil {
		logger.Error("seed database", "error", err)
		os.Exit(1)
	}
	addr := env("EVENTWALLAH_ADDR", ":8080")
	handler := httpapi.New(st, webURL, env("EVENTWALLAH_CORS_ORIGIN", "http://localhost:3000"), logger, securityKey)
	server := &http.Server{Addr: addr, Handler: handler, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second}
	go func() {
		logger.Info("EventWallah API started", "address", addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server stopped", "error", err)
			os.Exit(1)
		}
	}()
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = server.Shutdown(ctx)
}
