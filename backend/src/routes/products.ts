import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// All product routes require authentication
router.use(authMiddleware);

/**
 * GET /api/products
 * List all products for the authenticated creator.
 */
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      where: { creatorId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    res.json({ products });
  } catch (err) {
    console.error("List products error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * GET /api/products/:id
 * Get a single product by ID (must belong to the authenticated creator).
 */
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: String(req.params.id),
        creatorId: req.user!.userId,
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }

    res.json({ product });
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * POST /api/products
 * Create a new product.
 * Body: { title, description, price, fileUrl?, isPublished? }
 */
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, price, fileUrl, isPublished } = req.body;

    if (!title || !description || price === undefined) {
      res.status(400).json({
        error: "title, description, and price are required.",
      });
      return;
    }

    if (typeof price !== "number" || price < 0) {
      res.status(400).json({ error: "price must be a non-negative number." });
      return;
    }

    const product = await prisma.product.create({
      data: {
        creatorId: req.user!.userId,
        title,
        description,
        price,
        fileUrl: fileUrl || "",
        isPublished: isPublished || false,
      },
    });

    res.status(201).json({ product });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * PUT /api/products/:id
 * Update an existing product (must belong to the authenticated creator).
 * Body: { title?, description?, price?, fileUrl?, isPublished? }
 */
router.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: {
        id: String(req.params.id),
        creatorId: req.user!.userId,
      },
    });

    if (!existing) {
      res.status(404).json({ error: "Product not found." });
      return;
    }

    const { title, description, price, fileUrl, isPublished } = req.body;

    // Validate price if provided
    if (price !== undefined && (typeof price !== "number" || price < 0)) {
      res.status(400).json({ error: "price must be a non-negative number." });
      return;
    }

    const product = await prisma.product.update({
      where: { id: String(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    res.json({ product });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * DELETE /api/products/:id
 * Delete a product (must belong to the authenticated creator).
 */
router.delete(
  "/:id",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Verify ownership
      const existing = await prisma.product.findFirst({
        where: {
          id: String(req.params.id),
          creatorId: req.user!.userId,
        },
      });

      if (!existing) {
        res.status(404).json({ error: "Product not found." });
        return;
      }

      await prisma.product.delete({
        where: { id: String(req.params.id) },
      });

      res.json({ message: "Product deleted successfully." });
    } catch (err) {
      console.error("Delete product error:", err);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * GET /api/products/:id/download
 * Get a presigned download URL for a product's file (creator only for now).
 */
router.get("/:id/download", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: String(req.params.id),
        creatorId: req.user!.userId,
      },
    });

    if (!product || !product.fileUrl) {
      res.status(404).json({ error: "Product or file not found." });
      return;
    }

    // Assuming fileUrl stores the S3 key, e.g., "userId/uuid-filename"
    const { generateDownloadUrl } = await import("../lib/s3");
    const downloadUrl = await generateDownloadUrl(product.fileUrl);

    res.json({ url: downloadUrl });
  } catch (err) {
    console.error("Generate download URL error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
