import { Router } from "express";
import {
  createMatchScore,
  getJobMatchScores,
  getMyMatchScores,
  createHiringFeedback,
  getHiringFeedbackForJob
} from "../controllers/matching.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { onlyCandidate, onlyCompany } from "../middlewares/role.middleware.js";

const router = Router();

router.route("/scores").post(verifyJWT, onlyCompany, createMatchScore);
router.route("/scores/job/:jobId").get(verifyJWT, onlyCompany, getJobMatchScores);
router.route("/scores/mine").get(verifyJWT, onlyCandidate, getMyMatchScores);

router.route("/feedback").post(verifyJWT, onlyCompany, createHiringFeedback);
router.route("/feedback/job/:jobId").get(verifyJWT, onlyCompany, getHiringFeedbackForJob);

export default router;
