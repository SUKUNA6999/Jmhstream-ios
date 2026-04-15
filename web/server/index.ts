import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { db } from "./db";
import { storage } from "./storage";
import { sql } from "drizzle-orm";
import { createApp } from "./app";
import * as telegramBot from "./telegramBot";
import * as movieApi from "./movieApi";

export function log(message: string, source = "server") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

async function runMigrations() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        username text NOT NULL UNIQUE,
        password text NOT NULL,
        created_at timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        message text NOT NULL,
        type text NOT NULL DEFAULT 'info',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS announcements (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        content text NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        is_pinned boolean NOT NULL DEFAULT false,
        created_at timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS site_settings (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        key text NOT NULL UNIQUE,
        value text NOT NULL,
        updated_at timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS admin_logs (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        action text NOT NULL,
        details text,
        admin_id varchar,
        created_at timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS featured_content (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id text NOT NULL,
        title text NOT NULL,
        poster_url text,
        banner_url text,
        description text,
        type text NOT NULL DEFAULT 'movie',
        is_active boolean NOT NULL DEFAULT true,
        sort_order integer NOT NULL DEFAULT 0,
        created_at timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS content_reports (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id text NOT NULL,
        title text NOT NULL,
        reason text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS watchlist_items (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id text NOT NULL,
        subject_id text NOT NULL,
        title text NOT NULL,
        poster_url text,
        type text NOT NULL DEFAULT 'movie',
        added_at timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS analytics_events (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        event text NOT NULL,
        subject_id text,
        title text,
        session_id text,
        created_at timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS broadcast_messages (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        message text NOT NULL,
        type text NOT NULL DEFAULT 'info',
        is_active boolean NOT NULL DEFAULT false,
        expires_at timestamp,
        created_at timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS users (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        username text NOT NULL UNIQUE,
        password text NOT NULL
      );
    `);
    log("Database tables created/verified", "db");
  } catch (err: any) {
    log(`DB migration error: ${err.message}`, "db");
  }
}

async function seedData() {
  try {
    const existing = await storage.getSiteSettings();
    if (existing.length > 0) return;

    await storage.upsertSiteSetting("site_name", "JMH STREAM");
    await storage.upsertSiteSetting("site_tagline", "Watch Movies & TV Shows Free");
    await storage.upsertSiteSetting("site_description", "JMH STREAM — Your free movie & TV streaming destination. Thousands of titles, zero cost.");
    await storage.upsertSiteSetting("footer_text", "© 2025 JMH STREAM. All rights reserved. For entertainment purposes only.");
    await storage.upsertSiteSetting("maintenance_mode", "false");
    await storage.upsertSiteSetting("twitter_url", "https://twitter.com/jmhstream");
    await storage.upsertSiteSetting("discord_url", "https://discord.gg/jmhstream");
    await storage.upsertSiteSetting("telegram_url", "https://t.me/jmhstream");

    await storage.createNotification({
      title: "Welcome to JMH STREAM!",
      message: "We're live! Enjoy free movies and TV shows. New content added daily.",
      type: "success",
      isActive: true,
    });

    await storage.createAnnouncement({
      title: "Platform Launch",
      content: "JMH STREAM is officially live! Browse thousands of movies and TV shows completely free. Happy watching!",
      isActive: true,
      isPinned: true,
    });

    await storage.createBroadcastMessage({
      message: "Welcome to JMH STREAM! Enjoy unlimited free movies and TV shows.",
      type: "info",
      isActive: false,
    });

    log("Seed data inserted", "db");
  } catch (err: any) {
    log(`Seed error: ${err.message}`, "db");
  }
}

(async () => {
  await runMigrations();
  await seedData();

  // Load active API setting
  storage.getSiteSetting("active_api").then(setting => {
    if (setting?.value === "primary" || setting?.value === "backup") {
      movieApi.setActiveApi(setting.value as "primary" | "backup");
    }
  }).catch(() => {});

  // Start Telegram scheduler (long-running process only)
  telegramBot.startTelegramScheduler().catch(err => console.error("[Telegram] Scheduler error:", err));

  const app = createApp();

  if (process.env.NODE_ENV !== "production") {
    const { setupVite } = await import("./vite");
    // In dev mode, let Vite handle the frontend
    app.use("*", async (c, next) => {
      // Vite middleware is set up separately via the HTTP server below
      return next();
    });
  } else {
    // Serve static files from dist/public in production
    app.use(
      "/*",
      serveStatic({ root: "./dist/public" }),
    );
    // SPA fallback — serve index.html for all non-API routes
    app.get("/*", async (c) => {
      return serveStatic({ path: "./dist/public/index.html" })(c, async () => {});
    });
  }

  const port = parseInt(process.env.PORT || "5000", 10);

  if (process.env.NODE_ENV !== "production") {
    // Dev mode: use raw Node.js HTTP server so Vite can attach its WS
    const { createServer } = await import("http");
    const { setupVite } = await import("./vite");
    const httpServer = createServer();
    await setupVite(httpServer, app as any);
    httpServer.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  } else {
    serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => {
      log(`serving on port ${port}`);
    });
  }
})();
