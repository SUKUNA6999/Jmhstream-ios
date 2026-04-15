// Helper to extract movie list from any API response format
export function extractMovies(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  // New API search format: data.data.items
  if (data.data?.items) return data.data.items;
  // New API trending format: data.data.subjectList
  if (data.data?.subjectList) return data.data.subjectList;
  // New API homepage sections
  if (data.data?.topPickList) return data.data.topPickList;
  if (data.data?.homeList) return data.data.homeList;
  // Other formats
  if (data.list) return data.list;
  if (data.items) return data.items;
  if (data.results) return data.results;
  if (data.subjects) return data.subjects;
  return [];
}

// Normalize a movie object to a consistent format
export function normalizeMovie(m: any) {
  const subjectId = m.subjectId || m.id || m._id || "";
  const title = m.title || m.name || "Unknown";
  // New API uses m.cover.url, old uses m.coverUrl
  const posterUrl = m.cover?.url || m.coverUrl || m.posterUrl || m.poster || "";
  const bannerUrl = m.stills?.url || m.banner?.url || m.backdrop || m.backdropUrl || posterUrl;
  const description = m.description || m.overview || m.intro || "";
  const rating = m.imdbRatingValue || m.rating || m.score;
  const year = m.releaseDate?.split("-")[0] || m.year || m.releaseYear;
  // subjectType: 1 = movie, 2 = tv
  const type = m.subjectType === 2 ? "tv" : m.type || m.subjectType || "movie";
  const detailPath = m.detailPath || m.detail_path;
  const genreStr = m.genre || m.genres;
  const genres: string[] = typeof genreStr === "string"
    ? genreStr.split(",").map((g: string) => g.trim()).filter(Boolean)
    : Array.isArray(genreStr) ? genreStr : [];

  return { subjectId, title, posterUrl, bannerUrl, description, rating, year, type, detailPath, genres };
}

// Extract homepage sections from new API
export function extractHomepageSections(data: any): Array<{ title: string; movies: any[] }> {
  if (!data?.data) return [];
  const d = data.data;
  const sections: Array<{ title: string; movies: any[] }> = [];

  if (d.topPickList?.length > 0) {
    sections.push({ title: "Top Picks", movies: d.topPickList.map(normalizeMovie) });
  }
  if (d.homeList?.length > 0) {
    sections.push({ title: "For You", movies: d.homeList.map(normalizeMovie) });
  }
  if (d.operatingList?.length > 0) {
    for (const op of d.operatingList) {
      if (op.subjects?.length > 0) {
        sections.push({ title: op.title || "Featured", movies: op.subjects.map(normalizeMovie) });
      }
    }
  }

  return sections;
}

// Extract platform list
export function extractPlatforms(data: any): string[] {
  return data?.data?.platformList?.map((p: any) => p.name) || [];
}
