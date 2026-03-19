import { Router } from "express";
import {
  applyToJob,
  listMyApplications,
  listApplicationsForJob,
  updateApplicationStatus
} from "../controllers/application.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { onlyCandidate, onlyCompany } from "../middlewares/role.middleware.js";

const router = Router();

router.route("/jobs/:jobId/apply").post(verifyJWT, onlyCandidate, applyToJob);
router.route("/mine").get(verifyJWT, onlyCandidate, listMyApplications);
router.route("/jobs/:jobId").get(verifyJWT, onlyCompany, listApplicationsForJob);
router.route("/:id/status").patch(verifyJWT, onlyCompany, updateApplicationStatus);

export default router;
