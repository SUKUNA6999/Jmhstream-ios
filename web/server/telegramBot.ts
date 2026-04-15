import { storage } from "./storage";
import * as movieApi from "./movieApi";

const SITE_URL = process.env.SITE_URL || "https://jmhstream.online";

const EXTRA_CHANNELS = ["@justforfuns1", "@lgdsukunale"];

interface MoviePost {
  subjectId: string;
  title: string;
  posterUrl: string;
  year?: string;
  rating?: string | number;
  type?: string;
  description?: string;
  genres?: string[];
  duration?: number;
}

async function getBotToken(): Promise<string | null> {
  const setting = await storage.getSiteSetting("telegram_bot_token");
  return setting?.value || process.env.TELEGRAM_BOT_TOKEN || null;
}

async function getChannelId(): Promise<string | null> {
  const setting = await storage.getSiteSetting("telegram_channel_id");
  return setting?.value || process.env.TELEGRAM_CHANNEL_ID || null;
}

export async function getTelegramConfig() {
  const token = await getBotToken();
  const channelId = await getChannelId();
  const postsPerDay = (await storage.getSiteSetting("telegram_posts_per_day"))?.value || "20";
  const lastRun = (await storage.getSiteSetting("telegram_last_run"))?.value || null;
  const autoPost = (await storage.getSiteSetting("telegram_auto_post"))?.value || "true";
  return {
    hasToken: !!token,
    tokenPreview: token ? `${token.slice(0, 8)}...${token.slice(-4)}` : null,
    channelId: channelId || null,
    extraChannels: EXTRA_CHANNELS,
    postsPerDay: parseInt(postsPerDay),
    lastRun,
    autoPost: autoPost === "true",
  };
}

export async function saveTelegramConfig(config: { botToken?: string; channelId?: string; postsPerDay?: number; autoPost?: boolean }) {
  if (config.botToken) {
    await storage.upsertSiteSetting("telegram_bot_token", config.botToken);
  }
  if (config.channelId !== undefined) {
    await storage.upsertSiteSetting("telegram_channel_id", config.channelId);
  }
  if (config.postsPerDay !== undefined) {
    const validated = Math.max(1, Math.min(50, isNaN(config.postsPerDay) ? 20 : config.postsPerDay));
    await storage.upsertSiteSetting("telegram_posts_per_day", String(validated));
  }
  if (config.autoPost !== undefined) {
    await storage.upsertSiteSetting("telegram_auto_post", String(config.autoPost));
  }
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatCaption(movie: MoviePost): string {
  const typeEmoji = movie.type === "tv" ? "📺" : movie.type === "anime" ? "🎌" : "🎬";
  const typeLabel = movie.type === "tv" ? "Series" : movie.type === "anime" ? "Anime" : "Movie";

  let caption = `${typeEmoji} *${escapeMarkdown(movie.title)}*\n`;
  caption += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (movie.year) caption += `📅 *Year:* ${escapeMarkdown(movie.year)}\n`;
  if (movie.rating && String(movie.rating) !== "0" && String(movie.rating) !== "") {
    caption += `⭐ *Rating:* ${escapeMarkdown(String(movie.rating))}/10\n`;
  }
  caption += `🎭 *Type:* ${escapeMarkdown(typeLabel)}\n`;

  const dur = formatDuration(movie.duration);
  if (dur) caption += `⏱ *Duration:* ${escapeMarkdown(dur)}\n`;

  if (movie.genres && movie.genres.length > 0) {
    const tags = movie.genres.slice(0, 4).map(g => `\\#${escapeMarkdown(g.replace(/\s+/g, ""))}`).join(" ");
    caption += `🏷 ${tags}\n`;
  }

  if (movie.description && movie.description.trim().length > 0) {
    const desc = movie.description.length > 180 ? movie.description.slice(0, 180) + "..." : movie.description;
    caption += `\n📝 _${escapeMarkdown(desc)}_\n`;
  }

  caption += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  caption += `🍿 Stream free now on *JMH STREAM*\n`;
  caption += `🌐 ${escapeMarkdown(SITE_URL)}`;

  return caption;
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

async function sendToChat(token: string, chatId: string, movie: MoviePost, caption: string, inlineKeyboard: any): Promise<{ ok: boolean; error?: string }> {
  try {
    if (movie.posterUrl && movie.posterUrl.startsWith("http")) {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: movie.posterUrl,
          caption,
          parse_mode: "MarkdownV2",
          reply_markup: inlineKeyboard,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        return await sendTextMessage(token, chatId, caption, inlineKeyboard);
      }
      return { ok: true };
    } else {
      return await sendTextMessage(token, chatId, caption, inlineKeyboard);
    }
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function sendMoviePost(movie: MoviePost): Promise<{ ok: boolean; error?: string }> {
  const token = await getBotToken();
  const channelId = await getChannelId();

  if (!token || !channelId) {
    return { ok: false, error: "Bot token or channel ID not configured" };
  }

  const caption = formatCaption(movie);
  const watchUrl = `${SITE_URL}/movie/${movie.subjectId}`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "▶️ Watch Now", url: watchUrl },
      ],
      [
        { text: "📢 Join Channel", url: "https://t.me/jmhstreamsupport" },
        { text: "🌐 Website", url: SITE_URL },
      ],
    ],
  };

  const mainResult = await sendToChat(token, channelId, movie, caption, inlineKeyboard);

  if (mainResult.ok) {
    for (const extraChat of EXTRA_CHANNELS) {
      try {
        await sendToChat(token, extraChat, movie, caption, inlineKeyboard);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err: any) {
        console.error(`[Telegram] Failed to send to ${extraChat}:`, err.message);
      }
    }
  }

  return mainResult;
}

async function sendTextMessage(token: string, chatId: string, text: string, replyMarkup: any) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "MarkdownV2",
      reply_markup: replyMarkup,
    }),
  });
  const data = await res.json();
  if (!data.ok) {
    return { ok: false, error: data.description || "Failed to send message" };
  }
  return { ok: true };
}

async function collectMovies(): Promise<MoviePost[]> {
  const allMovies: MoviePost[] = [];
  const seen = new Set<string>();

  try {
    const homeData = await movieApi.getHomepage();
    const items = homeData?.data?.items || homeData?.items || homeData?.data || [];
    if (Array.isArray(items)) {
      for (const item of items) {
        const id = item.subjectId || item.id;
        if (id && !seen.has(id)) {
          seen.add(id);
          allMovies.push({
            subjectId: id,
            title: item.title || item.name || "",
            posterUrl: item.cover?.url || item.coverUrl || item.posterUrl || "",
            year: item.releaseDate?.split("-")[0] || item.year || item.releaseYear || "",
            rating: item.imdbRatingValue || item.rating || item.score || "",
            type: item.subjectType === 2 ? "tv" : item.type || "movie",
            description: item.description || item.summary || "",
            genres: item.genres || (item.genre ? item.genre.split(",").map((g: string) => g.trim()) : []),
            duration: item.duration || 0,
          });
        }
      }
    }

    if (homeData?.data?.sections) {
      for (const section of homeData.data.sections) {
        const sItems = section.items || section.list || [];
        for (const item of sItems) {
          const id = item.subjectId || item.id;
          if (id && !seen.has(id)) {
            seen.add(id);
            allMovies.push({
              subjectId: id,
              title: item.title || item.name || "",
              posterUrl: item.cover?.url || item.coverUrl || item.posterUrl || "",
              year: item.releaseDate?.split("-")[0] || item.year || "",
              rating: item.imdbRatingValue || item.rating || "",
              type: item.subjectType === 2 ? "tv" : item.type || "movie",
              description: item.description || item.summary || "",
              genres: item.genres || (item.genre ? item.genre.split(",").map((g: string) => g.trim()) : []),
              duration: item.duration || 0,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("[Telegram] Error fetching homepage:", err);
  }

  const searchTerms = ["action", "drama", "thriller", "comedy", "romance", "horror", "sci-fi", "anime", "adventure", "fantasy"];
  for (const term of searchTerms) {
    try {
      const data = await movieApi.search(term, 1, 20);
      const items = data?.data?.items || data?.list || data?.data || data?.results || [];
      if (Array.isArray(items)) {
        for (const item of items) {
          const id = item.subjectId || item.id;
          if (id && !seen.has(id)) {
            seen.add(id);
            allMovies.push({
              subjectId: id,
              title: item.title || item.name || "",
              posterUrl: item.cover?.url || item.coverUrl || item.posterUrl || "",
              year: item.releaseDate?.split("-")[0] || item.year || "",
              rating: item.imdbRatingValue || item.rating || "",
              type: item.subjectType === 2 ? "tv" : item.type || "movie",
              description: item.description || item.summary || "",
              genres: item.genres || (item.genre ? item.genre.split(",").map((g: string) => g.trim()) : []),
              duration: item.duration || 0,
            });
          }
        }
      }
    } catch (err) {
      console.error(`[Telegram] Error searching "${term}":`, err);
    }
  }

  return allMovies;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function runDailyPosts(): Promise<{ sent: number; failed: number; errors: string[] }> {
  const token = await getBotToken();
  const channelId = await getChannelId();

  if (!token || !channelId) {
    console.log("[Telegram] Bot not configured, skipping daily posts");
    return { sent: 0, failed: 0, errors: ["Bot not configured"] };
  }

  const postsPerDaySetting = (await storage.getSiteSetting("telegram_posts_per_day"))?.value;
  const parsed = parseInt(postsPerDaySetting || "20");
  const postsPerDay = Math.max(1, Math.min(50, isNaN(parsed) ? 20 : parsed));

  console.log(`[Telegram] Starting daily posts (${postsPerDay} posts)...`);

  const movies = await collectMovies();
  if (movies.length === 0) {
    console.log("[Telegram] No movies found to post");
    return { sent: 0, failed: 0, errors: ["No movies found"] };
  }

  const selected = shuffleArray(movies).slice(0, postsPerDay);
  const delayMs = Math.floor((24 * 60 * 60 * 1000) / postsPerDay);

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < selected.length; i++) {
    const movie = selected[i];
    const result = await sendMoviePost(movie);

    if (result.ok) {
      sent++;
      console.log(`[Telegram] Posted (${sent}/${selected.length}): ${movie.title}`);
    } else {
      failed++;
      const errMsg = `Failed: ${movie.title} - ${result.error}`;
      errors.push(errMsg);
      console.error(`[Telegram] ${errMsg}`);
    }

    if (i < selected.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  await storage.upsertSiteSetting("telegram_last_run", new Date().toISOString());
  console.log(`[Telegram] Daily posts complete: ${sent} sent, ${failed} failed`);

  return { sent, failed, errors };
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let schedulerTimeout: ReturnType<typeof setTimeout> | null = null;

export function stopTelegramScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  if (schedulerTimeout) {
    clearTimeout(schedulerTimeout);
    schedulerTimeout = null;
  }
  console.log("[Telegram] Scheduler stopped");
}

export async function startTelegramScheduler() {
  stopTelegramScheduler();

  const autoPost = (await storage.getSiteSetting("telegram_auto_post"))?.value;
  if (autoPost === "false") {
    console.log("[Telegram] Auto-posting is disabled");
    return;
  }

  const token = await getBotToken();
  if (!token) {
    console.log("[Telegram] No bot token configured, scheduler not started");
    return;
  }

  console.log("[Telegram] Scheduler started - will post daily");

  schedulerTimeout = setTimeout(() => {
    runDailyPosts().catch(err => console.error("[Telegram] Daily posts error:", err));
  }, 30000);

  schedulerInterval = setInterval(() => {
    runDailyPosts().catch(err => console.error("[Telegram] Daily posts error:", err));
  }, 24 * 60 * 60 * 1000);
}

export async function sendTestPost(): Promise<{ ok: boolean; error?: string }> {
  const movies = await collectMovies();
  if (movies.length === 0) {
    return { ok: false, error: "No movies available to send as test" };
  }

  const testMovie = movies[Math.floor(Math.random() * movies.length)];
  return await sendMoviePost(testMovie);
}
