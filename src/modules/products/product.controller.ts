import { Request, Response } from "express";
import { productService } from "./product.service";
import {
  sendSuccess,
  sendNotFound,
  sendServerError,
  sendError,
} from "../../shared/utils/response";
import { AuthenticatedRequest } from "../../shared/middlewares/auth";

export class ProductController {

  // 🔧 PARSER SEGURO DE NÚMEROS
  private parseNumber(value: any): number | undefined {
    if (value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  // 🔧 BUILDER DE FILTROS
  private buildFilters(query: any) {
    return {
      category: typeof query.category === "string" ? query.category : undefined,
      minPrice: this.parseNumber(query.minPrice),
      maxPrice: this.parseNumber(query.maxPrice),
      marketplace:
        typeof query.marketplace === "string" ? query.marketplace : undefined,
      sort: typeof query.sort === "string" ? query.sort : undefined,
    };
  }

  // 🔥 CREATE PRODUCT
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, category } = req.body;

      if (!name || typeof name !== "string") {
        sendError(res, "Product name is required", 400);
        return;
      }

      if (!category || typeof category !== "string") {
        sendError(res, "Category is required", 400);
        return;
      }

      const product = await productService.create(req.body);

      sendSuccess(res, product, { created: true });
    } catch (error) {
      sendServerError(res, error);
    }
  }

  // 🔍 SEARCH
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;

      if (!search || typeof search !== "string" || search.trim().length < 2) {
        sendError(res, "Search must be at least 2 characters", 400);
        return;
      }

      const filters = this.buildFilters(req.query);

      const products = await productService.search(
        search.trim(),
        filters
      );

      sendSuccess(res, products || [], {
        total: products?.length || 0,
        search,
        filters,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }

  // 📦 GET ALL (COM SEARCH + SORT)
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;

      const filters = this.buildFilters(req.query);

      // 🔥 se tem busca → usa search
      if (search && typeof search === "string" && search.trim().length >= 2) {
        const products = await productService.search(
          search.trim(),
          filters
        );

        sendSuccess(res, products || [], {
          total: products?.length || 0,
          search,
          filters,
        });
        return;
      }

      const products = await productService.findAll(filters);

      sendSuccess(res, products || [], {
        total: products?.length || 0,
        filters,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }

  // 🔍 GET BY ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        sendError(res, "Product id is required", 400);
        return;
      }

      const product = await productService.findById(id);

      if (!product) {
        sendNotFound(res, "Product");
        return;
      }

      sendSuccess(res, product);
    } catch (error) {
      sendServerError(res, error);
    }
  }

  // 📊 COMPARE
  async compare(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await productService.compareProduct(id);

      if (!result) {
        sendNotFound(res, "Product");
        return;
      }

      sendSuccess(res, result);
    } catch (error) {
      sendServerError(res, error);
    }
  }

  // 📈 INSIGHTS
  async getPriceInsights(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const insights = await productService.getPriceInsights(id);

      if (!insights) {
        sendNotFound(res, "Product or price history");
        return;
      }

      sendSuccess(res, insights);
    } catch (error) {
      sendServerError(res, error);
    }
  }

  // 📦 CATEGORIES
  async getCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await productService.getCategories();

      sendSuccess(res, categories || []);
    } catch (error) {
      sendServerError(res, error);
    }
  }

  // 💰 ADD PRICE
  async addPrice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const {
        marketplace,
        price,
        url,
        originalPrice,
        discount,
        shipping,
        inStock,
        installments,
      } = req.body;

      if (!marketplace || typeof marketplace !== "string") {
        sendError(res, "marketplace is required", 400);
        return;
      }

      const parsedPrice = Number(price);

      if (!parsedPrice || parsedPrice <= 0) {
        sendError(res, "price must be greater than 0", 400);
        return;
      }

      const result = await productService.addPrice({
        productId: id,
        marketplace: marketplace.trim(),
        price: parsedPrice,
        url,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        discount: discount ? Number(discount) : undefined,
        shipping,
        inStock,
        installments,
      });

      sendSuccess(res, result, { created: true });
    } catch (error) {
      sendServerError(res, error);
    }
  }

  // 🖱️ TRACK CLICK
  async trackClick(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { marketplace, sessionId } = req.body;

      if (!marketplace) {
        sendError(res, "marketplace is required", 400);
        return;
      }

      await productService.trackClick(
        id,
        marketplace,
        req.user?.userId,
        sessionId || "anonymous"
      );

      sendSuccess(res, { tracked: true });
    } catch (error) {
      sendServerError(res, error);
    }
  }
}

export const productController = new ProductController();