import app from "./app";
import { env } from "../../shared/config/env";
import { logger } from "../../shared/utils/logger";
import { notificationService } from "../../modules/notifications/notifications.module";

// 🔥 Força aceitar localhost, 127.0.0.1 e rede local
const HOST = "0.0.0.0";

// 🚀 Start server
const server = app.listen(env.port, HOST, () => {
  logger.info(`🚀 PreçoZap API running on http://localhost:${env.port}`);
  logger.info(`🌍 Also accessible via http://127.0.0.1:${env.port}`);
  logger.info(`📦 Environment: ${env.nodeEnv}`);
  logger.info(`🌐 CORS allowed: ${env.frontendUrl}`);
  logger.info(`🤖 AI: ${env.anthropicApiKey ? "Anthropic Claude" : "Mock Mode"}`);

  logger.info(`📡 Endpoints:`);
  logger.info(`   GET  /api/healthz`);
  logger.info(`   GET  /api/products`);
  logger.info(`   GET  /api/products/search?q=`);
  logger.info(`   GET  /api/products/:id`);
  logger.info(`   GET  /api/products/:id/compare`);
  logger.info(`   GET  /api/products/:id/insights`);
  logger.info(`   POST /api/products`);
  logger.info(`   POST /api/auth/register`);
  logger.info(`   POST /api/auth/login`);
  logger.info(`   POST /api/auth/demo`);
  logger.info(`   GET  /api/favorites (auth required)`);
  logger.info(`   POST /api/favorites (auth required)`);
  logger.info(`   POST /api/ai/query`);
});

// 🔄 Background job (protegido contra crash)
const interval = setInterval(() => {
  try {
    logger.debug("Running price alert check...");
    notificationService.checkPriceAlerts();
  } catch (error) {
    logger.error("Error in price alert job:", error);
  }
}, 5 * 60 * 1000);

// 🛑 Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  clearInterval(interval);

  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ⚠️ Tratamento de erros globais (evita crash silencioso)
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
});

export default server;