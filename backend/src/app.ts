import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";

import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import trafficRoutes from "./routes/traffic";
import transitRoutes from "./routes/transit";
import environmentRoutes from "./routes/environment";
import bikeRoutes from "./routes/bikes";
import commuteRoutes from "./routes/commute";
import simulationRoutes from "./routes/simulation";

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Parsing & compression
app.use(compression());
app.use(express.json({ limit: "10kb" }));

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/traffic", trafficRoutes);
app.use("/api/transit", transitRoutes);
app.use("/api/environment", environmentRoutes);
app.use("/api/bikes", bikeRoutes);
app.use("/api/commute", commuteRoutes);
app.use("/api/simulation", simulationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
