import { useState } from "react";
import { Link } from "wouter";
import { Play, Plus, Check, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getSessionId } from "@/lib/session";

interface MovieCardProps {
  subjectId: string;
  title: string;
  posterUrl?: string;
  rating?: number | string;
  year?: string | number;
  type?: string;
  detailPath?: string;
  genres?: string[];
  compact?: boolean;
}

export function MovieCard({
  subjectId,
  title,
  posterUrl,
  rating,
  year,
  type = "movie",
  detailPath,
  genres = [],
  compact = false,
}: MovieCardProps) {
  const [imgError, setImgError] = useState(false);
  const sessionId = getSessionId();

  const { data: watchlist = [] } = useQuery<any[]>({
    queryKey: ["/api/watchlist"],
  });

  const isInWatchlist = watchlist.some((w: any) => w.subjectId === subjectId);

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/watchlist", { subjectId, title, posterUrl, type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] }),
  });

  const removeMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/watchlist/${subjectId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] }),
  });

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWatchlist) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  const href = `/movie/${subjectId}${detailPath ? `?detailPath=${encodeURIComponent(detailPath)}` : ""}`;

  if (compact) {
    return (
      <Link href={href}>
        <div
          data-testid={`card-movie-${subjectId}`}
          className="group relative rounded-md cursor-pointer flex-shrink-0 w-28"
        >
          <div className="relative w-full aspect-[2/3] rounded-md bg-card border border-card-border overflow-hidden">
            {posterUrl && !imgError ? (
              <img
                src={posterUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Play className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-primary/90 rounded-full p-2">
                <Play className="w-4 h-4 text-primary-foreground fill-current" />
              </div>
            </div>
          </div>
          <p className="mt-1 text-xs font-medium text-foreground line-clamp-1">{title}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href}>
      <div
        data-testid={`card-movie-${subjectId}`}
        className="group relative rounded-md cursor-pointer"
      >
        <div className="relative w-full aspect-[2/3] rounded-md bg-card border border-card-border overflow-hidden">
          {posterUrl && !imgError ? (
            <img
              src={posterUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-primary rounded-full p-3 shadow-lg">
                <Play className="w-5 h-5 text-primary-foreground fill-current" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7"
                onClick={toggleWatchlist}
                data-testid={`button-watchlist-${subjectId}`}
              >
                {isInWatchlist ? (
                  <Check className="w-3 h-3 text-primary" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>

          {type && type !== "movie" && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs px-1.5 py-0 capitalize">
                {type === "tv" ? "TV" : type}
              </Badge>
            </div>
          )}

          {rating && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center gap-0.5 bg-black/70 rounded px-1.5 py-0.5">
                <Star className="w-2.5 h-2.5 fill-primary text-primary" />
                <span className="text-xs text-white font-medium">{typeof rating === "number" ? rating.toFixed(1) : rating}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-2 space-y-0.5">
          <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">{title}</p>
          {year && <p className="text-xs text-muted-foreground">{year}</p>}
        </div>
      </div>
    </Link>
  );
}
