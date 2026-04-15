import { useState, useMemo, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Play, Plus, Check, Star, Calendar, Clock, Globe,
  AlertTriangle, ChevronDown, ChevronUp, Tv, Film,
  Download, CheckCircle, Loader2, HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MovieRow } from "@/components/movies/movie-row";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BannerAd, NativeBannerAd } from "@/components/ad-manager";
import { useDownloads, useDownloadStatus } from "@/hooks/use-downloads";

/** True when the page is running inside the installed PWA. */
function useIsPwa(): boolean {
  const [pwa, setPwa] = useState(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as any).standalone === true,
  );
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const h = (e: MediaQueryListEvent) => setPwa(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return pwa;
}

export default function MovieDetail() {
  const [location] = useLocation();
  const subjectId = location.split("/movie/")[1]?.split("?")[0];

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadSources, setDownloadSources] = useState<Array<{ id: string; url: string; resolution: number; size?: string }>>([]);
  const [loadingDownloadSources, setLoadingDownloadSources] = useState(false);
  const { toast } = useToast();
  const isPwa = useIsPwa();
  const { startDownload } = useDownloads();

  // Download id — matches the key used in the download hook
  const downloadId = useMemo(() => {
    if (!subjectId) return "";
    return subjectId; // movies; TV episodes use `{subjectId}-s{s}e{ep}`
  }, [subjectId]);
  const downloadStatus = useDownloadStatus(downloadId);

  const { data: movieData, isLoading } = useQuery<any>({
    queryKey: [`/api/movie-info?subjectId=${subjectId}`],
    enabled: !!subjectId,
  });

  const { data: recommendations } = useQuery<any>({
    queryKey: [`/api/recommend?subjectId=${subjectId}&page=1&perPage=20`],
    enabled: !!subjectId,
  });

  const { data: watchlist = [] } = useQuery<any[]>({ queryKey: ["/api/watchlist"] });

  const movieRaw = movieData?.data?.subject || movieData?.subject;
  const starsRaw = movieData?.data?.stars || [];
  const resourceRaw = movieData?.data?.resource;
  const isInWatchlist = watchlist.some((w: any) => w.subjectId === subjectId);

  const title = movieRaw?.title || "";
  const posterUrl = movieRaw?.cover?.url || "";
  const bannerUrl = movieRaw?.stills?.url || posterUrl;
  const description = movieRaw?.description || "";
  const rating = movieRaw?.imdbRatingValue;
  const year = movieRaw?.releaseDate?.split("-")[0];
  const isTv = movieRaw?.subjectType === 2;
  const genreStr = movieRaw?.genre || "";
  const genres = genreStr.split(",").map((g: string) => g.trim()).filter(Boolean);
  const durationSec = movieRaw?.duration;
  const duration = durationSec ? `${Math.floor(durationSec / 60)}m` : undefined;
  const country = movieRaw?.countryName;
  const subtitleLangs = movieRaw?.subtitles ? movieRaw.subtitles.split(",").slice(0, 5) : [];

  // Seasons from resource
  const seasons: Array<{ se: number; maxEp: number; allEp: string }> =
    resourceRaw?.seasons || [];

  const currentSeasonData = useMemo(
    () => seasons.find(s => s.se === selectedSeason) || seasons[0],
    [seasons, selectedSeason]
  );

  const episodes = useMemo(() => {
    if (!currentSeasonData) return [];
    if (currentSeasonData.allEp) {
      return currentSeasonData.allEp.split(",").map(Number).filter(Boolean);
    }
    // allEp is empty — generate from maxEp
    if (currentSeasonData.maxEp > 0) {
      return Array.from({ length: currentSeasonData.maxEp }, (_, i) => i + 1);
    }
    return [];
  }, [currentSeasonData]);

  const cast = starsRaw.map((s: any) => ({
    name: s.name,
    character: s.character,
    avatar: s.avatarUrl,
  }));

  const recMovies = (recommendations?.data?.items || []).map((m: any) => ({
    subjectId: m.subjectId || "",
    title: m.title || "",
    posterUrl: m.cover?.url || "",
    rating: m.imdbRatingValue,
    year: m.releaseDate?.split("-")[0],
    type: m.subjectType === 2 ? "tv" : "movie",
    detailPath: m.detailPath,
  }));

  const watchHref = isTv
    ? `/watch/${subjectId}?season=${selectedSeason}&episode=${selectedEpisode}`
    : `/watch/${subjectId}`;

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/watchlist", {
      subjectId,
      title: movieRaw?.title,
      posterUrl: movieRaw?.cover?.url,
      type: isTv ? "tv" : "movie",
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] }),
  });

  const removeMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/watchlist/${subjectId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] }),
  });

  const reportMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/report", {
      subjectId,
      title: title || "Unknown",
      reason: reportReason,
    }),
    onSuccess: () => {
      toast({ title: "Report submitted", description: "Thank you for your feedback." });
      setReportOpen(false);
      setReportReason("");
    },
  });

  /** Open the download dialog and fetch available qualities. */
  const handleDownloadClick = async () => {
    if (!subjectId || loadingDownloadSources) return;
    setLoadingDownloadSources(true);
    try {
      const qs = `subjectId=${subjectId}`;
      const res = await fetch(`/api/stream?${qs}`, {
        headers: { "x-session-id": localStorage.getItem("jmh_session_id") ?? "" },
      });
      if (!res.ok) throw new Error("Could not fetch stream info");
      const streamData = await res.json();

      const downloads: Array<{ id: string; url: string; resolution: number; size?: string }> =
        streamData?.data?.downloads || [];
      const sources: Array<{ id: string; quality: number; proxyUrl: string; directUrl: string; size?: string }> =
        streamData?.data?.processedSources || [];

      // Combine both download and processed sources, sorted by resolution descending
      const combined = [
        ...downloads.map(d => ({ id: d.id, url: d.url, resolution: d.resolution, size: d.size })),
        ...sources.map(s => ({ id: s.id, url: s.directUrl, resolution: s.quality, size: s.size })),
      ].sort((a, b) => b.resolution - a.resolution);

      // Deduplicate by resolution
      const seen = new Set<number>();
      const unique = combined.filter(d => {
        if (seen.has(d.resolution)) return false;
        seen.add(d.resolution);
        return true;
      });

      if (unique.length === 0) {
        toast({ title: "Not available", description: "No downloadable source found for this title.", variant: "destructive" });
        return;
      }

      setDownloadSources(unique);
      setDownloadDialogOpen(true);
    } catch (err: any) {
      toast({ title: "Download failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setLoadingDownloadSources(false);
    }
  };

  /** Trigger a browser file download for the selected quality. */
  const handleQualitySelect = (source: { url: string; resolution: number; size?: string }) => {
    const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(source.url)}&download=1&filename=${encodeURIComponent(
      `${title || "movie"} (${source.resolution}p)`
    )}`;
    const a = document.createElement("a");
    a.href = proxyUrl;
    a.download = `${title || "movie"} (${source.resolution}p).mp4`;
    document.body.appendChild(a);
    try {
      a.click();
    } finally {
      document.body.removeChild(a);
    }
    toast({ title: "Download started", description: `${title} (${source.resolution}p) — check your browser downloads.` });
    setDownloadDialogOpen(false);
  };

  /** Fetch stream sources and kick off an in-app download (PWA only). */
  const handleDownload = async () => {
    if (!subjectId || isDownloading) return;
    setIsDownloading(true);
    try {
      const qs = isTv
        ? `subjectId=${subjectId}&season=${selectedSeason}&episode=${selectedEpisode}`
        : `subjectId=${subjectId}`;
      const res = await fetch(`/api/stream?${qs}`, {
        headers: { "x-session-id": localStorage.getItem("jmh_session_id") ?? "" },
      });
      if (!res.ok) throw new Error("Could not fetch stream info");
      const streamData = await res.json();

      const downloads: Array<{ id: string; url: string; resolution: number; size?: string }> =
        streamData?.data?.downloads || [];
      const sources: Array<{ id: string; quality: number; proxyUrl: string; directUrl: string; size?: string }> =
        streamData?.data?.processedSources || [];

      // Pick the highest-quality downloadable source
      const best =
        [...downloads].sort((a, b) => b.resolution - a.resolution)[0] ||
        [...sources].sort((a, b) => b.quality - a.quality)[0];

      if (!best) {
        toast({ title: "Not available", description: "No downloadable source found for this title.", variant: "destructive" });
        return;
      }

      const rawUrl = (best as any).url || (best as any).directUrl;
      const quality = (best as any).resolution ?? (best as any).quality ?? 0;
      const size = (best as any).size ?? null;
      const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(rawUrl)}`;

      const epId = isTv
        ? `${subjectId}-s${selectedSeason}e${selectedEpisode}`
        : subjectId;
      const epTitle = isTv
        ? `${title} — S${selectedSeason}E${selectedEpisode}`
        : title;

      toast({ title: "Download started", description: `${epTitle} (${quality}p) is being saved for offline viewing. Check the Downloads page to watch offline.` });

      // startDownload runs in the background and updates IndexedDB.
      // We release the button immediately so the user can navigate freely.
      startDownload({
        subjectId,
        title: epTitle,
        posterUrl: posterUrl || null,
        type: isTv ? "tv" : "movie",
        season: isTv ? selectedSeason : undefined,
        episode: isTv ? selectedEpisode : undefined,
        quality,
        size,
        proxyUrl,
      });
    } catch (err: any) {
      toast({ title: "Download failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16">
          <Skeleton className="w-full h-80 md:h-[450px]" />
          <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!movieRaw) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Content not found</h2>
          <Link href="/"><Button variant="secondary">Go Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative w-full pt-16">
        <div className="relative w-full h-72 md:h-[480px] overflow-hidden">
          {bannerUrl ? (
            <img src={bannerUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-card to-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent" />
        </div>

        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 -mt-56 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            {/* Poster */}
            <div className="flex-shrink-0 w-36 md:w-52">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={title}
                  className="w-full aspect-[2/3] object-cover rounded-xl border border-white/10 shadow-2xl"
                  data-testid="img-movie-poster"
                />
              ) : (
                <div className="w-full aspect-[2/3] rounded-xl bg-card border border-card-border flex items-center justify-center">
                  <Play className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-2 md:pt-44">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="secondary" className="capitalize gap-1">
                  {isTv ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                  {isTv ? "TV Series" : "Movie"}
                </Badge>
                {year && <span className="text-sm text-muted-foreground">{year}</span>}
                {duration && <span className="text-sm text-muted-foreground">{duration}</span>}
                {country && <span className="text-sm text-muted-foreground flex items-center gap-1"><Globe className="w-3 h-3" />{country}</span>}
              </div>

              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3" data-testid="text-movie-title">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                {rating && (
                  <div className="flex items-center gap-1.5 bg-card border border-card-border rounded-md px-2.5 py-1">
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                    <span className="text-sm font-semibold">{rating}</span>
                    <span className="text-xs text-muted-foreground">IMDb</span>
                  </div>
                )}
                {genres.slice(0, 4).map((g: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{g}</Badge>
                ))}
              </div>

              {subtitleLangs.length > 0 && (
                <p className="text-xs text-muted-foreground mb-3">
                  Subtitles: {subtitleLangs.join(", ")}{movieRaw.subtitles.split(",").length > 5 ? ` +${movieRaw.subtitles.split(",").length - 5} more` : ""}
                </p>
              )}

              {description && (
                <div className="mb-5 max-w-2xl">
                  <p className={`text-sm text-muted-foreground leading-relaxed ${!descExpanded ? "line-clamp-3" : ""}`}>
                    {description}
                  </p>
                  {description.length > 180 && (
                    <button
                      className="text-xs text-primary mt-1 flex items-center gap-1 hover:underline"
                      onClick={() => setDescExpanded(!descExpanded)}
                    >
                      {descExpanded ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Read more</>}
                    </button>
                  )}
                </div>
              )}

              {/* TV Season/Episode picker */}
              {isTv && seasons.length > 0 && (
                <div className="mb-5 space-y-3">
                  {seasons.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground self-center mr-1">Season:</span>
                      {seasons.map(s => (
                        <button
                          key={s.se}
                          onClick={() => { setSelectedSeason(s.se); setSelectedEpisode(1); }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${selectedSeason === s.se ? "bg-primary text-primary-foreground border-primary" : "bg-card border-card-border text-muted-foreground hover:border-primary/50"}`}
                          data-testid={`button-season-${s.se}`}
                        >
                          S{s.se}
                        </button>
                      ))}
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">
                      Episodes ({episodes.length} available) — Season {selectedSeason}:
                    </span>
                    <ScrollArea className="h-20">
                      <div className="flex flex-wrap gap-1.5 pr-2">
                        {episodes.map(ep => (
                          <button
                            key={ep}
                            onClick={() => setSelectedEpisode(ep)}
                            className={`w-9 h-9 rounded-md text-xs font-semibold transition-colors border ${selectedEpisode === ep ? "bg-primary text-primary-foreground border-primary" : "bg-card border-card-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                            data-testid={`button-ep-${ep}`}
                          >
                            {ep}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Link href={watchHref}>
                  <Button size="lg" className="gap-2" data-testid="button-watch">
                    <Play className="w-4 h-4 fill-current" />
                    {isTv ? `Watch S${selectedSeason}E${selectedEpisode}` : "Watch Now"}
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => isInWatchlist ? removeMutation.mutate() : addMutation.mutate()}
                  disabled={addMutation.isPending || removeMutation.isPending}
                  data-testid="button-watchlist-toggle"
                >
                  {isInWatchlist ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {isInWatchlist ? "Saved" : "Add to List"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setReportOpen(true)}
                  data-testid="button-report"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Report
                </Button>
                {/* Download button — for movies, available to all users with quality selection */}
                {!isTv && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleDownloadClick}
                    disabled={loadingDownloadSources}
                    className="gap-2"
                    data-testid="button-download"
                  >
                    {loadingDownloadSources ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download
                      </>
                    )}
                  </Button>
                )}
                {/* PWA in-app download for TV episodes */}
                {isTv && isPwa && (
                  downloadStatus?.status === "completed" ? (
                    <Link href="/downloads">
                      <Button size="lg" variant="outline" className="gap-2 text-green-400 border-green-600/40 hover:text-green-300" data-testid="button-downloaded">
                        <CheckCircle className="w-4 h-4" />
                        Downloaded
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleDownload}
                      disabled={isDownloading || downloadStatus?.status === "downloading"}
                      className="gap-2"
                      data-testid="button-download-pwa"
                    >
                      {isDownloading || downloadStatus?.status === "downloading" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {downloadStatus?.progress != null ? `${downloadStatus.progress}%` : "Starting…"}
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download
                        </>
                      )}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cast */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-10">
        {cast.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4">Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {cast.slice(0, 15).map((c: any, i: number) => (
                <div key={i} className="flex-shrink-0 w-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-card border border-card-border overflow-hidden mx-auto mb-2">
                    {c.avatar ? (
                      <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted text-xl font-bold text-muted-foreground">
                        {(c.name || "?")[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-foreground line-clamp-2">{c.name}</p>
                  {c.character && <p className="text-xs text-muted-foreground line-clamp-1 italic">{c.character}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {recMovies.length > 0 && (
          <MovieRow title="You Might Also Like" movies={recMovies} />
        )}
      </div>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Reporting: <strong>{title}</strong></p>
            <Textarea
              placeholder="Describe the issue (broken stream, wrong info, inappropriate content, etc.)"
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="min-h-24"
              data-testid="input-report-reason"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setReportOpen(false)}>Cancel</Button>
              <Button
                onClick={() => reportMutation.mutate()}
                disabled={!reportReason.trim() || reportMutation.isPending}
                data-testid="button-submit-report"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Quality Selection Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Download — Choose Quality
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              Select the quality for <strong>{title}</strong>
            </p>
            {downloadSources.map((source) => {
              const parsed = source.size ? parseInt(source.size, 10) : 0;
              const sizeBytes = Number.isNaN(parsed) ? 0 : parsed;
              const sizeLabel = sizeBytes > 0
                ? sizeBytes >= 1_073_741_824
                  ? `${(sizeBytes / 1_073_741_824).toFixed(1)} GB`
                  : `${(sizeBytes / 1_048_576).toFixed(0)} MB`
                : "";
              return (
                <button
                  key={source.id}
                  onClick={() => handleQualitySelect(source)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-card-border bg-card hover:border-primary/50 hover:bg-accent transition-colors group"
                  data-testid={`button-download-${source.resolution}p`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-16 h-8 rounded-md bg-primary/10 text-primary text-sm font-bold">
                      {source.resolution}p
                    </div>
                    <span className="text-sm text-muted-foreground">{
                      source.resolution >= 1080 ? "Full HD" :
                      source.resolution >= 720 ? "HD" :
                      source.resolution >= 480 ? "SD" : "Low"
                    }</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {sizeLabel && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {sizeLabel}
                      </span>
                    )}
                    <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <NativeBannerAd className="py-2" />
      <BannerAd className="py-3" />
      <Footer />
    </div>
  );
}
