import { useState, useEffect, useCallback, useRef } from "react";
import {
  getAllDownloads,
  getDownload,
  upsertDownload,
  deleteDownload,
  getBlob,
  downloadVideo,
  type DownloadItem,
} from "@/lib/downloads-db";

// Active AbortControllers keyed by download id
const activeDownloads = new Map<string, AbortController>();

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  const refresh = useCallback(async () => {
    const all = await getAllDownloads();
    setDownloads(all.sort((a, b) => b.downloadedAt - a.downloadedAt));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Start downloading a movie/episode and store it in-app (IndexedDB). */
  const startDownload = useCallback(
    async (params: {
      subjectId: string;
      title: string;
      posterUrl: string | null;
      type: "movie" | "tv";
      season?: number;
      episode?: number;
      quality: number;
      size: string | null;
      /** The /api/video-proxy URL (already encoded) */
      proxyUrl: string;
    }) => {
      const id = params.type === "tv"
        ? `${params.subjectId}-s${params.season}e${params.episode}`
        : params.subjectId;

      // Prevent duplicate downloads
      if (activeDownloads.has(id)) return;

      const existing = await getDownload(id);
      if (existing?.status === "completed") return;

      const controller = new AbortController();
      activeDownloads.set(id, controller);

      const item: DownloadItem = {
        id,
        subjectId: params.subjectId,
        title: params.title,
        posterUrl: params.posterUrl,
        type: params.type,
        season: params.season,
        episode: params.episode,
        quality: params.quality,
        size: params.size,
        downloadedAt: Date.now(),
        status: "downloading",
        progress: 0,
      };

      await upsertDownload(item);
      await refresh();

      try {
        await downloadVideo(
          id,
          params.proxyUrl,
          async (pct) => {
            item.progress = pct;
            await upsertDownload({ ...item, status: "downloading" });
            setDownloads((prev) =>
              prev.map((d) => (d.id === id ? { ...d, progress: pct } : d))
            );
          },
          controller.signal,
        );

        item.status = "completed";
        item.progress = 100;
        await upsertDownload(item);
      } catch (err: any) {
        if (err?.name === "AbortError") {
          await deleteDownload(id);
        } else {
          item.status = "error";
          item.errorMessage = err?.message ?? "Unknown error";
          await upsertDownload(item);
        }
      } finally {
        activeDownloads.delete(id);
        await refresh();
      }
    },
    [refresh],
  );

  /** Cancel an in-progress download. */
  const cancelDownload = useCallback(
    async (id: string) => {
      activeDownloads.get(id)?.abort();
      activeDownloads.delete(id);
      await deleteDownload(id);
      await refresh();
    },
    [refresh],
  );

  /** Remove a completed download from storage. */
  const removeDownload = useCallback(
    async (id: string) => {
      activeDownloads.get(id)?.abort();
      activeDownloads.delete(id);
      await deleteDownload(id);
      await refresh();
    },
    [refresh],
  );

  /** Return a blob URL for a completed download (caller must revoke it). */
  const getBlobUrl = useCallback(async (id: string): Promise<string | null> => {
    const blob = await getBlob(id);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }, []);

  const isDownloading = useCallback(
    (id: string) => activeDownloads.has(id),
    [],
  );

  return {
    downloads,
    refresh,
    startDownload,
    cancelDownload,
    removeDownload,
    getBlobUrl,
    isDownloading,
  };
}

/** One-shot hook to check whether a specific item is already downloaded. */
export function useDownloadStatus(id: string) {
  const [item, setItem] = useState<DownloadItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDownload(id).then((d) => {
      if (!cancelled) setItem(d ?? null);
    });
    return () => { cancelled = true; };
  }, [id]);

  return item;
}
