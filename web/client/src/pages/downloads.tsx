import { useState, useEffect, useRef } from "react";
import {
  Download, Trash2, Play, X, Wifi, WifiOff, AlertTriangle,
  CheckCircle, Loader2, Film, Tv, Smartphone,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BannerAd, NativeBannerAd } from "@/components/ad-manager";
import { useDownloads } from "@/hooks/use-downloads";
import type { DownloadItem } from "@/lib/downloads-db";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** True when the app is running as an installed PWA (standalone/fullscreen). */
function useIsInstalledPwa(): boolean {
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as any).standalone === true,
  );

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) => setInstalled(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return installed;
}

// ──────────────────────────────────────────────────────────
// Offline video player dialog
// ──────────────────────────────────────────────────────────
function OfflinePlayer({
  item,
  onClose,
  getBlobUrl,
}: {
  item: DownloadItem;
  onClose: () => void;
  getBlobUrl: (id: string) => Promise<string | null>;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    getBlobUrl(item.id).then((url) => {
      blobRef.current = url;
      setSrc(url);
    });
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, [item.id, getBlobUrl]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-white/10">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-white line-clamp-1">{item.title}</p>
            {item.type === "tv" && (
              <p className="text-xs text-zinc-400">
                Season {item.season} · Episode {item.episode}
              </p>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="text-zinc-400 hover:text-white ml-2"
            onClick={onClose}
            data-testid="button-close-player"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        {src ? (
          <video
            className="w-full aspect-video bg-black"
            src={src}
            controls
            autoPlay
            playsInline
            data-testid="offline-video-player"
          />
        ) : (
          <div className="flex items-center justify-center aspect-video text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Single download card
// ──────────────────────────────────────────────────────────
function DownloadCard({
  item,
  onPlay,
  onRemove,
  onCancel,
}: {
  item: DownloadItem;
  onPlay: (item: DownloadItem) => void;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const statusBadge = () => {
    if (item.status === "completed")
      return <Badge className="bg-green-600/20 text-green-400 border-green-600/40">Offline</Badge>;
    if (item.status === "downloading")
      return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/40">Downloading</Badge>;
    if (item.status === "error")
      return <Badge className="bg-red-600/20 text-red-400 border-red-600/40">Error</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <>
      <div
        className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
        data-testid={`download-item-${item.id}`}
      >
        {/* Poster */}
        <div className="flex-shrink-0 w-16 aspect-[2/3] rounded-lg overflow-hidden bg-muted border border-border">
          {item.posterUrl ? (
            <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {item.type === "tv" ? (
                <Tv className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Film className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-foreground line-clamp-2 text-sm leading-snug">
                {item.title}
              </p>
              {item.type === "tv" && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  S{item.season} · E{item.episode}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {statusBadge()}
                {item.quality > 0 && (
                  <Badge variant="outline" className="text-xs">{item.quality}p</Badge>
                )}
                {item.size && (
                  <span className="text-xs text-muted-foreground">{item.size}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {item.status === "completed" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-primary hover:text-primary h-8 w-8"
                  onClick={() => onPlay(item)}
                  data-testid={`button-play-download-${item.id}`}
                >
                  <Play className="w-4 h-4 fill-current" />
                </Button>
              )}
              {item.status === "downloading" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                  onClick={() => onCancel(item.id)}
                  data-testid={`button-cancel-download-${item.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              {item.status !== "downloading" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                  onClick={() => setConfirmDelete(true)}
                  data-testid={`button-delete-download-${item.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Download progress */}
          {item.status === "downloading" && (
            <div className="mt-2">
              <Progress value={item.progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{item.progress}%</p>
            </div>
          )}

          {/* Error message */}
          {item.status === "error" && item.errorMessage && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {item.errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete download?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{item.title}</strong> from your offline library.
              You can download it again any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                setConfirmDelete(false);
                onRemove(item.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ──────────────────────────────────────────────────────────
// Gate shown when the user opens /downloads in a browser tab
// (not from the installed PWA)
// ──────────────────────────────────────────────────────────
function PwaOnlyGate() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-screen-md mx-auto px-4 md:px-8 pt-24 pb-12">
        <div className="text-center py-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 rounded-2xl p-5 border border-primary/20">
              <Smartphone className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-3">App Required</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8 leading-relaxed">
            The Downloads feature is only available in the{" "}
            <strong className="text-foreground">installed JMH STREAM app</strong>.
            Install the app to download movies and watch them offline — for free.
          </p>
          <Link href="/install">
            <Button size="lg" className="gap-2">
              <Download className="w-4 h-4" />
              Install the App
            </Button>
          </Link>
        </div>

        <BannerAd className="py-4 mt-4" />
      </main>
      <Footer />
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Downloads Page (PWA-only)
// ──────────────────────────────────────────────────────────
export default function DownloadsPage() {
  const isPwa = useIsInstalledPwa();
  const { downloads, removeDownload, cancelDownload, getBlobUrl } = useDownloads();
  const [playingItem, setPlayingItem] = useState<DownloadItem | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Show install gate when not running as installed PWA
  if (!isPwa) return <PwaOnlyGate />;

  const completed = downloads.filter((d) => d.status === "completed");
  const inProgress = downloads.filter((d) => d.status === "downloading");
  const errored = downloads.filter((d) => d.status === "error");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-screen-md mx-auto px-4 md:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold" data-testid="text-downloads-title">
            Downloads
          </h1>
          {completed.length > 0 && (
            <Badge variant="secondary">{completed.length}</Badge>
          )}
          {/* Online/offline indicator */}
          <div className="ml-auto flex items-center gap-1.5 text-xs">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-500" />
                <span className="text-muted-foreground">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-400 font-medium">Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Top banner ad */}
        <BannerAd className="py-3 mb-4" />

        {/* Info banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-6 flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Downloaded movies and episodes are saved securely inside the JMH STREAM app —
            they are <strong className="text-foreground">never added to your phone gallery</strong>.
            Watch them anytime, even without an internet connection.
          </p>
        </div>

        {/* Empty state */}
        {downloads.length === 0 && (
          <div className="text-center py-20">
            <Download className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No downloads yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Open a movie or TV show and tap <strong>Download</strong> to save it for offline viewing.
            </p>
            <Link href="/">
              <Button variant="secondary">Browse Content</Button>
            </Link>
          </div>
        )}

        {/* In-progress downloads */}
        {inProgress.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Downloading
            </h2>
            <div className="space-y-3">
              {inProgress.map((item) => (
                <DownloadCard
                  key={item.id}
                  item={item}
                  onPlay={setPlayingItem}
                  onRemove={removeDownload}
                  onCancel={cancelDownload}
                />
              ))}
            </div>
          </section>
        )}

        {/* Native ad between sections when there's content */}
        {downloads.length > 0 && <NativeBannerAd className="py-3 my-4" />}

        {/* Completed downloads */}
        {completed.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Available Offline
            </h2>
            <div className="space-y-3">
              {completed.map((item) => (
                <DownloadCard
                  key={item.id}
                  item={item}
                  onPlay={setPlayingItem}
                  onRemove={removeDownload}
                  onCancel={cancelDownload}
                />
              ))}
            </div>
          </section>
        )}

        {/* Errored downloads */}
        {errored.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Failed
            </h2>
            <div className="space-y-3">
              {errored.map((item) => (
                <DownloadCard
                  key={item.id}
                  item={item}
                  onPlay={setPlayingItem}
                  onRemove={removeDownload}
                  onCancel={cancelDownload}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <BannerAd className="py-3" />
      <Footer />

      {/* Offline video player overlay */}
      {playingItem && (
        <OfflinePlayer
          item={playingItem}
          onClose={() => setPlayingItem(null)}
          getBlobUrl={getBlobUrl}
        />
      )}
    </div>
  );
}
