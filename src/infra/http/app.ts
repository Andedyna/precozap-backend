import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "../../shared/config/env";
import { errorHandler, notFoundHandler } from "../../shared/middlewares/errorHandler";
import { logger } from "../../shared/utils/logger";

// Routes
import productRoutes from "../../modules/products/product.routes";
import favoriteRoutes from "../../modules/favorites/favorites.module";
import userRoutes from "../../modules/users/users.module";
import aiRoutes from "../../modules/ai/ai.module";
import notificationRoutes from "../../modules/notifications/notifications.module";

const app = express();

// ─── Security & Parsing ───────────────────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: [env.frontendUrl, "http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────────────────────────────────

app.use(
  morgan(env.isDev ? "dev" : "combined", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// ─── Global Rate Limit ────────────────────────────────────────────────────────

const globalLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, error: "Too many requests" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimit);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/api/healthz", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "PreçoZap API",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use("/api/products", productRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
