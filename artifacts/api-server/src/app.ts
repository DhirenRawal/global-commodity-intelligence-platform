import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const staticCandidates = [
  path.resolve(process.cwd(), "artifacts/commodities/dist/public"),
  path.resolve(process.cwd(), "../commodities/dist/public"),
  path.resolve(currentDir, "../../commodities/dist/public"),
];
const staticDir = staticCandidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html")));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (staticDir) {
  app.use(express.static(staticDir, { index: false, maxAge: "1h" }));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(staticDir, "index.html"));
  });
} else if (process.env.NODE_ENV === "production") {
  logger.warn({ candidates: staticCandidates }, "Static frontend build not found");
}

export default app;
