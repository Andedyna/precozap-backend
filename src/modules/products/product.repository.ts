import { prisma } from "../../shared/database/prisma";
import { Prisma } from "@prisma/client";

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  marketplace?: string;
  sort?: "price_asc" | "price_desc" | "newest";
}

export interface CreateProductDTO {
  name: string;
  category: string;
  image?: string;
  description?: string;
  rating?: number;
  reviews?: number;
  bestPrice?: number;
}

export interface AddPriceDTO {
  productId: string;
  marketplace: string;
  price: number;
  url?: string;
  originalPrice?: number;
  discount?: number;
  shipping?: string;
  inStock?: boolean;
  installments?: string;
}

export const productRepository = {

  // 🔧 FILTROS
  buildWhere(filters?: ProductFilters): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    if (filters?.category?.trim()) {
      where.category = filters.category.trim();
    }

    if (
      typeof filters?.minPrice === "number" ||
      typeof filters?.maxPrice === "number"
    ) {
      where.bestPrice = {};

      if (typeof filters.minPrice === "number") {
        where.bestPrice.gte = filters.minPrice;
      }

      if (typeof filters.maxPrice === "number") {
        where.bestPrice.lte = filters.maxPrice;
      }
    }

    if (filters?.marketplace?.trim()) {
      where.prices = {
        some: {
          marketplace: filters.marketplace.trim(),
        },
      };
    }

    return where;
  },

  // 🔧 ORDENAÇÃO
  buildOrder(sort?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case "price_asc":
        return { bestPrice: "asc" };
      case "price_desc":
        return { bestPrice: "desc" };
      default:
        return { createdAt: "desc" };
    }
  },

  // 🔍 LISTAR
  async findAll(filters?: ProductFilters) {
    return prisma.product.findMany({
      where: this.buildWhere(filters),
      orderBy: this.buildOrder(filters?.sort),
    });
  },

  // 🔍 POR ID COM RELAÇÕES (🔥 USADO NO FRONT)
  async findByIdWithRelations(id: string) {
    if (!id) return null;

    return prisma.product.findUnique({
      where: { id },
      include: {
        prices: {
          orderBy: { price: "asc" },
        },
        priceHistory: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });
  },

  // 🔍 POR ID SIMPLES
  async findById(id: string) {
    if (!id) return null;

    return prisma.product.findUnique({
      where: { id },
    });
  },

  // 🔍 SEARCH
  async search(query: string, filters?: ProductFilters) {
    if (!query || query.trim().length < 2) return [];

    const cleanQuery = query.trim();

    return prisma.product.findMany({
      where: {
        AND: [
          this.buildWhere(filters),
          {
            OR: [
              {
                name: {
                  contains: cleanQuery,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: cleanQuery,
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      orderBy: this.buildOrder(filters?.sort),
    });
  },

  // 🔥 CREATE
  async save(data: CreateProductDTO) {
    if (!data.name || !data.category) {
      throw new Error("name and category are required");
    }

    return prisma.product.create({
      data: {
        name: data.name.trim(),
        category: data.category.trim(),
        image: data.image ?? null,
        description: data.description?.trim() ?? "",
        rating: data.rating ?? 0,
        reviews: data.reviews ?? 0,
        bestPrice: data.bestPrice ?? 0,
      },
    });
  },

  // 📦 CATEGORIES
  async getCategories() {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    return categories.map((c) => c.category);
  },

  // 💰 ADD PRICE (🔥 VERSÃO FINAL PROFISSIONAL)
  async addPrice(data: AddPriceDTO) {
    const {
      productId,
      marketplace,
      price,
      url,
      originalPrice,
      discount,
      shipping,
      inStock,
      installments,
    } = data;

    if (!productId || !marketplace) {
      throw new Error("productId and marketplace are required");
    }

    const parsedPrice = Number(price);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      throw new Error("price must be greater than 0");
    }

    const cleanMarketplace = marketplace.trim();

    const cleanUrl =
      typeof url === "string" && url.startsWith("http") ? url : null;

    const productExists = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!productExists) {
      throw new Error("Product not found");
    }

    return prisma.$transaction(async (tx) => {

      // 🔥 EVITA DUPLICADO (MESMO PREÇO + MARKETPLACE)
      const existing = await tx.marketplacePrice.findFirst({
        where: {
          productId,
          marketplace: cleanMarketplace,
          price: parsedPrice,
        },
      });

      if (existing) {
        return existing;
      }

      const newPrice = await tx.marketplacePrice.create({
        data: {
          productId,
          marketplace: cleanMarketplace,
          price: parsedPrice,
          url: cleanUrl,
          originalPrice: originalPrice ?? null,
          discount: discount ?? null,
          shipping: shipping ?? null,
          inStock: inStock ?? true,
          installments: installments ?? null,
        },
      });

      await tx.priceHistory.create({
        data: {
          productId,
          price: parsedPrice,
          marketplace: cleanMarketplace,
        },
      });

      const prices = await tx.marketplacePrice.findMany({
        where: { productId },
        select: { price: true },
      });

      if (prices.length > 0) {
        const bestPrice = Math.min(...prices.map((p) => p.price));

        await tx.product.update({
          where: { id: productId },
          data: { bestPrice },
        });
      }

      return newPrice;
    });
  },
};