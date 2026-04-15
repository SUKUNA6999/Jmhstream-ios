import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "./movie-card";
import { Skeleton } from "@/components/ui/skeleton";

interface Movie {
  id?: string;
  subjectId?: string;
  title?: string;
  name?: string;
  coverUrl?: string;
  posterUrl?: string;
  cover?: string;
  rating?: number | string;
  year?: string | number;
  type?: string;
  detailPath?: string;
  genres?: string[];
}

interface MovieRowProps {
  title: string;
  movies: Movie[];
  isLoading?: boolean;
  viewAllHref?: string;
}

function extractMovieData(movie: Movie) {
  const subjectId = movie.subjectId || movie.id || "";
  const title = movie.title || movie.name || "Unknown";
  const posterUrl = movie.coverUrl || movie.posterUrl || movie.cover || "";
  const rating = movie.rating;
  const year = movie.year;
  const type = movie.type || "movie";
  const detailPath = movie.detailPath;
  return { subjectId, title, posterUrl, rating, year, type, detailPath };
}

export function MovieRow({ title, movies, isLoading, viewAllHref }: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground tracking-tight" data-testid={`text-section-${title.replace(/\s+/g, "-").toLowerCase()}`}>{title}</h2>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <a href={viewAllHref} className="text-sm text-primary hover:underline">
              View All
            </a>
          )}
          <Button size="icon" variant="secondary" onClick={() => scroll("left")} data-testid="button-scroll-left" className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={() => scroll("right")} data-testid="button-scroll-right" className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-36">
                <Skeleton className="w-full aspect-[2/3] rounded-md" />
                <Skeleton className="h-3 w-3/4 mt-2 rounded" />
                <Skeleton className="h-2.5 w-1/2 mt-1 rounded" />
              </div>
            ))
          : movies.map((movie, i) => {
              const data = extractMovieData(movie);
              return (
                <div key={`${data.subjectId || "x"}-${i}`} className="flex-shrink-0 w-36">
                  <MovieCard {...data} />
                </div>
              );
            })}
      </div>
    </section>
  );
}
