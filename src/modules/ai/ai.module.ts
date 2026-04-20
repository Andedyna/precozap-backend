// ─── Service ─────────────────────────────────────────────────────────────────
import { AIProvider, AIQueryInput, AIQueryOutput, MockAIProvider, AnthropicAIProvider } from "../../infra/providers/aiProviders";
import { productRepository } from "../products/product.repository";
import { env } from "../../shared/config/env";
import { logger } from "../../shared/utils/logger";

class AIService {
  private provider: AIProvider;

  constructor() {
    if (env.anthropicApiKey) {
      this.provider = new AnthropicAIProvider(env.anthropicApiKey);
      logger.info("🤖 AI Provider: Anthropic Claude");
    } else {
      this.provider = new MockAIProvider();
      logger.info("🤖 AI Provider: Mock (set ANTHROPIC_API_KEY for real AI)");
    }
  }

  async query(input: AIQueryInput): Promise<AIQueryOutput & { relatedProducts: ReturnType<typeof productRepository.findById>[] }> {
    const allProducts = productRepository.findAll();

    const enrichedInput: AIQueryInput = {
      ...input,
      context: {
        ...input.context,
        products: allProducts.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          brand: p.brand,
          bestPrice: p.bestPrice,
          bestMarketplace: p.bestMarketplace,
          rating: p.rating,
          tags: p.tags,
        })),
      },
    };

    const result = await this.provider.query(enrichedInput);

    // Search for related products based on AI response
    let relatedProducts = [];
    if (result.productIds && result.productIds.length > 0) {
      relatedProducts = result.productIds
        .map((id) => productRepository.findById(id))
        .filter(Boolean);
    } else if (result.intent && result.intent !== "general") {
      relatedProducts = productRepository
        .search(result.intent)
        .slice(0, 3)
        .map((p) => productRepository.findById(p.id))
        .filter(Boolean);
    }

    return { ...result, relatedProducts };
  }

  getProviderInfo(): { name: string; isReal: boolean } {
    return {
      name: env.anthropicApiKey ? "Anthropic Claude" : "Mock AI",
      isReal: Boolean(env.anthropicApiKey),
    };
  }
}

export const aiService = new AIService();

// ─── Controller ──────────────────────────────────────────────────────────────
import { Request, Response } from "express";
import { sendSuccess, sendError, sendServerError } from "../../shared/utils/response";

export class AIController {
  async query(req: Request, res: Response): Promise<void> {
    try {
      const { message, conversationHistory } = req.body;

      if (!message || typeof message !== "string" || message.trim().length < 3) {
        sendError(res, "Message must be at least 3 characters");
        return;
      }

      if (message.trim().length > 500) {
        sendError(res, "Message too long (max 500 characters)");
        return;
      }

      const result = await aiService.query({
        message: message.trim(),
        conversationHistory: conversationHistory || [],
      });

      sendSuccess(res, result);
    } catch (error) {
      logger.error("AI query failed", error);
      sendServerError(res, error);
    }
  }

  getStatus(_req: Request, res: Response): void {
    sendSuccess(res, aiService.getProviderInfo());
  }
}

export const aiController = new AIController();

// ─── Routes ──────────────────────────────────────────────────────────────────
import { Router } from "express";
import rateLimit from "express-rate-limit";

const aiRouter = Router();

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, error: "Too many AI requests, please try again in a minute" },
  standardHeaders: true,
  legacyHeaders: false,
});

aiRouter.post("/query", aiRateLimit, aiController.query.bind(aiController));
aiRouter.get("/status", aiController.getStatus.bind(aiController));

export default aiRouter;
