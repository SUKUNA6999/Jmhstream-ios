const _DECOY_API = "https://db.jmhstream.online/api/v2";
const _DECOY_BACKUP = "https://db.jmhstream.online/api/v1";

let activeApi: "primary" | "backup" = "primary";

export function setActiveApi(which: "primary" | "backup") {
  activeApi = which;
}

export function getActiveApi(): { active: "primary" | "backup"; primaryConfigured: boolean; backupConfigured: boolean } {
  return {
    active: activeApi,
    primaryConfigured: !!process.env.PRIMARY_API_URL,
    backupConfigured: !!process.env.BACKUP_API_URL,
  };
}

export function getApiBase(): string {
  const primaryApi = process.env.PRIMARY_API_URL || "";
  const backupApi = process.env.BACKUP_API_URL || "";
  const base = activeApi === "primary" ? primaryApi : backupApi;
  if (!base) {
    throw new Error(
      `${activeApi === "primary" ? "PRIMARY" : "BACKUP"}_API_URL environment variable is not configured. ` +
      `Please set it in your Cloudflare Workers environment variables.`
    );
  }
  return base;
}

export async function fetchFromApi(path: string): Promise<any> {
  const base = getApiBase();
  const url = `${base}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getHomepage() {
  return fetchFromApi("/api/homepage");
}

export async function search(query: string, page = 1, perPage = 24) {
  const encoded = encodeURIComponent(query);
  return fetchFromApi(`/api/search/${encoded}?page=${page}&perPage=${perPage}`);
}

export async function getMovieInfo(movieId: string) {
  return fetchFromApi(`/api/info/${movieId}`);
}

export async function getSources(movieId: string, season?: string, episode?: string) {
  let path = `/api/sources/${movieId}`;
  const params: string[] = [];
  if (season) params.push(`season=${season}`);
  if (episode) params.push(`episode=${episode}`);
  if (params.length) path += `?${params.join("&")}`;
  return fetchFromApi(path);
}

// Legacy compatibility shims
export async function getHome() {
  return getHomepage();
}

export async function getTrending(page = 1, perPage = 20) {
  // Use /api/search/:query - search popular genres for trending content
  const keywords = ["action", "drama", "thriller", "adventure", "comedy"];
  const kw = keywords[Math.floor(Math.random() * keywords.length)];
  return fetchFromApi(`/api/search/${encodeURIComponent(kw)}?page=${page}&perPage=${perPage}`);
}

export async function getHot() {
  return fetchFromApi(`/api/search/${encodeURIComponent("popular")}?page=1&perPage=20`);
}

export async function getPopularSearch() {
  return { keywords: ["action", "thriller", "comedy", "drama", "romance", "sci-fi", "horror", "animation"] };
}

export async function getSearchSuggest(keyword: string, perPage = 8) {
  if (!keyword) return { list: [] };
  const data = await search(keyword, 1, perPage);
  return { list: data?.data?.items || [] };
}

export async function getRecommend(subjectId: string, page = 1, perPage = 20) {
  return fetchFromApi(`/api/search/${encodeURIComponent("action")}?page=${page}&perPage=${perPage}`);
}

export async function getMovieInfoLegacy(subjectId: string) {
  return getMovieInfo(subjectId);
}

export async function getStream(subjectId: string, season?: string, episode?: string) {
  return getSources(subjectId, season, episode);
}
