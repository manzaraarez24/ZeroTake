import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { generateUploadUrl } from "../lib/s3";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.use(authMiddleware);

/**
 * POST /api/upload/presigned-url
 * Generate a presigned URL for uploading a file to S3
 * Body: { fileName, contentType }
 */
router.post("/presigned-url", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fileName, contentType } = req.body;
    
    if (!fileName || !contentType) {
      res.status(400).json({ error: "fileName and contentType are required." });
      return;
    }

    const userId = req.user!.userId;
    // Store in a folder specific to the creator
    const uniqueKey = `${userId}/${uuidv4()}-${fileName}`;

    const url = await generateUploadUrl(uniqueKey, contentType);

    res.json({
      uploadUrl: url,
      key: uniqueKey,
    });
  } catch (err) {
    console.error("Presigned URL generation error:", err);
    res.status(500).json({ error: "Failed to generate upload URL." });
  }
});

export default router;
