import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroBanner } from "@/components/movies/hero-banner";
import { MovieRow } from "@/components/movies/movie-row";
import { BroadcastBanner } from "@/components/broadcast-banner";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { normalizeMovie, extractMovies, extractHomepageSections } from "@/lib/apiHelpers";
import { BannerAd, NativeBannerAd } from "@/components/ad-manager";

export default function Home() {
  const { data: homeData, isLoading: homeLoading } = useQuery<any>({
    queryKey: ["/api/home"],
  });

  const { data: trendingData, isLoading: trendingLoading } = useQuery<any>({
    queryKey: ["/api/trending?page=1&perPage=24"],
  });

  const { data: featuredData = [] } = useQuery<any[]>({
    queryKey: ["/api/public/featured"],
  });

  const homeSections = homeData ? extractHomepageSections(homeData) : [];
  const trendingMovies = extractMovies(trendingData).map(normalizeMovie);

  const heroMovies = featuredData.length > 0
    ? featuredData.slice(0, 5).map((f: any) => ({
        subjectId: f.subjectId,
        title: f.title,
        posterUrl: f.posterUrl || "",
        bannerUrl: f.bannerUrl || f.posterUrl || "",
        description: f.description || "",
        type: f.type,
        detailPath: undefined,
      }))
    : trendingMovies.slice(0, 6).map(m => ({
        subjectId: m.subjectId,
        title: m.title,
        posterUrl: m.posterUrl,
        bannerUrl: m.bannerUrl || m.posterUrl,
        description: m.description,
        type: m.type,
        detailPath: m.detailPath,
        rating: m.rating,
        year: m.year,
        genres: m.genres,
      }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-20 pb-8">
        <BroadcastBanner />

        {trendingLoading ? (
          <Skeleton className="w-full aspect-[16/7] min-h-64 max-h-[520px] rounded-xl mb-10" />
        ) : heroMovies.length > 0 ? (
          <div className="mb-10">
            <HeroBanner movies={heroMovies} />
          </div>
        ) : null}

        <div className="space-y-10">
          {trendingMovies.length > 0 && (
            <MovieRow
              title="Trending Now"
              movies={trendingMovies}
              isLoading={trendingLoading}
              viewAllHref="/trending"
            />
          )}

          <NativeBannerAd className="py-2" />

          {homeLoading
            ? [1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <div className="flex gap-3">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <div key={j} className="flex-shrink-0 w-36">
                        <Skeleton className="w-full aspect-[2/3] rounded-md" />
                        <Skeleton className="h-3 w-3/4 mt-2" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : homeSections.map((section, idx) => (
                <MovieRow
                  key={idx}
                  title={section.title}
                  movies={section.movies}
                />
              ))}
        </div>
      </main>
      <BannerAd className="py-3" />
      <Footer />
    </div>
  );
}
