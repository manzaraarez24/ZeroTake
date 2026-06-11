import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

/**
 * GET /api/chat/:productId/context
 * Public — returns the product fields needed to power the AI chat system prompt.
 * Returns 403 if aiChatEnabled is false, 404 if product is not found / not published.
 */
router.get("/:productId/context", async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = req.params.productId as string;

    const product = await prisma.product.findFirst({
      where: { id: productId, isPublished: true },
      select: {
        title: true,
        description: true,
        price: true,
        aiChatEnabled: true,
        aiCustomContext: true,
      },
    });

    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }

    if (!product.aiChatEnabled) {
      res.status(403).json({ error: "Chat is not enabled for this product." });
      return;
    }

    res.json({
      title: product.title,
      description: product.description,
      price: product.price,
      aiCustomContext: product.aiCustomContext ?? "",
    });
  } catch (err: any) {
    console.error("Chat context error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
