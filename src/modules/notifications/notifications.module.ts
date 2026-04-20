// ─── Service ─────────────────────────────────────────────────────────────────
type Notification = any;

const db = {
  notifications: new Map()
};
import { productRepository } from "../products/product.repository";
import { favoriteRepository } from "../favorites/favorites.module";

export class NotificationService {
  getUserNotifications(userId: string): Notification[] {
    return Array.from(db.notifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markAsRead(notificationId: string, userId: string): boolean {
    const notification = db.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) return false;
    notification.read = true;
    db.notifications.set(notificationId, notification);
    return true;
  }

  markAllAsRead(userId: string): number {
    let count = 0;
    for (const [id, notif] of db.notifications.entries()) {
      if (notif.userId === userId && !notif.read) {
        notif.read = true;
        db.notifications.set(id, notif);
        count++;
      }
    }
    return count;
  }

  // Called by a background job (simulated) to check price drops
  checkPriceAlerts(): void {
    const favorites = Array.from(db.favorites.values()).filter(
      (f) => f.priceAlert !== undefined
    );

    for (const fav of favorites) {
      const product = productRepository.findById(fav.productId);
      if (!product || fav.priceAlert === undefined) continue;

      if (product.bestPrice <= fav.priceAlert) {
        const existingToday = Array.from(db.notifications.values()).find(
          (n) =>
            n.userId === fav.userId &&
            n.productId === fav.productId &&
            n.type === "price_drop" &&
            n.createdAt.startsWith(new Date().toISOString().split("T")[0])
        );

        if (!existingToday) {
          const notification: Notification = {
            id: db.generateId(),
            userId: fav.userId,
            productId: fav.productId,
            type: "price_drop",
            message: `🎉 Alerta de preço! **${product.name}** atingiu R$ ${product.bestPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} no ${product.bestMarketplace}. Você configurou alerta para R$ ${fav.priceAlert.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}!`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          db.notifications.set(notification.id, notification);
        }
      }
    }
  }

  getUnreadCount(userId: string): number {
    return Array.from(db.notifications.values()).filter(
      (n) => n.userId === userId && !n.read
    ).length;
  }
}

export const notificationService = new NotificationService();

// ─── Controller ──────────────────────────────────────────────────────────────
import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/middlewares/auth";
import { sendSuccess, sendError, sendServerError } from "../../shared/utils/response";

export class NotificationController {
  getAll(req: AuthenticatedRequest, res: Response): void {
    try {
      const notifications = notificationService.getUserNotifications(req.user!.userId);
      const unreadCount = notificationService.getUnreadCount(req.user!.userId);
      sendSuccess(res, notifications, { total: notifications.length, unreadCount });
    } catch (error) {
      sendServerError(res, error);
    }
  }

  markRead(req: AuthenticatedRequest, res: Response): void {
    try {
      const { id } = req.params;
      const success = notificationService.markAsRead(id, req.user!.userId);
      if (!success) {
        sendError(res, "Notification not found", 404);
        return;
      }
      sendSuccess(res, { read: true });
    } catch (error) {
      sendServerError(res, error);
    }
  }

  markAllRead(req: AuthenticatedRequest, res: Response): void {
    try {
      const count = notificationService.markAllAsRead(req.user!.userId);
      sendSuccess(res, { markedRead: count });
    } catch (error) {
      sendServerError(res, error);
    }
  }
}

export const notificationController = new NotificationController();

// ─── Routes ──────────────────────────────────────────────────────────────────
import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";

const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", notificationController.getAll.bind(notificationController));
notificationRouter.patch("/:id/read", notificationController.markRead.bind(notificationController));
notificationRouter.patch("/read-all", notificationController.markAllRead.bind(notificationController));

export default notificationRouter;
