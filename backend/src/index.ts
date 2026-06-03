import express from "express";
import cors from "cors";
import { ENV } from "./config/env";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import stripeRoutes from "./routes/stripe";
import webhookRoutes from "./routes/webhooks";
import uploadRoutes from "./routes/upload";

const app = express();

// --------------- Middleware ---------------
app.use(
  cors({
    origin: ENV.FRONTEND_URL,
    credentials: true,
  })
);

// Register Stripe Webhook with RAW body parser before global JSON body parser
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json());

// --------------- Routes ---------------
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/upload", uploadRoutes);

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
