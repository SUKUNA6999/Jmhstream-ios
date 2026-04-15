// IndexedDB wrapper for offline download management.
// Videos are stored entirely in the browser's sandboxed storage —
// they are NEVER saved to the device gallery or file system.

const DB_NAME = "jmh-downloads";
const DB_VERSION = 1;
const STORE_META = "downloads";
const STORE_BLOBS = "blobs";

export interface DownloadItem {
  /** Unique key: `{subjectId}` for movies, `{subjectId}-s{season}e{episode}` for TV */
  id: string;
  subjectId: string;
  title: string;
  posterUrl: string | null;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
  quality: number;
  size: string | null;
  downloadedAt: number;
  status: "pending" | "downloading" | "completed" | "error";
  progress: number; // 0-100
  errorMessage?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS); // key = download id
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllDownloads(): Promise<DownloadItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readonly");
    const req = tx.objectStore(STORE_META).getAll();
    req.onsuccess = () => resolve(req.result as DownloadItem[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getDownload(id: string): Promise<DownloadItem | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readonly");
    const req = tx.objectStore(STORE_META).get(id);
    req.onsuccess = () => resolve(req.result as DownloadItem | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function upsertDownload(item: DownloadItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readwrite");
    const req = tx.objectStore(STORE_META).put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDownload(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_META, STORE_BLOBS], "readwrite");
    tx.objectStore(STORE_META).delete(id);
    tx.objectStore(STORE_BLOBS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, "readwrite");
    const req = tx.objectStore(STORE_BLOBS).put(blob, id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getBlob(id: string): Promise<Blob | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, "readonly");
    const req = tx.objectStore(STORE_BLOBS).get(id);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Download a video from the given URL (via /api/video-proxy to avoid CORS),
 * store the blob in IndexedDB, and report progress via a callback.
 *
 * All downloaded data is kept inside the browser's sandboxed storage —
 * it never touches the device file system or gallery.
 */
export async function downloadVideo(
  id: string,
  proxyUrl: string,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(proxyUrl, { signal });
  if (!response.ok || !response.body) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? "0");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    chunks.push(value);
    received += value.length;
    if (contentLength > 0) {
      onProgress(Math.round((received / contentLength) * 100));
    }
  }

  const blob = new Blob(chunks, { type: "video/mp4" });
  await saveBlob(id, blob);
}
