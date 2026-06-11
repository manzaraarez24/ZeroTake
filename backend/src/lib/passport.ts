import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import prisma from "./prisma";
import { ENV } from "../config/env";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function uniqueStoreName(base: string): Promise<string> {
  const slug = base.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "Creator";
  let name = slug;
  let attempt = 0;
  while (await prisma.user.findUnique({ where: { storeName: name } })) {
    attempt++;
    name = `${slug} ${attempt}`;
  }
  return name;
}

// ── Google ────────────────────────────────────────────────────────────────────

if (ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: ENV.GOOGLE_CLIENT_ID,
        clientSecret: ENV.GOOGLE_CLIENT_SECRET,
        callbackURL: `${ENV.FRONTEND_URL.replace("3000", "4000")}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google profile"));

          let user = await prisma.user.findFirst({
            where: { OR: [{ googleId: profile.id }, { email }] },
          });

          if (user) {
            if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id },
              });
            }
          } else {
            const displayName = profile.displayName || email.split("@")[0];
            user = await prisma.user.create({
              data: {
                email,
                googleId: profile.id,
                storeName: await uniqueStoreName(displayName),
              },
            });
          }

          return done(null, user as unknown as Express.User);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

// ── GitHub ────────────────────────────────────────────────────────────────────

if (ENV.GITHUB_CLIENT_ID && ENV.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: ENV.GITHUB_CLIENT_ID,
        clientSecret: ENV.GITHUB_CLIENT_SECRET,
        callbackURL: `${ENV.FRONTEND_URL.replace("3000", "4000")}/api/auth/github/callback`,
        scope: ["user:email"],
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const email =
            profile.emails?.find((e: any) => e.primary)?.value ??
            profile.emails?.[0]?.value;

          if (!email) return done(new Error("No email from GitHub profile"));

          let user = await prisma.user.findFirst({
            where: { OR: [{ githubId: profile.id }, { email }] },
          });

          if (user) {
            if (!user.githubId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { githubId: profile.id },
              });
            }
          } else {
            const displayName = profile.displayName || profile.username || email.split("@")[0];
            user = await prisma.user.create({
              data: {
                email,
                githubId: profile.id,
                storeName: await uniqueStoreName(displayName),
              },
            });
          }

          return done(null, user as unknown as Express.User);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

// ── Apple ─────────────────────────────────────────────────────────────────────
// Requires: APPLE_CLIENT_ID (Services ID), APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY
// Get these from https://developer.apple.com/account/resources/identifiers/list

if (ENV.APPLE_CLIENT_ID && ENV.APPLE_TEAM_ID && ENV.APPLE_KEY_ID && ENV.APPLE_PRIVATE_KEY) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AppleStrategy = require("passport-apple");
  passport.use(
    new AppleStrategy(
      {
        clientID: ENV.APPLE_CLIENT_ID,
        teamID: ENV.APPLE_TEAM_ID,
        keyID: ENV.APPLE_KEY_ID,
        privateKeyString: ENV.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        callbackURL: `${ENV.FRONTEND_URL.replace("3000", "4000")}/api/auth/apple/callback`,
        passReqToCallback: false,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        _idToken: unknown,
        profile: any,
        done: any
      ) => {
        try {
          const appleId = profile.id;
          const email = profile.email;

          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { appleId },
                ...(email ? [{ email }] : []),
              ],
            },
          });

          if (user) {
            if (!user.appleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { appleId },
              });
            }
          } else {
            const displayName =
              profile.name
                ? `${profile.name.firstName ?? ""} ${profile.name.lastName ?? ""}`.trim()
                : (email?.split("@")[0] ?? "Creator");

            user = await prisma.user.create({
              data: {
                email: email ?? `apple_${appleId}@placeholder.zerotake`,
                appleId,
                storeName: await uniqueStoreName(displayName),
              },
            });
          }

          return done(null, user as unknown as Express.User);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

// Passport doesn't use sessions (JWT only), but needs minimal serialize/deserialize
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user as unknown as Express.User);
  } catch (err) {
    done(err);
  }
});

export default passport;
