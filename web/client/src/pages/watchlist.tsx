import { Bookmark, Trash2, Play } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BannerAd } from "@/components/ad-manager";

export default function WatchlistPage() {
  const { data: watchlist = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/watchlist"],
  });

  const removeMutation = useMutation({
    mutationFn: (subjectId: string) => apiRequest("DELETE", `/api/watchlist/${subjectId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Bookmark className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold" data-testid="text-watchlist-title">My Watchlist</h1>
          {watchlist.length > 0 && (
            <Badge variant="secondary">{watchlist.length}</Badge>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="w-full aspect-[2/3] rounded-md" />
                <Skeleton className="h-3 w-3/4 mt-2" />
              </div>
            ))}
          </div>
        ) : watchlist.length === 0 ? (
          <div className="text-center py-24">
            <Bookmark className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
            <p className="text-muted-foreground text-sm mb-6">Start adding movies and TV shows you want to watch later</p>
            <Link href="/">
              <Button>Browse Content</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {watchlist.map((item: any) => (
              <div key={item.id} className="group relative" data-testid={`watchlist-item-${item.subjectId}`}>
                <Link href={`/movie/${item.subjectId}`}>
                  <div className="relative w-full aspect-[2/3] rounded-md bg-card border border-card-border overflow-hidden cursor-pointer">
                    {item.posterUrl ? (
                      <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Play className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-primary rounded-full p-3">
                        <Play className="w-5 h-5 text-primary-foreground fill-current" />
                      </div>
                    </div>
                    {item.type && item.type !== "movie" && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs capitalize">{item.type === "tv" ? "TV" : item.type}</Badge>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="mt-2 flex items-start justify-between gap-1">
                  <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">{item.title}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="flex-shrink-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeMutation.mutate(item.subjectId)}
                    data-testid={`button-remove-watchlist-${item.subjectId}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BannerAd className="py-3" />
      <Footer />
    </div>
  );
}
