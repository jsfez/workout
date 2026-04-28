import { createServer as createHttpServer } from "node:http";
import process from "node:process";
import { createServer as createViteServer } from "vite";
import progressHandler from "../api/progress.ts";
import sessionsHandler from "../api/sessions.ts";
import usersHandler from "../api/users.ts";

const host = "127.0.0.1";
const port = Number(process.env.PORT ?? "3000");

const apiRoutes = new Map([
  ["/api/progress", progressHandler],
  ["/api/sessions", sessionsHandler],
  ["/api/users", usersHandler],
]);

const vite = await createViteServer({
  appType: "spa",
  server: {
    host,
    hmr: false,
    middlewareMode: true,
  },
});

const server = createHttpServer((req, res) => {
  const requestUrl = new URL(
    req.url ?? "/",
    `http://${req.headers.host ?? `${host}:${port}`}`,
  );
  const routeHandler = apiRoutes.get(requestUrl.pathname);

  if (routeHandler) {
    void routeHandler(req, res);
    return;
  }

  vite.middlewares(req, res, (error: unknown) => {
    if (error) {
      vite.ssrFixStacktrace(error as Error);
      res.statusCode = 500;
      res.end(error instanceof Error ? error.stack : String(error));
      return;
    }

    res.statusCode = 404;
    res.end("Not found");
  });
});

async function shutdown(exitCode = 0) {
  await Promise.allSettled([
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    ),
    vite.close(),
  ]);
  process.exit(exitCode);
}

server.listen(port, host, () => {
  process.stdout.write(
    `Playwright test server listening on http://${host}:${port}\n`,
  );
});

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});
