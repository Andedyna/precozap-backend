import { Router } from "express";
import { productController } from "./product.controller";
import { optionalAuth } from "../../shared/middlewares/auth";

const router = Router();

// 🔥 CREATE PRODUCT
// POST /api/products
router.post("/", productController.create.bind(productController));

// 🔍 SEARCH (ANTES DO /:id)
router.get("/search", productController.search.bind(productController));

// 📦 GET CATEGORIES
router.get("/categories", productController.getCategories.bind(productController));

// 📦 GET ALL PRODUCTS
router.get("/", productController.getAll.bind(productController));

/**
 * ⚠️ ROTAS COM :id DEVEM VIR POR ÚLTIMO
 */

// 📊 COMPARE PRODUCT
router.get("/:id/compare", productController.compare.bind(productController));

// 📈 PRICE INSIGHTS
router.get("/:id/insights", productController.getPriceInsights.bind(productController));

// 💰 ADD PRICE
router.post(
  "/:id/prices",
  productController.addPrice.bind(productController)
);

// 🖱️ TRACK CLICK
router.post(
  "/:id/track",
  optionalAuth,
  productController.trackClick.bind(productController)
);

// 🔍 GET BY ID (SEMPRE POR ÚLTIMO)
router.get("/:id", productController.getById.bind(productController));

export default router;