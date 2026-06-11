import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

/**
 * GET /api/storefront/:slug
 * Public: fetch a creator's store info and published products by store slug.
 * Slug is the storeName lowercased with spaces replaced by hyphens.
 */
router.get("/:slug", async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const nameFromSlug = slug.replace(/-/g, " ");

    const creator = await prisma.user.findFirst({
      where: {
        storeName: { equals: nameFromSlug, mode: "insensitive" },
      },
      select: {
        id: true,
        storeName: true,
        products: {
          where: { isPublished: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            isPublished: true,
            aiChatEnabled: true,
            createdAt: true,
          },
        },
      },
    });

    if (!creator) {
      res.status(404).json({ error: "Store not found." });
      return;
    }

    res.json({ creator });
  } catch (err) {
    console.error("Storefront fetch error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
