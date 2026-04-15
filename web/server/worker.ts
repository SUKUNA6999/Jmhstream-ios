/**
 * Cloudflare Workers entry point for JMH STREAM.
 *
 * Deploy via Cloudflare Workers + Assets:
 *   - Build command : npm run build
 *   - Worker file   : dist/worker.js  (built automatically by "npm run build")
 *   - Assets dir    : dist/public
 *   - Deploy        : npx wrangler deploy
 *
 * Required environment variables (set in the Cloudflare dashboard):
 *   DATABASE_URL        — Neon PostgreSQL connection string
 *   ADMIN_PASSWORD      — Admin panel password
 *   PRIMARY_API_URL     — Primary movie API base URL (also in wrangler.toml [vars])
 *   BACKUP_API_URL      — Backup movie API base URL (also in wrangler.toml [vars])
 *   SESSION_SECRET      — Express session secret (optional)
 *   TELEGRAM_BOT_TOKEN  — Telegram bot token (optional)
 *   TELEGRAM_CHANNEL_ID — Telegram channel ID (also in wrangler.toml [vars])
 *   SITE_URL            — Public site URL (also in wrangler.toml [vars])
 */

import { createApp } from "./app";
import * as movieApi from "./movieApi";
import { storage } from "./storage";

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DATABASE_URL: string;
  ADMIN_PASSWORD: string;
  PRIMARY_API_URL: string;
  BACKUP_API_URL?: string;
  SESSION_SECRET?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHANNEL_ID?: string;
  SITE_URL?: string;
}

// Lazily-created Hono app (env changes between requests are not an issue in
// Workers since each Worker instance has a stable environment).
let _app: ReturnType<typeof createApp> | null = null;
// Track whether we have already loaded the active-API setting from the DB.
let _activeApiLoaded = false;

function getApp(): ReturnType<typeof createApp> {
  if (!_app) _app = createApp();
  return _app;
}

// Load the active API preference from the database once per Worker isolate so
// that whichever API the admin selected persists across cold starts.
async function ensureActiveApiLoaded(): Promise<void> {
  if (_activeApiLoaded) return;
  _activeApiLoaded = true;
  try {
    const setting = await storage.getSiteSetting("active_api");
    if (setting?.value === "primary" || setting?.value === "backup") {
      movieApi.setActiveApi(setting.value as "primary" | "backup");
    }
  } catch (err) {
    // Non-fatal — fall back to the default "primary" API.
    console.error("[worker] Failed to load active_api setting from DB:", err);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Inject Cloudflare bindings into process.env so the app can read them.
    // Use `!== undefined` (not just truthiness) so that we correctly skip only
    // truly-unset bindings while still allowing the downstream code to produce
    // its own meaningful error when a binding is explicitly set to an empty string.
    if (env.DATABASE_URL !== undefined) process.env.DATABASE_URL = env.DATABASE_URL;
    if (env.ADMIN_PASSWORD !== undefined) process.env.ADMIN_PASSWORD = env.ADMIN_PASSWORD;
    if (env.PRIMARY_API_URL !== undefined) process.env.PRIMARY_API_URL = env.PRIMARY_API_URL;
    if (env.BACKUP_API_URL !== undefined) process.env.BACKUP_API_URL = env.BACKUP_API_URL;
    if (env.SESSION_SECRET !== undefined) process.env.SESSION_SECRET = env.SESSION_SECRET;
    if (env.TELEGRAM_BOT_TOKEN !== undefined) process.env.TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
    if (env.TELEGRAM_CHANNEL_ID !== undefined) process.env.TELEGRAM_CHANNEL_ID = env.TELEGRAM_CHANNEL_ID;
    if (env.SITE_URL !== undefined) process.env.SITE_URL = env.SITE_URL;

    const url = new URL(request.url);

    // Route API requests through the Hono app
    if (url.pathname.startsWith("/api/")) {
      // Restore admin-selected API preference from the DB on first request.
      await ensureActiveApiLoaded();
      return getApp().fetch(request);
    }

    // All other requests (HTML pages, static assets) are served by Cloudflare Pages CDN
    return env.ASSETS.fetch(request);
  },
};
