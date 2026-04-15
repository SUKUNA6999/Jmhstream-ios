import { Hono } from "hono";
import { cors } from "hono/cors";
import { storage } from "./storage";
import * as movieApi from "./movieApi";
import * as telegramBot from "./telegramBot";

// Works in Cloudflare Workers (Web Crypto) AND Node.js 19+ (globalThis.crypto)
function generateHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

// Read admin secret dynamically on every request so that Cloudflare Workers
// environment variable injection (which happens per-request in worker.ts)
// is always picked up correctly.
function getAdminSecret(): string {
  return process.env.ADMIN_PASSWORD || "";
}

// Admin auth middleware
const adminAuth = async (c: any, next: any) => {
  const secret = getAdminSecret();
  const token = c.req.header("x-admin-token");
  if (!secret || token !== secret) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
};

// API key auth middleware
const apiKeyAuth = async (c: any, next: any) => {
  const key = (c.req.query("api_key") || c.req.header("x-api-key")) as string;
  if (!key) {
    return c.json({ error: "API key required. Pass api_key query param or x-api-key header." }, 401);
  }
  const apiKey = await storage.getApiKeyByKey(key);
  if (!apiKey) return c.json({ error: "Invalid API key" }, 401);
  if (!apiKey.isActive) return c.json({ error: "API key is disabled" }, 403);
  if (apiKey.requestCount >= apiKey.rateLimit) {
    return c.json({ error: "Rate limit exceeded" }, 429);
  }
  const origin = (c.req.header("origin") || c.req.header("referer") || "") as string;
  const allowedDomain = apiKey.domain;
  let originHost = "";
  try { originHost = new URL(origin).hostname; } catch { originHost = ""; }
  if (allowedDomain !== "*" && originHost !== allowedDomain && !originHost.endsWith("." + allowedDomain)) {
    return c.json({ error: `Domain not allowed. This key is restricted to ${allowedDomain}` }, 403);
  }
  storage.incrementApiKeyUsage(apiKey.id).catch(() => {});
  c.set("apiKey", apiKey);
  return next();
};

// App key auth middleware
const appKeyAuth = async (c: any, next: any) => {
  const key = (c.req.query("app_key") || c.req.header("x-app-key")) as string;
  const packageName = c.req.header("x-app-package") as string;
  const signature = c.req.header("x-app-signature") as string;
  if (!key) return c.json({ error: "App key required" }, 401);
  if (!packageName) return c.json({ error: "App package name required" }, 401);
  if (!signature) return c.json({ error: "App signature required" }, 401);
  const appKey = await storage.getAppKeyByKey(key);
  if (!appKey) return c.json({ error: "Invalid app key" }, 401);
  if (!appKey.isActive) return c.json({ error: "App key is disabled" }, 403);
  if (appKey.packageName !== packageName) {
    return c.json({ error: "Package name mismatch — this key is not authorized for this app" }, 403);
  }
  if (appKey.signatureHash !== signature) {
    return c.json({ error: "Signature mismatch — this key is not authorized for this build" }, 403);
  }
  if (appKey.requestCount >= appKey.rateLimit) {
    return c.json({ error: "Rate limit exceeded for this app key" }, 429);
  }
  await storage.incrementAppKeyUsage(appKey.id);
  c.set("appKey", appKey);
  return next();
};

const apiAds = {
  popunder: { script: "https://pl28839963.effectivegatecpm.com/2a/9c/e9/2a9ce92a5bb7aecad9f16cc3717321c3.js", type: "popunder" },
  socialBar: { script: "https://pl28869840.effectivegatecpm.com/67/34/9e/67349e44e64311c2f738180ddbfb9e22.js", type: "social_bar" },
  banner: { key: "7b89fe7affab890d77d4f1fd620bc9d7", format: "iframe", width: 320, height: 50, invoke: "https://www.highperformanceformat.com/7b89fe7affab890d77d4f1fd620bc9d7/invoke.js", type: "banner" },
  attribution: "Powered by JMH STREAM - https://jmhstream.online",
};

export function createApp() {
  const app = new Hono();

  app.use("*", cors());

  // ---- MOVIE API PROXY ----
  app.get("/api/home", async (c) => {
    try { return c.json(await movieApi.getHomepage()); }
    catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  app.get("/api/search", async (c) => {
    try {
      const keyword = c.req.query("keyword") || c.req.query("q") || "";
      const page = Number(c.req.query("page")) || 1;
      const perPage = Number(c.req.query("perPage")) || 24;
      return c.json(await movieApi.search(keyword, page, perPage));
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  app.get("/api/trending", async (c) => {
    try {
      const page = Number(c.req.query("page")) || 1;
      const perPage = Number(c.req.query("perPage")) || 24;
      return c.json(await movieApi.getTrending(page, perPage));
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  app.get("/api/hot", async (c) => {
    try { return c.json(await movieApi.getHot()); }
    catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  app.get("/api/popular-search", async (c) => {
    try { return c.json(await movieApi.getPopularSearch()); }
    catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  app.get("/api/search-suggest", async (c) => {
    try {
      const keyword = c.req.query("keyword") || "";
      const perPage = Number(c.req.query("perPage")) || 8;
      return c.json(await movieApi.getSearchSuggest(keyword, perPage));
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  app.get("/api/recommend", async (c) => {
    try {
      const subjectId = c.req.query("subjectId") || "";
      const page = Number(c.req.query("page")) || 1;
      const perPage = Number(c.req.query("perPage")) || 20;
      return c.json(await movieApi.getRecommend(subjectId, page, perPage));
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  app.get("/api/movie-info", async (c) => {
    try {
      const subjectId = c.req.query("subjectId") || "";
      const data = await movieApi.getMovieInfo(subjectId);
      const title = (data as any)?.data?.subject?.title || (data as any)?.subject?.title || "Unknown";
      storage.recordAnalyticsEvent("view", subjectId, title, c.req.header("x-session-id")).catch(() => {});
      return c.json(data);
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  app.get("/api/stream", async (c) => {
    try {
      const subjectId = c.req.query("subjectId") || "";
      const season = c.req.query("season");
      const episode = c.req.query("episode");
      return c.json(await movieApi.getSources(subjectId, season, episode));
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  app.get("/api/proxy-sub", async (c) => {
    try {
      const url = c.req.query("url");
      if (!url) return c.json({ error: "url required" }, 400);
      const upstream = await fetch(url);
      const text = await upstream.text();
      let vttContent: string;
      if (text.trim().startsWith("1") || text.includes("-->")) {
        vttContent = "WEBVTT\n\n" + text
          .replace(/\r\n/g, "\n")
          .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
      } else {
        vttContent = text;
      }
      return new Response(vttContent, {
        headers: {
          "Content-Type": "text/vtt; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  app.get("/api/proxy/:encodedUrl", async (c) => {
    try {
      const encodedUrl = c.req.param("encodedUrl");
      const proxyUrl = `${process.env.PRIMARY_API_URL}/api/proxy/${encodedUrl}`;
      const upstream = await fetch(proxyUrl);
      const contentType = upstream.headers.get("content-type") || "application/octet-stream";
      const buffer = await upstream.arrayBuffer();
      return new Response(buffer, { headers: { "Content-Type": contentType } });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  // Video streaming proxy with Range request support
  app.get("/api/video-proxy", async (c) => {
    try {
      const url = c.req.query("url");
      if (!url) return c.text("url required", 400);
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": `${process.env.PRIMARY_API_URL}/`,
        "Origin": process.env.PRIMARY_API_URL || "",
      };
      const range = c.req.header("range");
      if (range) headers["Range"] = range;
      const upstream = await fetch(url, { headers });
      const responseHeaders: Record<string, string> = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Range",
        "Accept-Ranges": "bytes",
        "Content-Type": upstream.headers.get("content-type") || "video/mp4",
      };
      const contentLength = upstream.headers.get("content-length");
      const contentRange = upstream.headers.get("content-range");
      if (contentLength) responseHeaders["Content-Length"] = contentLength;
      if (contentRange) responseHeaders["Content-Range"] = contentRange;
      return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  // ---- PUBLIC ENDPOINTS ----
  app.get("/api/public/notifications", async (c) => {
    const items = await storage.getNotifications();
    return c.json(items.filter(n => n.isActive));
  });

  app.get("/api/public/announcements", async (c) => {
    const items = await storage.getAnnouncements();
    return c.json(items.filter(a => a.isActive));
  });

  app.get("/api/public/broadcast", async (c) => {
    const msg = await storage.getActiveBroadcastMessage();
    return c.json(msg || null);
  });

  app.get("/api/public/site-settings", async (c) => {
    const settings = await storage.getSiteSettings();
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value; });
    return c.json(map);
  });

  app.get("/api/public/featured", async (c) => {
    const items = await storage.getFeaturedContent();
    return c.json(items.filter(f => f.isActive));
  });

  // Watchlist (session-based)
  app.get("/api/watchlist", async (c) => {
    const sessionId = c.req.header("x-session-id") || "";
    if (!sessionId) return c.json([]);
    return c.json(await storage.getWatchlistItems(sessionId));
  });

  app.post("/api/watchlist", async (c) => {
    const sessionId = c.req.header("x-session-id") || "";
    if (!sessionId) return c.json({ error: "No session" }, 400);
    const { subjectId, title, posterUrl, type } = await c.req.json();
    const item = await storage.addToWatchlist({ sessionId, subjectId, title, posterUrl: posterUrl || null, type: type || "movie" });
    return c.json(item);
  });

  app.delete("/api/watchlist/:subjectId", async (c) => {
    const sessionId = c.req.header("x-session-id") || "";
    if (!sessionId) return c.json({ error: "No session" }, 400);
    await storage.removeFromWatchlist(sessionId, c.req.param("subjectId"));
    return c.json({ success: true });
  });

  app.post("/api/report", async (c) => {
    const { subjectId, title, reason } = await c.req.json();
    if (!subjectId || !title || !reason) return c.json({ error: "Missing fields" }, 400);
    return c.json(await storage.createContentReport({ subjectId, title, reason }));
  });

  // ---- ADMIN AUTH ----
  app.post("/api/admin/login", async (c) => {
    const secret = getAdminSecret();
    if (!secret) {
      return c.json({ error: "Admin panel is not configured (ADMIN_PASSWORD not set)" }, 503);
    }
    const { password } = await c.req.json();
    if (password === secret) {
      return c.json({ token: secret, success: true });
    }
    return c.json({ error: "Invalid password" }, 401);
  });

  // ---- ADMIN PROTECTED ROUTES ----
  app.get("/api/admin/stats", adminAuth, async (c) => {
    const [analytics, notifications, announcements, reports, watchlist] = await Promise.all([
      storage.getAnalyticsStats(),
      storage.getNotifications(),
      storage.getAnnouncements(),
      storage.getContentReports(),
      storage.getAllWatchlistItems(),
    ]);
    return c.json({
      analytics,
      totalNotifications: notifications.length,
      totalAnnouncements: announcements.length,
      pendingReports: reports.filter(r => r.status === "pending").length,
      totalWatchlistItems: watchlist.length,
    });
  });

  app.get("/api/admin/notifications", adminAuth, async (c) => c.json(await storage.getNotifications()));
  app.post("/api/admin/notifications", adminAuth, async (c) => {
    const item = await storage.createNotification(await c.req.json());
    await storage.createAdminLog("create_notification", `Created: ${item.title}`);
    return c.json(item);
  });
  app.patch("/api/admin/notifications/:id", adminAuth, async (c) => {
    return c.json(await storage.updateNotification(c.req.param("id"), await c.req.json()));
  });
  app.delete("/api/admin/notifications/:id", adminAuth, async (c) => {
    await storage.deleteNotification(c.req.param("id"));
    await storage.createAdminLog("delete_notification", `Deleted ID: ${c.req.param("id")}`);
    return c.json({ success: true });
  });

  app.get("/api/admin/announcements", adminAuth, async (c) => c.json(await storage.getAnnouncements()));
  app.post("/api/admin/announcements", adminAuth, async (c) => {
    const item = await storage.createAnnouncement(await c.req.json());
    await storage.createAdminLog("create_announcement", `Created: ${item.title}`);
    return c.json(item);
  });
  app.patch("/api/admin/announcements/:id", adminAuth, async (c) => {
    return c.json(await storage.updateAnnouncement(c.req.param("id"), await c.req.json()));
  });
  app.delete("/api/admin/announcements/:id", adminAuth, async (c) => {
    await storage.deleteAnnouncement(c.req.param("id"));
    return c.json({ success: true });
  });

  app.get("/api/admin/site-settings", adminAuth, async (c) => {
    const settings = await storage.getSiteSettings();
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value; });
    return c.json(map);
  });
  app.post("/api/admin/site-settings", adminAuth, async (c) => {
    const { key, value } = await c.req.json();
    const item = await storage.upsertSiteSetting(key, value);
    await storage.createAdminLog("update_setting", `Updated ${key}`);
    return c.json(item);
  });

  app.get("/api/admin/logs", adminAuth, async (c) => c.json(await storage.getAdminLogs(200)));

  app.get("/api/admin/featured", adminAuth, async (c) => c.json(await storage.getFeaturedContent()));
  app.post("/api/admin/featured", adminAuth, async (c) => {
    const item = await storage.createFeaturedContent(await c.req.json());
    await storage.createAdminLog("create_featured", `Added: ${item.title}`);
    return c.json(item);
  });
  app.patch("/api/admin/featured/:id", adminAuth, async (c) => {
    return c.json(await storage.updateFeaturedContent(c.req.param("id"), await c.req.json()));
  });
  app.delete("/api/admin/featured/:id", adminAuth, async (c) => {
    await storage.deleteFeaturedContent(c.req.param("id"));
    return c.json({ success: true });
  });

  app.get("/api/admin/reports", adminAuth, async (c) => c.json(await storage.getContentReports()));
  app.patch("/api/admin/reports/:id", adminAuth, async (c) => {
    const { status } = await c.req.json();
    return c.json(await storage.updateContentReportStatus(c.req.param("id"), status));
  });

  app.get("/api/admin/watchlist", adminAuth, async (c) => c.json(await storage.getAllWatchlistItems()));
  app.get("/api/admin/analytics", adminAuth, async (c) => c.json(await storage.getAnalyticsStats()));

  app.get("/api/admin/broadcast", adminAuth, async (c) => c.json(await storage.getBroadcastMessages()));
  app.post("/api/admin/broadcast", adminAuth, async (c) => {
    const item = await storage.createBroadcastMessage(await c.req.json());
    await storage.createAdminLog("create_broadcast", `Created broadcast: ${item.message.substring(0, 50)}`);
    return c.json(item);
  });
  app.patch("/api/admin/broadcast/:id", adminAuth, async (c) => {
    return c.json(await storage.updateBroadcastMessage(c.req.param("id"), await c.req.json()));
  });
  app.delete("/api/admin/broadcast/:id", adminAuth, async (c) => {
    await storage.deleteBroadcastMessage(c.req.param("id"));
    return c.json({ success: true });
  });

  // ---- API KEYS MANAGEMENT ----
  app.get("/api/admin/api-keys", adminAuth, async (c) => c.json(await storage.getApiKeys()));
  app.post("/api/admin/api-keys", adminAuth, async (c) => {
    const { name, domain, rateLimit } = await c.req.json();
    if (!name || !domain) return c.json({ error: "name and domain required" }, 400);
    const key = generateHex(32);
    const item = await storage.createApiKey({ key, name, domain, isActive: true, rateLimit: rateLimit || 1000 });
    await storage.createAdminLog("create_api_key", `Created API key: ${name} for ${domain}`);
    return c.json(item);
  });
  app.patch("/api/admin/api-keys/:id", adminAuth, async (c) => {
    return c.json(await storage.updateApiKey(c.req.param("id"), await c.req.json()));
  });
  app.delete("/api/admin/api-keys/:id", adminAuth, async (c) => {
    await storage.deleteApiKey(c.req.param("id"));
    await storage.createAdminLog("delete_api_key", `Deleted API key: ${c.req.param("id")}`);
    return c.json({ success: true });
  });

  // ---- API CONFIGURATION ----
  app.get("/api/admin/api-config", adminAuth, async (c) => {
    const setting = await storage.getSiteSetting("active_api");
    const activeApi = (setting?.value as "primary" | "backup") || "primary";
    movieApi.setActiveApi(activeApi);
    return c.json(movieApi.getActiveApi());
  });
  app.post("/api/admin/api-config", adminAuth, async (c) => {
    const { active } = await c.req.json();
    if (active !== "primary" && active !== "backup") {
      return c.json({ error: "active must be 'primary' or 'backup'" }, 400);
    }
    await storage.upsertSiteSetting("active_api", active);
    movieApi.setActiveApi(active);
    await storage.createAdminLog("switch_api", `Switched to ${active} API`);
    return c.json(movieApi.getActiveApi());
  });

  // ---- APP KEYS ----
  app.get("/api/admin/app-keys", adminAuth, async (c) => c.json(await storage.getAppKeys()));
  app.post("/api/admin/app-keys", adminAuth, async (c) => {
    try {
      const { name, packageName, signatureHash, rateLimit } = await c.req.json();
      if (!name || !packageName || !signatureHash) {
        return c.json({ error: "name, packageName and signatureHash are required" }, 400);
      }
      const key = `jmh_app_${generateHex(32)}`;
      const appKey = await storage.createAppKey({ key, name, packageName, signatureHash, isActive: true, rateLimit: rateLimit || 5000 });
      await storage.createAdminLog("create_app_key", `Created app key: ${name} (${packageName})`);
      return c.json(appKey);
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });
  app.patch("/api/admin/app-keys/:id", adminAuth, async (c) => {
    const updated = await storage.updateAppKey(c.req.param("id"), await c.req.json());
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  });
  app.delete("/api/admin/app-keys/:id", adminAuth, async (c) => {
    await storage.deleteAppKey(c.req.param("id"));
    await storage.createAdminLog("delete_app_key", `Deleted app key: ${c.req.param("id")}`);
    return c.json({ success: true });
  });

  // ---- PUBLIC API v1 ----
  app.get("/api/v1/search", apiKeyAuth, async (c) => {
    try {
      const data = await movieApi.search(c.req.query("q") || "", Number(c.req.query("page")) || 1, Number(c.req.query("perPage")) || 24);
      return c.json({ status: "success", data: (data as any)?.data || data, ads: apiAds });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });
  app.get("/api/v1/info/:id", apiKeyAuth, async (c) => {
    try {
      const data = await movieApi.getMovieInfo(c.req.param("id"));
      return c.json({ status: "success", data: (data as any)?.data || data, ads: apiAds });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });
  app.get("/api/v1/sources/:id", apiKeyAuth, async (c) => {
    try {
      const data = await movieApi.getSources(c.req.param("id"), c.req.query("season"), c.req.query("episode"));
      return c.json({ status: "success", data: (data as any)?.data || data, ads: apiAds });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });
  app.get("/api/v1/trending", apiKeyAuth, async (c) => {
    try {
      const data = await movieApi.getTrending(Number(c.req.query("page")) || 1, Number(c.req.query("perPage")) || 24);
      return c.json({ status: "success", data: (data as any)?.data || data, ads: apiAds });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });
  app.get("/api/v1/homepage", apiKeyAuth, async (c) => {
    try {
      const data = await movieApi.getHomepage();
      return c.json({ status: "success", data: (data as any)?.data || data, ads: apiAds });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  // ---- MOBILE APP ENDPOINTS ----
  app.get("/api/app/home", appKeyAuth, async (c) => {
    try { return c.json(await movieApi.getHomepage()); } catch (e: any) { return c.json({ error: e.message }, 500); }
  });
  app.get("/api/app/search", appKeyAuth, async (c) => {
    try {
      const keyword = c.req.query("keyword") || c.req.query("q") || "";
      return c.json(await movieApi.search(keyword, Number(c.req.query("page")) || 1, Number(c.req.query("perPage")) || 24));
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });
  app.get("/api/app/info/:id", appKeyAuth, async (c) => {
    try { return c.json(await movieApi.getMovieInfo(c.req.param("id"))); } catch (e: any) { return c.json({ error: e.message }, 500); }
  });
  app.get("/api/app/sources/:id", appKeyAuth, async (c) => {
    try {
      return c.json(await movieApi.getSources(c.req.param("id"), c.req.query("season"), c.req.query("episode")));
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });
  app.get("/api/app/trending", appKeyAuth, async (c) => {
    try {
      return c.json(await movieApi.getTrending(Number(c.req.query("page")) || 1, Number(c.req.query("perPage")) || 24));
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  // ---- ANALYTICS ----
  app.get("/api/admin/analytics-chart", adminAuth, async (c) => {
    try {
      const [stats, logs] = await Promise.all([
        storage.getAnalyticsStats(),
        storage.getAdminLogs(50),
      ]);
      return c.json({ stats, recentLogs: logs });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  // ---- TELEGRAM BOT ----
  app.get("/api/admin/telegram-config", adminAuth, async (c) => {
    try { return c.json(await telegramBot.getTelegramConfig()); }
    catch (e: any) { return c.json({ error: e.message }, 500); }
  });
  app.post("/api/admin/telegram-config", adminAuth, async (c) => {
    try {
      const { botToken, channelId, postsPerDay, autoPost } = await c.req.json();
      await telegramBot.saveTelegramConfig({ botToken, channelId, postsPerDay, autoPost });
      await storage.createAdminLog("telegram_config", "Updated Telegram bot configuration");
      if (autoPost === true) {
        telegramBot.startTelegramScheduler().catch(() => {});
      } else if (autoPost === false) {
        telegramBot.stopTelegramScheduler();
      }
      return c.json(await telegramBot.getTelegramConfig());
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });
  app.post("/api/admin/telegram-test", adminAuth, async (c) => {
    try {
      const result = await telegramBot.sendTestPost();
      if ((result as any).ok) {
        await storage.createAdminLog("telegram_test", "Sent test post to Telegram");
      }
      return c.json(result);
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });
  app.post("/api/admin/telegram-trigger", adminAuth, async (c) => {
    try {
      await storage.createAdminLog("telegram_trigger", "Manually triggered daily Telegram posts");
      telegramBot.runDailyPosts().catch(err => console.error("[Telegram] Manual trigger error:", err));
      return c.json({ ok: true, message: "Daily posts triggered - running in background" });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
  });

  return app;
}
