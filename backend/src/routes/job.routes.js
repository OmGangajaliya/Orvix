import { Router } from "express";
import {
  createJob,
  listJobs,
  getJobById,
  updateJob,
  deleteJob
} from "../controllers/job.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { onlyCompany } from "../middlewares/role.middleware.js";

const router = Router();

router.route("/").get(verifyJWT, listJobs);
router.route("/").post(verifyJWT, onlyCompany, createJob);

router.route("/:id").get(verifyJWT, getJobById);
router.route("/:id").patch(verifyJWT, onlyCompany, updateJob);
router.route("/:id").delete(verifyJWT, onlyCompany, deleteJob);

export default router;
