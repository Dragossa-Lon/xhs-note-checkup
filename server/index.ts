import "dotenv/config";
import express, { Response, NextFunction } from 'express';
import type { Request } from 'express';
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "node:http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // 服务同时提供 API 与前端资源。
  // 可通过环境变量 PORT 覆盖，默认 5000。
  // host 默认 localhost 仅本机访问；需要在 LAN/容器里暴露可设 HOST=0.0.0.0。
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "localhost";

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\n❌ 端口 ${port} 已被占用（macOS 上 AirPlay Receiver 默认占用 5000）。` +
          `\n   解决方式：` +
          `\n   1) 在 .env 里设置其他端口，例如 PORT=5173` +
          `\n   2) 或临时运行：PORT=5173 npm run dev` +
          `\n   3) 在 macOS 上也可以关闭：系统设置 → 通用 → 隔空投送接收器\n`
      );
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });

  httpServer.listen(port, host, () => {
    log(`✅ serving on http://${host}:${port}`);
  });
})();
