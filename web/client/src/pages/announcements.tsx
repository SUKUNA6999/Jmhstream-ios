import { useQuery } from "@tanstack/react-query";
import { Megaphone, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BannerAd } from "@/components/ad-manager";
import { format } from "date-fns";

export default function AnnouncementsPage() {
  const { data: announcements = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/public/announcements"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 md:px-8 pt-24 pb-8">
        <div className="flex items-center gap-3 mb-8">
          <Megaphone className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold" data-testid="text-announcements-title">Announcements</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-5 w-2/3" /></CardHeader>
                <CardContent><Skeleton className="h-16 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a: any) => (
              <Card key={a.id} data-testid={`card-announcement-${a.id}`}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    {a.isPinned && <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    {a.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.isPinned && <Badge variant="default" className="text-xs">Pinned</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {a.createdAt ? format(new Date(a.createdAt), "MMM d, yyyy") : ""}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <BannerAd className="py-3" />
      <Footer />
    </div>
  );
}
