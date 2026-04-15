import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Film } from "lucide-react";
import { MovieCard } from "@/components/movies/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { extractMovies, normalizeMovie } from "@/lib/apiHelpers";
import { BannerAd, NativeBannerAd } from "@/components/ad-manager";

export default function MoviesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<any>({
    queryKey: [`/api/search?keyword=movie&page=${page}&perPage=24`],
  });

  const allMovies = extractMovies(data).map(normalizeMovie);
  const movies = allMovies.filter(m => m.type !== "tv");
  const displayMovies = movies.length > 0 ? movies : allMovies;
  const hasMore = data?.data?.pager?.hasMore ?? (allMovies.length >= 24);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Film className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold" data-testid="text-movies-title">Movies</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="w-full aspect-[2/3] rounded-md" />
                <Skeleton className="h-3 w-3/4 mt-2" />
              </div>
            ))}
          </div>
        ) : displayMovies.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {displayMovies.map((m, i) => (
                <MovieCard
                  key={m.subjectId || i}
                  subjectId={m.subjectId}
                  title={m.title}
                  posterUrl={m.posterUrl}
                  rating={m.rating}
                  year={m.year}
                  type={m.type}
                  detailPath={m.detailPath}
                />
              ))}
            </div>
            <div className="flex justify-center gap-3 mt-8">
              <Button variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="button-prev">
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">Page {page}</span>
              <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={!hasMore} data-testid="button-next">
                Next
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No movies found</h3>
          </div>
        )}
      </main>
      <NativeBannerAd className="py-2" />
      <BannerAd className="py-3" />
      <Footer />
    </div>
  );
}
