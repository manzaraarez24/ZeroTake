// Global augmentation so that req.user (added by @types/passport) carries the
// JWT payload shape used by authMiddleware across all protected routes.
// Passport's OAuth verify callbacks attach a Prisma user transiently; those few
// spots cast explicitly (see lib/passport.ts and routes/oauth.ts).

import "express";

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
    }
  }
}

export {};
