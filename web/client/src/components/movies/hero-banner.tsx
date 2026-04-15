import { useState, useEffect } from "react";
import { Play, Plus, Check, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface HeroBannerProps {
  movies: Array<{
    subjectId: string;
    title: string;
    bannerUrl?: string;
    posterUrl?: string;
    description?: string;
    rating?: number | string;
    year?: string | number;
    type?: string;
    genres?: string[];
    detailPath?: string;
  }>;
}

export function HeroBanner({ movies }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(i => (i + 1) % movies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [movies.length]);

  const { data: watchlist = [] } = useQuery<any[]>({ queryKey: ["/api/watchlist"] });

  const movie = movies[currentIndex];
  if (!movie) return null;

  const isInWatchlist = watchlist.some((w: any) => w.subjectId === movie.subjectId);

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/watchlist", {
      subjectId: movie.subjectId,
      title: movie.title,
      posterUrl: movie.posterUrl,
      type: movie.type || "movie"
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] }),
  });

  const removeMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/watchlist/${movie.subjectId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] }),
  });

  const href = `/movie/${movie.subjectId}${movie.detailPath ? `?detailPath=${encodeURIComponent(movie.detailPath)}` : ""}`;
  const watchHref = `/watch/${movie.subjectId}${movie.detailPath ? `?detailPath=${encodeURIComponent(movie.detailPath)}` : ""}`;

  return (
    <div className="relative w-full aspect-[16/7] min-h-64 max-h-[520px] overflow-hidden rounded-xl">
      {movies.map((m, i) => (
        <div
          key={`${m.subjectId}-${i}`}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === currentIndex ? "opacity-100" : "opacity-0"}`}
        >
          {(m.bannerUrl || m.posterUrl) ? (
            <img
              src={m.bannerUrl || m.posterUrl}
              alt={m.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-card to-muted" />
          )}
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 max-w-2xl">
        {movie.type && (
          <Badge variant="secondary" className="mb-3 w-fit capitalize">
            {movie.type === "tv" ? "TV Series" : "Movie"}
          </Badge>
        )}
        <h1
          data-testid="text-hero-title"
          className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight"
        >
          {movie.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          {movie.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-sm text-white font-medium">{typeof movie.rating === "number" ? movie.rating.toFixed(1) : movie.rating}</span>
            </div>
          )}
          {movie.year && <span className="text-sm text-white/70">{movie.year}</span>}
          {movie.genres?.slice(0, 3).map(g => (
            <Badge key={g} variant="outline" className="text-xs border-white/20 text-white/80">{g}</Badge>
          ))}
        </div>

        {movie.description && (
          <p className="text-sm text-white/70 mb-5 line-clamp-2 max-w-lg">{movie.description}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href={watchHref}>
            <Button size="lg" data-testid="button-hero-play">
              <Play className="w-4 h-4 mr-2 fill-current" />
              Play Now
            </Button>
          </Link>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => isInWatchlist ? removeMutation.mutate() : addMutation.mutate()}
            data-testid="button-hero-watchlist"
          >
            {isInWatchlist ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isInWatchlist ? "Saved" : "My List"}
          </Button>
          <Link href={href}>
            <Button size="lg" variant="outline" className="border-white/30 text-white" data-testid="button-hero-info">
              <Info className="w-4 h-4 mr-2" />
              More Info
            </Button>
          </Link>
        </div>
      </div>

      {movies.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-primary w-6" : "bg-white/40"}`}
              data-testid={`button-hero-dot-${i}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
