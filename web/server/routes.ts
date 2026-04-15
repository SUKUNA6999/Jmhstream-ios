import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import * as movieApi from "./movieApi";
import * as telegramBot from "./telegramBot";

const ADMIN_SECRET = process.env.ADMIN_PASSWORD || "";

// ── Simple in-process rate limiter ──────────────────────────────────────────
// Keeps a sliding window counter per IP to prevent DDoS / brute-force attacks.
// Resets automatically; no external dependency required.
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_PUBLIC = 120;  // requests / minute for public API
const RATE_LIMIT_STREAM  = 30;  // requests / minute for stream/proxy (heavier endpoints)

// Periodically purge expired buckets to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets) {
    if (now > bucket.resetAt) rateLimitBuckets.delete(key);
  }
}, 5 * 60_000);

function getClientIp(req: any): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key) ?? { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_WINDOW_MS;
  }
  bucket.count++;
  rateLimitBuckets.set(key, bucket);
  return bucket.count <= limit;
}

/** Middleware: rate-limit public (non-admin) API routes. */
function publicRateLimit(req: any, res: any, next: any) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`pub:${ip}`, RATE_LIMIT_PUBLIC)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }
  next();
}

/** Middleware: stricter rate limit for stream / proxy routes. */
function streamRateLimit(req: any, res: any, next: any) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`stream:${ip}`, RATE_LIMIT_STREAM)) {
    return res.status(429).json({ error: "Too many stream requests. Please wait a moment." });
  }
  next();
}

function adminAuth(req: any, res: any, next: any) {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Apply rate limiting globally to all /api/* public routes
  app.use("/api/home", publicRateLimit);
  app.use("/api/search", publicRateLimit);
  app.use("/api/trending", publicRateLimit);
  app.use("/api/hot", publicRateLimit);
  app.use("/api/popular-search", publicRateLimit);
  app.use("/api/search-suggest", publicRateLimit);
  app.use("/api/recommend", publicRateLimit);
  app.use("/api/movie-info", publicRateLimit);
  app.use("/api/stream", streamRateLimit);
  app.use("/api/proxy-sub", streamRateLimit);
  app.use("/api/proxy", streamRateLimit);
  app.use("/api/video-proxy", streamRateLimit);
  app.use("/api/public", publicRateLimit);
  app.use("/api/watchlist", publicRateLimit);
  app.use("/api/report", publicRateLimit);

  // ---- MOVIE API PROXY ----
  // New API endpoints using the new API structure
  app.get("/api/home", async (req, res) => {
    try {
      const data = await movieApi.getHomepage();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const { keyword, q, page, perPage } = req.query as any;
      const query = keyword || q || "";
      const data = await movieApi.search(query, Number(page) || 1, Number(perPage) || 24);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/trending", async (req, res) => {
    try {
      const { page, perPage } = req.query as any;
      const data = await movieApi.getTrending(Number(page) || 1, Number(perPage) || 24);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/hot", async (req, res) => {
    try {
      const data = await movieApi.getHot();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/popular-search", async (req, res) => {
    try {
      const data = await movieApi.getPopularSearch();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/search-suggest", async (req, res) => {
    try {
      const { keyword, perPage } = req.query as any;
      const data = await movieApi.getSearchSuggest(keyword || "", Number(perPage) || 8);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/recommend", async (req, res) => {
    try {
      const { subjectId, page, perPage } = req.query as any;
      const data = await movieApi.getRecommend(subjectId, Number(page) || 1, Number(perPage) || 20);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/movie-info", async (req, res) => {
    try {
      const { subjectId } = req.query as any;
      const data = await movieApi.getMovieInfo(subjectId);
      const title = data?.data?.subject?.title || data?.subject?.title || "Unknown";
      storage.recordAnalyticsEvent("view", subjectId, title, req.headers["x-session-id"] as string).catch(() => {});
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/stream", async (req, res) => {
    try {
      const { subjectId, season, episode } = req.query as any;
      const data = await movieApi.getSources(subjectId, season, episode);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/proxy-sub", async (req, res) => {
    try {
      const { url } = req.query as { url: string };
      if (!url) return res.status(400).json({ error: "url required" });
      const upstream = await fetch(url);
      const text = await upstream.text();
      res.setHeader("Content-Type", "text/vtt; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      // Convert SRT to VTT if needed
      if (text.trim().startsWith("1") || text.includes("-->")) {
        const vtt = "WEBVTT\n\n" + text
          .replace(/\r\n/g, "\n")
          .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
        res.send(vtt);
      } else {
        res.send(text);
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/proxy/:encodedUrl", async (req, res) => {
    try {
      const { encodedUrl } = req.params;
      const proxyUrl = `${process.env.PRIMARY_API_URL}/api/proxy/${encodedUrl}`;
      const upstream = await fetch(proxyUrl);
      const contentType = upstream.headers.get("content-type") || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.send(buffer);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Video streaming proxy with Range request support (enables seeking)
  app.get("/api/video-proxy", async (req, res) => {
    try {
      const { url, download, filename } = req.query as { url: string; download?: string; filename?: string };
      if (!url) return res.status(400).send("url required");

      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": `${process.env.PRIMARY_API_URL}/`,
        "Origin": process.env.PRIMARY_API_URL || "",
      };
      if (req.headers.range) headers["Range"] = req.headers.range;

      const upstream = await fetch(url, { headers });

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Range");
      res.setHeader("Accept-Ranges", "bytes");

      const contentType = upstream.headers.get("content-type") || "video/mp4";
      const contentLength = upstream.headers.get("content-length");
      const contentRange = upstream.headers.get("content-range");

      res.setHeader("Content-Type", contentType);
      if (contentLength) res.setHeader("Content-Length", contentLength);
      if (contentRange) res.setHeader("Content-Range", contentRange);

      // When download=1 is passed, set Content-Disposition to trigger browser download
      if (download === "1") {
        const safeName = (filename || "movie").replace(/[^a-zA-Z0-9_\- ]/g, "_").substring(0, 200);
        res.setHeader("Content-Disposition", `attachment; filename="${safeName}.mp4"`);
      }

      res.status(upstream.status);

      if (!upstream.body) return res.end();
      const { Readable } = await import("stream");
      const readable = Readable.fromWeb(upstream.body as any);
      readable.pipe(res);
      req.on("close", () => readable.destroy());
    } catch (e: any) {
      if (!res.headersSent) res.status(500).json({ error: e.message });
    }
  });

  // ---- PUBLIC ENDPOINTS ----
  app.get("/api/public/notifications", async (req, res) => {
    const items = await storage.getNotifications();
    res.json(items.filter(n => n.isActive));
  });

  app.get("/api/public/announcements", async (req, res) => {
    const items = await storage.getAnnouncements();
    res.json(items.filter(a => a.isActive));
  });

  app.get("/api/public/broadcast", async (req, res) => {
    const msg = await storage.getActiveBroadcastMessage();
    res.json(msg || null);
  });

  app.get("/api/public/site-settings", async (req, res) => {
    const settings = await storage.getSiteSettings();
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value; });
    res.json(map);
  });

  app.get("/api/public/featured", async (req, res) => {
    const items = await storage.getFeaturedContent();
    res.json(items.filter(f => f.isActive));
  });

  // Watchlist (session-based)
  app.get("/api/watchlist", async (req, res) => {
    const sessionId = req.headers["x-session-id"] as string;
    if (!sessionId) return res.json([]);
    const items = await storage.getWatchlistItems(sessionId);
    res.json(items);
  });

  app.post("/api/watchlist", async (req, res) => {
    const sessionId = req.headers["x-session-id"] as string;
    if (!sessionId) return res.status(400).json({ error: "No session" });
    const { subjectId, title, posterUrl, type } = req.body;
    const item = await storage.addToWatchlist({ sessionId, subjectId, title, posterUrl: posterUrl || null, type: type || "movie" });
    res.json(item);
  });

  app.delete("/api/watchlist/:subjectId", async (req, res) => {
    const sessionId = req.headers["x-session-id"] as string;
    if (!sessionId) return res.status(400).json({ error: "No session" });
    await storage.removeFromWatchlist(sessionId, req.params.subjectId);
    res.json({ success: true });
  });

  // Report content
  app.post("/api/report", async (req, res) => {
    const { subjectId, title, reason } = req.body;
    if (!subjectId || !title || !reason) return res.status(400).json({ error: "Missing fields" });
    const report = await storage.createContentReport({ subjectId, title, reason });
    res.json(report);
  });

  // ---- ADMIN AUTH ----
  app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_SECRET) {
      res.json({ token: ADMIN_SECRET, success: true });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  // ---- ADMIN PROTECTED ROUTES ----
  app.get("/api/admin/stats", adminAuth, async (req, res) => {
    const analytics = await storage.getAnalyticsStats();
    const notifications = await storage.getNotifications();
    const announcements = await storage.getAnnouncements();
    const reports = await storage.getContentReports();
    const watchlist = await storage.getAllWatchlistItems();
    res.json({
      analytics,
      totalNotifications: notifications.length,
      totalAnnouncements: announcements.length,
      pendingReports: reports.filter(r => r.status === "pending").length,
      totalWatchlistItems: watchlist.length,
    });
  });

  app.get("/api/admin/notifications", adminAuth, async (req, res) => {
    res.json(await storage.getNotifications());
  });
  app.post("/api/admin/notifications", adminAuth, async (req, res) => {
    const item = await storage.createNotification(req.body);
    await storage.createAdminLog("create_notification", `Created: ${item.title}`);
    res.json(item);
  });
  app.patch("/api/admin/notifications/:id", adminAuth, async (req, res) => {
    const item = await storage.updateNotification(req.params.id, req.body);
    res.json(item);
  });
  app.delete("/api/admin/notifications/:id", adminAuth, async (req, res) => {
    await storage.deleteNotification(req.params.id);
    await storage.createAdminLog("delete_notification", `Deleted ID: ${req.params.id}`);
    res.json({ success: true });
  });

  app.get("/api/admin/announcements", adminAuth, async (req, res) => {
    res.json(await storage.getAnnouncements());
  });
  app.post("/api/admin/announcements", adminAuth, async (req, res) => {
    const item = await storage.createAnnouncement(req.body);
    await storage.createAdminLog("create_announcement", `Created: ${item.title}`);
    res.json(item);
  });
  app.patch("/api/admin/announcements/:id", adminAuth, async (req, res) => {
    const item = await storage.updateAnnouncement(req.params.id, req.body);
    res.json(item);
  });
  app.delete("/api/admin/announcements/:id", adminAuth, async (req, res) => {
    await storage.deleteAnnouncement(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/site-settings", adminAuth, async (req, res) => {
    const settings = await storage.getSiteSettings();
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value; });
    res.json(map);
  });
  app.post("/api/admin/site-settings", adminAuth, async (req, res) => {
    const { key, value } = req.body;
    const item = await storage.upsertSiteSetting(key, value);
    await storage.createAdminLog("update_setting", `Updated ${key}`);
    res.json(item);
  });

  app.get("/api/admin/logs", adminAuth, async (req, res) => {
    res.json(await storage.getAdminLogs(200));
  });

  app.get("/api/admin/featured", adminAuth, async (req, res) => {
    res.json(await storage.getFeaturedContent());
  });
  app.post("/api/admin/featured", adminAuth, async (req, res) => {
    const item = await storage.createFeaturedContent(req.body);
    await storage.createAdminLog("create_featured", `Added: ${item.title}`);
    res.json(item);
  });
  app.patch("/api/admin/featured/:id", adminAuth, async (req, res) => {
    const item = await storage.updateFeaturedContent(req.params.id, req.body);
    res.json(item);
  });
  app.delete("/api/admin/featured/:id", adminAuth, async (req, res) => {
    await storage.deleteFeaturedContent(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/reports", adminAuth, async (req, res) => {
    res.json(await storage.getContentReports());
  });
  app.patch("/api/admin/reports/:id", adminAuth, async (req, res) => {
    const item = await storage.updateContentReportStatus(req.params.id, req.body.status);
    res.json(item);
  });

  app.get("/api/admin/watchlist", adminAuth, async (req, res) => {
    res.json(await storage.getAllWatchlistItems());
  });

  app.get("/api/admin/analytics", adminAuth, async (req, res) => {
    res.json(await storage.getAnalyticsStats());
  });

  app.get("/api/admin/broadcast", adminAuth, async (req, res) => {
    res.json(await storage.getBroadcastMessages());
  });
  app.post("/api/admin/broadcast", adminAuth, async (req, res) => {
    const item = await storage.createBroadcastMessage(req.body);
    await storage.createAdminLog("create_broadcast", `Created broadcast: ${item.message.substring(0, 50)}`);
    res.json(item);
  });
  app.patch("/api/admin/broadcast/:id", adminAuth, async (req, res) => {
    const item = await storage.updateBroadcastMessage(req.params.id, req.body);
    res.json(item);
  });
  app.delete("/api/admin/broadcast/:id", adminAuth, async (req, res) => {
    await storage.deleteBroadcastMessage(req.params.id);
    res.json({ success: true });
  });

  // ---- API KEYS MANAGEMENT (Admin) ----
  app.get("/api/admin/api-keys", adminAuth, async (req, res) => {
    res.json(await storage.getApiKeys());
  });

  app.post("/api/admin/api-keys", adminAuth, async (req, res) => {
    const { name, domain, rateLimit } = req.body;
    if (!name || !domain) return res.status(400).json({ error: "name and domain required" });
    const key = crypto.randomBytes(32).toString("hex");
    const item = await storage.createApiKey({ key, name, domain, isActive: true, rateLimit: rateLimit || 1000 });
    await storage.createAdminLog("create_api_key", `Created API key: ${name} for ${domain}`);
    res.json(item);
  });

  app.patch("/api/admin/api-keys/:id", adminAuth, async (req, res) => {
    const item = await storage.updateApiKey(req.params.id, req.body);
    res.json(item);
  });

  app.delete("/api/admin/api-keys/:id", adminAuth, async (req, res) => {
    await storage.deleteApiKey(req.params.id);
    await storage.createAdminLog("delete_api_key", `Deleted API key: ${req.params.id}`);
    res.json({ success: true });
  });

  // ---- API CONFIGURATION (Admin) ----
  app.get("/api/admin/api-config", adminAuth, async (req, res) => {
    const setting = await storage.getSiteSetting("active_api");
    const activeApi = (setting?.value as "primary" | "backup") || "primary";
    movieApi.setActiveApi(activeApi);
    res.json(movieApi.getActiveApi());
  });

  app.post("/api/admin/api-config", adminAuth, async (req, res) => {
    const { active } = req.body;
    if (active !== "primary" && active !== "backup") {
      return res.status(400).json({ error: "active must be 'primary' or 'backup'" });
    }
    await storage.upsertSiteSetting("active_api", active);
    movieApi.setActiveApi(active);
    await storage.createAdminLog("switch_api", `Switched to ${active} API`);
    res.json(movieApi.getActiveApi());
  });

  // ---- PUBLIC API v1 (requires API key + domain) ----
  async function apiKeyAuth(req: any, res: any, next: any) {
    const key = (req.query.api_key || req.headers["x-api-key"]) as string;
    if (!key) return res.status(401).json({ error: "API key required. Pass api_key query param or x-api-key header." });

    const apiKey = await storage.getApiKeyByKey(key);
    if (!apiKey) return res.status(401).json({ error: "Invalid API key" });
    if (!apiKey.isActive) return res.status(403).json({ error: "API key is disabled" });

    if (apiKey.requestCount >= apiKey.rateLimit) {
      return res.status(429).json({ error: "Rate limit exceeded" });
    }

    const origin = (req.headers.origin || req.headers.referer || "") as string;
    const allowedDomain = apiKey.domain;
    let originHost = "";
    try {
      originHost = new URL(origin).hostname;
    } catch { originHost = ""; }
    if (allowedDomain !== "*" && originHost !== allowedDomain && !originHost.endsWith("." + allowedDomain)) {
      return res.status(403).json({ error: `Domain not allowed. This key is restricted to ${allowedDomain}` });
    }

    storage.incrementApiKeyUsage(apiKey.id).catch(() => {});
    req.apiKey = apiKey;
    next();
  }

  const apiAds = {
    popunder: { script: "https://pl28839963.effectivegatecpm.com/2a/9c/e9/2a9ce92a5bb7aecad9f16cc3717321c3.js", type: "popunder" },
    socialBar: { script: "https://pl28869840.effectivegatecpm.com/67/34/9e/67349e44e64311c2f738180ddbfb9e22.js", type: "social_bar" },
    banner: { key: "7b89fe7affab890d77d4f1fd620bc9d7", format: "iframe", width: 320, height: 50, invoke: "https://www.highperformanceformat.com/7b89fe7affab890d77d4f1fd620bc9d7/invoke.js", type: "banner" },
    attribution: "Powered by JMH STREAM - https://jmhstream.online",
  };

  app.get("/api/v1/search", apiKeyAuth, async (req: any, res) => {
    try {
      const { q, page, perPage } = req.query;
      const data = await movieApi.search(q || "", Number(page) || 1, Number(perPage) || 24);
      res.json({ status: "success", data: data?.data || data, ads: apiAds });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/info/:id", apiKeyAuth, async (req: any, res) => {
    try {
      const data = await movieApi.getMovieInfo(req.params.id);
      res.json({ status: "success", data: data?.data || data, ads: apiAds });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/sources/:id", apiKeyAuth, async (req: any, res) => {
    try {
      const { season, episode } = req.query;
      const data = await movieApi.getSources(req.params.id, season as string, episode as string);
      res.json({ status: "success", data: data?.data || data, ads: apiAds });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/trending", apiKeyAuth, async (req: any, res) => {
    try {
      const data = await movieApi.getTrending(Number(req.query.page) || 1, Number(req.query.perPage) || 24);
      res.json({ status: "success", data: data?.data || data, ads: apiAds });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/homepage", apiKeyAuth, async (req: any, res) => {
    try {
      const data = await movieApi.getHomepage();
      res.json({ status: "success", data: data?.data || data, ads: apiAds });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---- APP KEYS (Mobile App Authentication) ----
  async function appKeyAuth(req: any, res: any, next: any) {
    const key = (req.query.app_key || req.headers["x-app-key"]) as string;
    const packageName = req.headers["x-app-package"] as string;
    const signature = req.headers["x-app-signature"] as string;

    if (!key) return res.status(401).json({ error: "App key required" });
    if (!packageName) return res.status(401).json({ error: "App package name required" });
    if (!signature) return res.status(401).json({ error: "App signature required" });

    const appKey = await storage.getAppKeyByKey(key);
    if (!appKey) return res.status(401).json({ error: "Invalid app key" });
    if (!appKey.isActive) return res.status(403).json({ error: "App key is disabled" });

    if (appKey.packageName !== packageName) {
      return res.status(403).json({ error: "Package name mismatch — this key is not authorized for this app" });
    }
    if (appKey.signatureHash !== signature) {
      return res.status(403).json({ error: "Signature mismatch — this key is not authorized for this build" });
    }

    if (appKey.requestCount >= appKey.rateLimit) {
      return res.status(429).json({ error: "Rate limit exceeded for this app key" });
    }

    await storage.incrementAppKeyUsage(appKey.id);
    req.appKey = appKey;
    next();
  }

  app.get("/api/admin/app-keys", adminAuth, async (req, res) => {
    const keys = await storage.getAppKeys();
    res.json(keys);
  });

  app.post("/api/admin/app-keys", adminAuth, async (req, res) => {
    try {
      const { name, packageName, signatureHash, rateLimit } = req.body;
      if (!name || !packageName || !signatureHash) {
        return res.status(400).json({ error: "name, packageName and signatureHash are required" });
      }
      const key = `jmh_app_${crypto.randomBytes(32).toString("hex")}`;
      const appKey = await storage.createAppKey({
        key, name, packageName, signatureHash,
        isActive: true,
        rateLimit: rateLimit || 5000,
      });
      await storage.createAdminLog("create_app_key", `Created app key: ${name} (${packageName})`);
      res.json(appKey);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/app-keys/:id", adminAuth, async (req, res) => {
    const updated = await storage.updateAppKey(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/admin/app-keys/:id", adminAuth, async (req, res) => {
    await storage.deleteAppKey(req.params.id);
    await storage.createAdminLog("delete_app_key", `Deleted app key: ${req.params.id}`);
    res.json({ success: true });
  });

  app.get("/api/app/home", appKeyAuth, async (req: any, res) => {
    try { res.json(await movieApi.getHomepage()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/app/search", appKeyAuth, async (req: any, res) => {
    try {
      const { keyword, q, page, perPage } = req.query as any;
      res.json(await movieApi.search(keyword || q || "", Number(page) || 1, Number(perPage) || 24));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/app/info/:id", appKeyAuth, async (req: any, res) => {
    try { res.json(await movieApi.getMovieInfo(req.params.id)); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/app/sources/:id", appKeyAuth, async (req: any, res) => {
    try {
      const { season, episode } = req.query as any;
      res.json(await movieApi.getSources(req.params.id, season, episode));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/app/trending", appKeyAuth, async (req: any, res) => {
    try {
      const { page, perPage } = req.query as any;
      res.json(await movieApi.getTrending(Number(page) || 1, Number(perPage) || 24));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ---- ANALYTICS CHART DATA ----
  app.get("/api/admin/analytics-chart", adminAuth, async (req, res) => {
    try {
      const stats = await storage.getAnalyticsStats();
      const logs = await storage.getAdminLogs(50);
      res.json({ stats, recentLogs: logs });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---- TELEGRAM BOT ----
  app.get("/api/admin/telegram-config", adminAuth, async (req, res) => {
    try {
      const config = await telegramBot.getTelegramConfig();
      res.json(config);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/telegram-config", adminAuth, async (req, res) => {
    try {
      const { botToken, channelId, postsPerDay, autoPost } = req.body;
      await telegramBot.saveTelegramConfig({ botToken, channelId, postsPerDay, autoPost });
      await storage.createAdminLog("telegram_config", "Updated Telegram bot configuration");
      if (autoPost === true) {
        telegramBot.startTelegramScheduler().catch(() => {});
      } else if (autoPost === false) {
        telegramBot.stopTelegramScheduler();
      }
      const config = await telegramBot.getTelegramConfig();
      res.json(config);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/telegram-test", adminAuth, async (req, res) => {
    try {
      const result = await telegramBot.sendTestPost();
      if (result.ok) {
        await storage.createAdminLog("telegram_test", "Sent test post to Telegram");
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/telegram-trigger", adminAuth, async (req, res) => {
    try {
      await storage.createAdminLog("telegram_trigger", "Manually triggered daily Telegram posts");
      res.json({ ok: true, message: "Daily posts triggered - running in background" });
      telegramBot.runDailyPosts().catch(err => console.error("[Telegram] Manual trigger error:", err));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Load active API setting on startup
  storage.getSiteSetting("active_api").then(setting => {
    if (setting?.value === "primary" || setting?.value === "backup") {
      movieApi.setActiveApi(setting.value);
    }
  }).catch(() => {});

  // Start Telegram scheduler
  telegramBot.startTelegramScheduler().catch(err => console.error("[Telegram] Scheduler error:", err));

  return httpServer;
}
