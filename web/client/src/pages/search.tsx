import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MovieCard } from "@/components/movies/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BannerAd, NativeBannerAd } from "@/components/ad-manager";

export default function SearchPage() {
  const [location, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const initialQ = params.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [searchInput, setSearchInput] = useState(initialQ);
  const [subjectType, setSubjectType] = useState("all");
  const [page, setPage] = useState(1);

  const queryStr = `/api/search?keyword=${encodeURIComponent(query)}&page=${page}&perPage=24${subjectType !== "all" ? `&subjectType=${subjectType}` : ""}`;

  const { data, isLoading, isFetching } = useQuery<any>({
    queryKey: [queryStr],
    enabled: query.length > 0,
  });

  const { data: popularData } = useQuery<any>({
    queryKey: ["/api/popular-search"],
  });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get("q") || "";
    setQuery(q);
    setSearchInput(q);
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput.trim());
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      setPage(1);
    }
  };

  const allMovies = data?.data?.items || data?.list || data?.data || data?.results || data?.subjects || [];
  const movies = allMovies;
  const total = data?.data?.pager?.totalCount || data?.total || data?.count || movies.length;
  const popular = popularData?.list || popularData?.keywords || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-search-title">Search</h1>
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search movies, TV shows..."
                className="pl-10 h-10"
                data-testid="input-search-main"
              />
            </div>
            <Select value={subjectType} onValueChange={setSubjectType}>
              <SelectTrigger className="w-36 h-10" data-testid="select-subject-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="movie">Movies</SelectItem>
                <SelectItem value="tv">TV Shows</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" data-testid="button-search-submit">Search</Button>
          </form>

          {popular.length > 0 && !query && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground mr-1 self-center">Popular:</span>
              {popular.slice(0, 10).map((p: any, i: number) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    const kw = typeof p === "string" ? p : p.keyword || p.title || p.name;
                    if (kw) {
                      setSearchInput(kw);
                      setQuery(kw);
                      navigate(`/search?q=${encodeURIComponent(kw)}`);
                    }
                  }}
                  data-testid={`badge-popular-${i}`}
                >
                  {typeof p === "string" ? p : p.keyword || p.title || p.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {query && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Searching..." : `${total} results for "${query}"`}
            </p>
          </div>
        )}

        {isLoading || isFetching ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="w-full aspect-[2/3] rounded-md" />
                <Skeleton className="h-3 w-3/4 mt-2" />
              </div>
            ))}
          </div>
        ) : movies.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {movies.map((m: any, i: number) => {
                const subjectId = m.subjectId || m.id || "";
                return (
                  <MovieCard
                    key={`${subjectId}-${i}`}
                    subjectId={subjectId}
                    title={m.title || m.name || ""}
                    posterUrl={m.cover?.url || m.coverUrl || m.posterUrl || ""}
                    rating={m.imdbRatingValue || m.rating || m.score}
                    year={m.releaseDate?.split("-")[0] || m.year || m.releaseYear}
                    type={m.subjectType === 2 ? "tv" : m.type || "movie"}
                    detailPath={m.detailPath}
                  />
                );
              })}
            </div>

            <div className="flex justify-center gap-3 mt-8">
              <Button
                variant="secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">Page {page}</span>
              <Button
                variant="secondary"
                onClick={() => setPage(p => p + 1)}
                disabled={movies.length < 24}
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          </>
        ) : query ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground text-sm">Try different keywords or browse our categories</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search for movies & TV shows</h3>
            <p className="text-muted-foreground text-sm">Find your favorite content by title, genre, or actor</p>
          </div>
        )}
      </main>
      <NativeBannerAd className="py-2" />
      <BannerAd className="py-3" />
      <Footer />
    </div>
  );
}
