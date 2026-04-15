import type { Hono } from "hono";
import { createServer as createViteServer, createLogger } from "vite";
import { getRequestListener } from "@hono/node-server";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(server: Server, honoApp: Hono) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
      hmr: { server, path: "/vite-hmr" },
      allowedHosts: true as const,
    },
    appType: "custom",
  });

  const honoHandler = getRequestListener(honoApp.fetch);

  server.on("request", async (req, res) => {
    const url = req.url || "/";

    // API requests → Hono
    if (url.startsWith("/api/")) {
      return honoHandler(req, res);
    }

    // Everything else → Vite middleware (serves frontend with HMR)
    vite.middlewares(req, res, async (err?: Error) => {
      if (err) {
        viteLogger.error(err.message);
        res.statusCode = 500;
        res.end(err.message);
        return;
      }

      // Fallback: serve index.html for SPA routes
      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(url, template);
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        res.statusCode = 500;
        res.end((e as Error).message);
      }
    });
  });
}

