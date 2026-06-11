import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import passportInstance from "../lib/passport";
import { ENV } from "../config/env";

const router = Router();

function makeJwt(user: { id: string; email: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email },
    ENV.JWT_SECRET,
    { expiresIn: 60 * 60 * 24 * 7 }
  );
}

function oauthSuccess(req: Request, res: Response) {
  const user = req.user as unknown as { id: string; email: string } | undefined;
  if (!user) {
    return res.redirect(
      `${ENV.FRONTEND_URL}/login?error=oauth_failed`
    );
  }
  const token = makeJwt(user);
  res.redirect(`${ENV.FRONTEND_URL}/auth/callback?token=${token}`);
}

function oauthFailure(_req: Request, res: Response) {
  res.redirect(`${ENV.FRONTEND_URL}/login?error=oauth_failed`);
}

// ── Google ────────────────────────────────────────────────────────────────────

router.get(
  "/google",
  (req: Request, res: Response, next: NextFunction) => {
    if (!ENV.GOOGLE_CLIENT_ID) {
      return res.redirect(`${ENV.FRONTEND_URL}/login?error=provider_not_configured`);
    }
    passportInstance.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  }
);

router.get(
  "/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    passportInstance.authenticate("google", { session: false, failureRedirect: `${ENV.FRONTEND_URL}/login?error=oauth_failed` })(req, res, next);
  },
  oauthSuccess
);

// ── GitHub ────────────────────────────────────────────────────────────────────

router.get(
  "/github",
  (req: Request, res: Response, next: NextFunction) => {
    if (!ENV.GITHUB_CLIENT_ID) {
      return res.redirect(`${ENV.FRONTEND_URL}/login?error=provider_not_configured`);
    }
    passportInstance.authenticate("github", { scope: ["user:email"] })(req, res, next);
  }
);

router.get(
  "/github/callback",
  (req: Request, res: Response, next: NextFunction) => {
    passportInstance.authenticate("github", { session: false, failureRedirect: `${ENV.FRONTEND_URL}/login?error=oauth_failed` })(req, res, next);
  },
  oauthSuccess
);

// ── Apple ─────────────────────────────────────────────────────────────────────

router.get(
  "/apple",
  (req: Request, res: Response, next: NextFunction) => {
    if (!ENV.APPLE_CLIENT_ID) {
      return res.redirect(`${ENV.FRONTEND_URL}/login?error=provider_not_configured`);
    }
    passportInstance.authenticate("apple")(req, res, next);
  }
);

// Apple uses POST callback
router.post(
  "/apple/callback",
  (req: Request, res: Response, next: NextFunction) => {
    passportInstance.authenticate("apple", { session: false, failureRedirect: `${ENV.FRONTEND_URL}/login?error=oauth_failed` })(req, res, next);
  },
  oauthSuccess
);

router.get("/apple/callback", oauthFailure);

export default router;
