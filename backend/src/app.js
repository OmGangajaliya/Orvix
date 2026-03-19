import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// 🔥 ROUTES
import authRoutes from "./routes/auth.routes.js";
import candidateRoutes from "./routes/candidate.routes.js";
import companyRoutes from "./routes/company.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import masterdataRoutes from "./routes/masterdata.routes.js";
import matchingRoutes from "./routes/matching.routes.js";
import { ApiError } from "./utils/ApiError.js";

app.use("/api/v1/auth", authRoutes);       // ✅ ADD THIS
app.use("/api/v1/candidate", candidateRoutes);
app.use("/api/v1/company", companyRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/meta", masterdataRoutes);
app.use("/api/v1/matching", matchingRoutes);

app.use((req, res, next) => {
  next(new ApiError(404, "Route not found"));
});

app.use((err, req, res, next) => {
  const statusCode = err?.statusCode || 500;
  const message = err?.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    errors: err?.errors || []
  });
});

export { app };