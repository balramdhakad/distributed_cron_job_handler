import { Router } from "express";
import jobControllers from "./job.controllers.js";

const router = Router();

router.post("/", jobControllers.createJob);

router.get("/", jobControllers.getAllJobsList);

router.put("/:id", jobControllers.updateJob);

router.get("/:id", jobControllers.getSingleList);

router.delete("/:id", jobControllers.deleteJob);

router.delete("/:id", jobControllers.getJobsExecutionHistory);
export default router;
