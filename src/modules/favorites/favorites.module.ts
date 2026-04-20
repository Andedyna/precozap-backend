// ─── Repository ──────────────────────────────────────────────────────────────
type Favorite = any;
const db = { favorites: new Map() };

export class FavoriteRepository {
  findByUser(userId: string): Favorite[] {
    return Array.from(db.favorites.values()).filter(
      (f) => f.userId === userId
    );
  }

  findByUserAndProduct(userId: string, productId: string): Favorite | null {
    return (
      Array.from(db.favorites.values()).find(
        (f) => f.userId === userId && f.productId === productId
      ) ?? null
    );
  }

  save(favorite: Favorite): Favorite {
    db.favorites.set(favorite.id, favorite);
    return favorite;
  }

  delete(id: string): boolean {
    return db.favorites.delete(id);
  }

  updatePriceAlert(id: string, priceAlert: number): Favorite | null {
    const fav = db.favorites.get(id);
    if (!fav) return null;
    fav.priceAlert = priceAlert;
    db.favorites.set(id, fav);
    return fav;
  }
}

export const favoriteRepository = new FavoriteRepository();

// ─── Service ─────────────────────────────────────────────────────────────────
import { productRepository } from "../products/product.repository";
import { Product } from "../../shared/database/inMemoryDb";

export interface FavoriteWithProduct extends Favorite {
  product: Product | null;
}

export class FavoriteService {
  getUserFavorites(userId: string): FavoriteWithProduct[] {
    const favorites = favoriteRepository.findByUser(userId);
    return favorites.map((f) => ({
      ...f,
      product: productRepository.findById(f.productId),
    }));
  }

  addFavorite(userId: string, productId: string, priceAlert?: number): FavoriteWithProduct {
    const existing = favoriteRepository.findByUserAndProduct(userId, productId);
    if (existing) {
      return { ...existing, product: productRepository.findById(productId) };
    }

    const favorite: Favorite = {
      id: db.generateId(),
      userId,
      productId,
      priceAlert,
      createdAt: new Date().toISOString(),
    };

    favoriteRepository.save(favorite);
    return { ...favorite, product: productRepository.findById(productId) };
  }

  removeFavorite(userId: string, productId: string): boolean {
    const existing = favoriteRepository.findByUserAndProduct(userId, productId);
    if (!existing) return false;
    return favoriteRepository.delete(existing.id);
  }

  setPriceAlert(userId: string, productId: string, priceAlert: number): Favorite | null {
    const existing = favoriteRepository.findByUserAndProduct(userId, productId);
    if (!existing) return null;
    return favoriteRepository.updatePriceAlert(existing.id, priceAlert);
  }

  isFavorite(userId: string, productId: string): boolean {
    return Boolean(favoriteRepository.findByUserAndProduct(userId, productId));
  }
}

export const favoriteService = new FavoriteService();

// ─── Controller ──────────────────────────────────────────────────────────────
import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/middlewares/auth";
import { sendSuccess, sendError, sendServerError } from "../../shared/utils/response";

export class FavoriteController {
  getAll(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user!.userId;
      const favorites = favoriteService.getUserFavorites(userId);
      sendSuccess(res, favorites, { total: favorites.length });
    } catch (error) {
      sendServerError(res, error);
    }
  }

  add(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user!.userId;
      const { productId, priceAlert } = req.body;

      if (!productId) {
        sendError(res, "productId is required");
        return;
      }

      const product = productRepository.findById(productId);
      if (!product) {
        sendError(res, "Product not found", 404);
        return;
      }

      const favorite = favoriteService.addFavorite(
        userId,
        productId,
        priceAlert ? parseFloat(priceAlert) : undefined
      );
      sendSuccess(res, favorite, undefined, 201);
    } catch (error) {
      sendServerError(res, error);
    }
  }

  remove(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user!.userId;
      const { productId } = req.params;
      const removed = favoriteService.removeFavorite(userId, productId);
      if (!removed) {
        sendError(res, "Favorite not found", 404);
        return;
      }
      sendSuccess(res, { removed: true });
    } catch (error) {
      sendServerError(res, error);
    }
  }

  setPriceAlert(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user!.userId;
      const { productId } = req.params;
      const { priceAlert } = req.body;

      if (!priceAlert || isNaN(parseFloat(priceAlert))) {
        sendError(res, "Valid priceAlert is required");
        return;
      }

      const updated = favoriteService.setPriceAlert(userId, productId, parseFloat(priceAlert));
      if (!updated) {
        sendError(res, "Favorite not found", 404);
        return;
      }
      sendSuccess(res, updated);
    } catch (error) {
      sendServerError(res, error);
    }
  }
}

export const favoriteController = new FavoriteController();

// ─── Routes ──────────────────────────────────────────────────────────────────
import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";

const favoriteRouter = Router();

favoriteRouter.use(requireAuth);

favoriteRouter.get("/", favoriteController.getAll.bind(favoriteController));
favoriteRouter.post("/", favoriteController.add.bind(favoriteController));
favoriteRouter.delete("/:productId", favoriteController.remove.bind(favoriteController));
favoriteRouter.patch("/:productId/alert", favoriteController.setPriceAlert.bind(favoriteController));

export default favoriteRouter;
