import express from "express";
import cors from "cors";
import session from "express-session";
import { ENV } from "./config/env";
import passportInstance from "./lib/passport";
import authRoutes from "./routes/auth";
import oauthRoutes from "./routes/oauth";
import productRoutes from "./routes/products";
import stripeRoutes from "./routes/stripe";
import webhookRoutes from "./routes/webhooks";
import razorpayWebhookRoutes from "./routes/razorpayWebhooks";
import uploadRoutes from "./routes/upload";
import storefrontRoutes from "./routes/storefront";
import razorpayRoutes from "./routes/razorpay";
import chatContextRoutes from "./routes/chatContext";

const app = express();

// --------------- Middleware ---------------
app.use(
  cors({
    origin: ENV.FRONTEND_URL,
    credentials: true,
  })
);

// Session — used only during OAuth flow for state/CSRF validation
app.use(
  session({
    secret: ENV.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: ENV.NODE_ENV === "production", httpOnly: true, maxAge: 10 * 60 * 1000 },
  })
);

app.use(passportInstance.initialize());
app.use(passportInstance.session());

// Raw body parsers for webhooks — must come before express.json()
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }), webhookRoutes);
app.use("/api/webhooks/razorpay", express.raw({ type: "application/json" }), razorpayWebhookRoutes);

app.use(express.json());

// --------------- Routes ---------------
app.use("/api/auth", authRoutes);
app.use("/api/auth", oauthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/storefront", storefrontRoutes);
app.use("/api/chat", chatContextRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// --------------- Start Server ---------------
app.listen(ENV.PORT, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${ENV.PORT}`);
  console.log(`   Environment: ${ENV.NODE_ENV}`);
  console.log(`   Frontend URL: ${ENV.FRONTEND_URL}\n`);
});

export default app;
