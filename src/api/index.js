import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.js";
import jobRoutes from "./module/Jobs/job.routes.js";

const app = express();
app.use(express.json({ limit: "10KB" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

app.use("/api/v1/jobs", jobRoutes);

app.use(errorHandler);
export default app;
