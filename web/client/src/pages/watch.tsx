import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft, AlertTriangle, RefreshCw, Info, ChevronRight,
  Subtitles, Settings, List, X, Tv, Play
} from "lucide-react";
import { BannerAd, NativeBannerAd, usePopunderAds } from "@/components/ad-manager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function WatchPage() {
  const [location, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const subjectId = location.split("/watch/")[1]?.split("?")[0];
  const initSeason = params.get("season") ? Number(params.get("season")) : undefined;
  const initEpisode = params.get("episode") ? Number(params.get("episode")) : undefined;

  const [selectedSeason, setSelectedSeason] = useState(initSeason || 1);
  const [selectedEpisode, setSelectedEpisode] = useState(initEpisode || 1);
  const [selectedQuality, setSelectedQuality] = useState<string>("");
  const [selectedSubLan, setSelectedSubLan] = useState<string>("en");
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showEpisodePanel, setShowEpisodePanel] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [adGateVisible, setAdGateVisible] = useState(true);
  const [adStarted, setAdStarted] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(10);
  const [canSkip, setCanSkip] = useState(false);
  const adLoadedRef = useRef(false);

  const isTv = !!(initSeason || initEpisode);

  const { data: movieData } = useQuery<any>({
    queryKey: [`/api/movie-info?subjectId=${subjectId}`],
    enabled: !!subjectId,
  });

  const streamQs = isTv
    ? `subjectId=${subjectId}&season=${selectedSeason}&episode=${selectedEpisode}`
    : `subjectId=${subjectId}`;

  const {
    data: streamData,
    isLoading: streamLoading,
    isError: streamError,
    refetch,
  } = useQuery<any>({
    queryKey: [`/api/stream?${streamQs}`],
    enabled: !!subjectId,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const movieRaw = movieData?.data?.subject;
  const resourceRaw = movieData?.data?.resource;
  const title = movieRaw?.title || "Loading...";
  const isTvShow = movieRaw?.subjectType === 2;

  const seasons: Array<{ se: number; maxEp: number; allEp: string }> =
    resourceRaw?.seasons || [];

  const currentSeasonData = seasons.find(s => s.se === selectedSeason) || seasons[0];
  const episodes = useMemo(() => {
    if (!currentSeasonData) return [];
    if (currentSeasonData.allEp) {
      return currentSeasonData.allEp.split(",").map(Number).filter(Boolean);
    }
    if (currentSeasonData.maxEp > 0) {
      return Array.from({ length: currentSeasonData.maxEp }, (_, i) => i + 1);
    }
    return [];
  }, [currentSeasonData]);

  const processedSources: Array<{ id: string; quality: number; proxyUrl: string; directUrl: string; size?: string }> =
    streamData?.data?.processedSources || [];
  const downloads: Array<{ id: string; url: string; resolution: number; size?: string }> =
    streamData?.data?.downloads || [];
  const captions: Array<{ id: string; lan: string; lanName: string; url: string }> =
    streamData?.data?.captions || [];
  const hasResource = streamData?.data?.hasResource ?? false;

  const sortedSources = processedSources.length > 0
    ? [...processedSources].sort((a, b) => b.quality - a.quality)
    : [...downloads].sort((a, b) => b.resolution - a.resolution).map(d => ({
        id: d.id,
        quality: d.resolution,
        proxyUrl: `/api/video-proxy?url=${encodeURIComponent(d.url)}`,
        directUrl: d.url,
        size: d.size,
      }));

  useEffect(() => {
    if (sortedSources.length > 0 && !selectedQuality) {
      setSelectedQuality(String(sortedSources[0].quality));
    }
  }, [sortedSources.length]);

  const currentSrc = selectedQuality
    ? (sortedSources.find(d => String(d.quality) === selectedQuality)?.proxyUrl || sortedSources[0]?.proxyUrl)
    : sortedSources[0]?.proxyUrl;

  const currentCaption = captions.find(c => c.lan === selectedSubLan) || captions[0];

  const goToEpisode = useCallback((season: number, ep: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(ep);
    setSelectedQuality("");
    setShowEpisodePanel(false);
    navigate(`/watch/${subjectId}?season=${season}&episode=${ep}`, { replace: true });
  }, [subjectId, navigate]);

  const prevEpisode = () => {
    const idx = episodes.indexOf(selectedEpisode);
    if (idx > 0) goToEpisode(selectedSeason, episodes[idx - 1]);
  };

  const nextEpisode = () => {
    const idx = episodes.indexOf(selectedEpisode);
    if (idx < episodes.length - 1) {
      goToEpisode(selectedSeason, episodes[idx + 1]);
    } else {
      const sIdx = seasons.findIndex(s => s.se === selectedSeason);
      if (sIdx < seasons.length - 1) {
        const nextS = seasons[sIdx + 1];
        const nextEps = nextS.allEp.split(",").map(Number).filter(Boolean);
        if (nextEps.length > 0) goToEpisode(nextS.se, nextEps[0]);
      }
    }
  };

  const hasPrev = isTvShow && episodes.indexOf(selectedEpisode) > 0;
  const hasNext = isTvShow && episodes.indexOf(selectedEpisode) < episodes.length - 1;

  const loadNativeAdInGate = useCallback(() => {
    if (adLoadedRef.current || !adContainerRef.current) return;
    adLoadedRef.current = true;
    const container = adContainerRef.current;
    container.innerHTML = '<div id="container-f66a888cc611aaf43e6bbaf589441550"></div>';
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = "https://pl28840237.effectivegatecpm.com/f66a888cc611aaf43e6bbaf589441550/invoke.js";
    container.appendChild(script);
  }, []);

  const handlePlayClick = useCallback(() => {
    setAdStarted(true);
    loadNativeAdInGate();

    let count = 10;
    setSkipCountdown(count);
    setCanSkip(false);
    const interval = setInterval(() => {
      count--;
      setSkipCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setCanSkip(true);
      }
    }, 1000);

    const popScript = document.createElement("script");
    popScript.src = "https://pl28839963.effectivegatecpm.com/2a/9c/e9/2a9ce92a5bb7aecad9f16cc3717321c3.js";
    popScript.async = true;
    document.body.appendChild(popScript);
  }, [loadNativeAdInGate]);

  const handleSkipAd = useCallback(() => {
    setAdGateVisible(false);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    setAdGateVisible(true);
    setAdStarted(false);
    setCanSkip(false);
    setSkipCountdown(10);
    adLoadedRef.current = false;
  }, [currentSrc]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="bg-zinc-950 border-b border-white/10 px-2 sm:px-3 py-2 flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/movie/${subjectId}`)}
            className="shrink-0 text-zinc-300 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Link href="/">
            <div className="flex items-center gap-1.5 shrink-0 mr-1" data-testid="watch-logo">
              <div className="bg-primary rounded p-1">
                <Tv className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-xs font-bold text-white hidden sm:inline">
                JMH <span className="text-primary">STREAM</span>
              </span>
            </div>
          </Link>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-white line-clamp-1">{title}</p>
            {isTvShow && (
              <p className="text-[10px] sm:text-xs text-zinc-400">S{selectedSeason} · E{selectedEpisode}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {isTvShow && (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={prevEpisode}
                disabled={!hasPrev}
                className="text-zinc-300 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 disabled:opacity-30"
                title="Previous episode"
                data-testid="button-prev-ep"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={nextEpisode}
                disabled={!hasNext}
                className="text-zinc-300 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 disabled:opacity-30"
                title="Next episode"
                data-testid="button-next-ep"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {isTvShow && episodes.length > 0 && (
            <Button
              size="icon"
              variant={showEpisodePanel ? "secondary" : "ghost"}
              onClick={() => setShowEpisodePanel(v => !v)}
              className="text-zinc-300 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
              title="Episode list"
              data-testid="button-ep-list"
            >
              <List className="w-4 h-4" />
            </Button>
          )}

          {sortedSources.length > 0 && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-zinc-300 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                  data-testid="button-quality"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Quality {selectedQuality ? `(${selectedQuality}p)` : ""}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sortedSources.map(d => (
                  <DropdownMenuItem
                    key={d.id}
                    onClick={() => setSelectedQuality(String(d.quality))}
                    className={`min-h-[44px] sm:min-h-0 ${selectedQuality === String(d.quality) ? "text-primary font-semibold" : ""}`}
                  >
                    {d.quality}p
                    {d.size && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {(Number(d.size) / 1024 / 1024 / 1024).toFixed(1)}GB
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {captions.length > 0 && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant={showSubtitles ? "secondary" : "ghost"}
                  className="text-zinc-300 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                  data-testid="button-subtitles"
                >
                  <Subtitles className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Subtitles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowSubtitles(false)}
                  className={`min-h-[44px] sm:min-h-0 ${!showSubtitles ? "text-primary font-semibold" : ""}`}
                >
                  Off
                </DropdownMenuItem>
                {captions.map(c => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => { setSelectedSubLan(c.lan); setShowSubtitles(true); }}
                    className={`min-h-[44px] sm:min-h-0 ${showSubtitles && selectedSubLan === c.lan ? "text-primary font-semibold" : ""}`}
                  >
                    {c.lanName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={() => refetch()}
            className="text-zinc-300 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex-1 flex flex-col items-center justify-center bg-black min-w-0">
          {streamLoading ? (
            <div className="w-full md:max-w-5xl aspect-video bg-zinc-950 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-zinc-500 animate-spin mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Loading stream...</p>
              </div>
            </div>
          ) : streamError || !currentSrc ? (
            <div className="w-full md:max-w-5xl aspect-video bg-zinc-950 flex items-center justify-center p-4 sm:p-8">
              <div className="text-center max-w-sm">
                <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                  {streamError ? "Failed to load stream" : "No stream available"}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mb-4 sm:mb-5">
                  {isTvShow
                    ? `Episode ${selectedEpisode} of Season ${selectedSeason} is not available yet. Try a different episode.`
                    : "This title is not available for streaming right now. Please check back later or try another title."}
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button onClick={() => refetch()} variant="secondary" size="sm" data-testid="button-retry">
                    <RefreshCw className="w-3.5 h-3.5 mr-2" />
                    Retry
                  </Button>
                  <Link href={`/movie/${subjectId}`}>
                    <Button variant="outline" size="sm">
                      <Info className="w-3.5 h-3.5 mr-2" />
                      Movie Info
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full md:max-w-5xl" data-testid="video-container">
              <div className="relative w-full aspect-video bg-black">
                <video
                  ref={videoRef}
                  key={`${currentSrc}-${selectedSubLan}-${showSubtitles}`}
                  src={currentSrc}
                  controls
                  className="w-full h-full"
                  data-testid="video-player"
                  crossOrigin="anonymous"
                  onEnded={hasNext ? nextEpisode : undefined}
                >
                  {showSubtitles && currentCaption && (
                    <track
                      key={currentCaption.id}
                      kind="subtitles"
                      src={`/api/proxy-sub?url=${encodeURIComponent(currentCaption.url)}`}
                      srcLang={currentCaption.lan}
                      label={currentCaption.lanName}
                      default
                    />
                  )}
                </video>
                <div className="absolute top-3 right-3 pointer-events-none opacity-40 select-none" data-testid="video-watermark">
                  <span className="text-[10px] font-bold text-white/70 tracking-wider">JMH STREAM</span>
                </div>

                {adGateVisible && (
                  <div className="absolute inset-0 z-20 bg-black/95 flex flex-col items-center justify-center" data-testid="ad-gate-overlay">
                    {!adStarted ? (
                      <button
                        onClick={handlePlayClick}
                        className="flex flex-col items-center gap-3 group"
                        data-testid="button-play-with-ad"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 flex items-center justify-center group-hover:bg-primary transition-colors shadow-lg shadow-primary/30">
                          <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground ml-1" />
                        </div>
                        <span className="text-sm text-zinc-300 font-medium">Tap to Play</span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-4 w-full max-w-md px-4">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Advertisement</p>
                        <div ref={adContainerRef} className="w-full flex justify-center items-center min-h-[120px]" data-testid="ad-gate-native" />
                        {canSkip ? (
                          <button
                            onClick={handleSkipAd}
                            className="mt-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-md transition-colors shadow-lg"
                            data-testid="button-skip-ad"
                          >
                            Skip Ad
                          </button>
                        ) : (
                          <div className="mt-2 flex items-center gap-2" data-testid="ad-countdown">
                            <div className="w-8 h-8 rounded-full border-2 border-zinc-600 flex items-center justify-center">
                              <span className="text-xs font-bold text-zinc-300">{skipCountdown}</span>
                            </div>
                            <span className="text-xs text-zinc-500">Skip ad in {skipCountdown}s</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <BannerAd className="py-2 bg-zinc-950" />

              {isTvShow && (
                <div className="bg-zinc-950 border-t border-white/10 px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
                  <div className="text-xs sm:text-sm text-zinc-300 min-w-0">
                    <span className="text-white font-medium line-clamp-1">{title}</span>
                    <span className="text-zinc-500 ml-2 whitespace-nowrap">S{selectedSeason} · E{selectedEpisode}</span>
                  </div>
                  <div className="flex gap-1 sm:gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={prevEpisode}
                      disabled={!hasPrev}
                      className="text-xs text-zinc-400 disabled:opacity-30 min-h-[44px] sm:min-h-0"
                    >
                      <ChevronLeft className="w-3 h-3 mr-1" />Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={nextEpisode}
                      disabled={!hasNext}
                      className="text-xs text-zinc-400 disabled:opacity-30 min-h-[44px] sm:min-h-0"
                    >
                      Next<ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {showEpisodePanel && isTvShow && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setShowEpisodePanel(false)}
              data-testid="episode-panel-overlay"
            />

            <div className="fixed bottom-0 left-0 right-0 z-50 md:relative md:z-auto md:bottom-auto md:left-auto md:right-auto md:w-72 bg-zinc-950 border-t md:border-t-0 md:border-l border-white/10 flex flex-col shrink-0 max-h-[60vh] md:max-h-none rounded-t-xl md:rounded-none">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">Episodes</p>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowEpisodePanel(false)}
                  className="md:hidden text-zinc-400 min-w-[44px] min-h-[44px]"
                  data-testid="button-close-episodes"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {seasons.length > 1 && (
                <div className="flex gap-1.5 px-4 py-2 flex-wrap">
                  {seasons.map(s => (
                    <button
                      key={s.se}
                      onClick={() => { setSelectedSeason(s.se); setSelectedEpisode(1); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[44px] sm:min-h-0 ${selectedSeason === s.se ? "bg-primary text-primary-foreground border-primary" : "border-white/20 text-zinc-400"}`}
                    >
                      S{s.se}
                    </button>
                  ))}
                </div>
              )}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {episodes.map(ep => (
                    <button
                      key={ep}
                      onClick={() => goToEpisode(selectedSeason, ep)}
                      className={`w-full text-left px-3 py-2.5 sm:py-2 rounded-md text-sm transition-colors min-h-[44px] sm:min-h-0 ${selectedEpisode === ep ? "bg-primary/20 text-primary font-semibold" : "text-zinc-300"}`}
                      data-testid={`ep-item-${ep}`}
                    >
                      <span className="font-mono text-xs text-zinc-500 mr-2">
                        E{String(ep).padStart(2, "0")}
                      </span>
                      Episode {ep}
                      {selectedEpisode === ep && <Badge variant="secondary" className="ml-2 text-xs py-0 h-4">Playing</Badge>}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
        <NativeBannerAd className="py-2" />
      </div>
    </div>
  );
}
