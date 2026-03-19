import { Router } from "express";
import { 
  onboardCandidate,
  getCandidateProfile,
  getCompanyForCandidate
} from "../controllers/candidate.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { onlyCandidate } from "../middlewares/role.middleware.js";
import { upload } from "../utils/multer.js";

const router = Router();

// 🔥 resume upload here
router.post("/onboard", verifyJWT, onlyCandidate, upload.single("resume_url"), onboardCandidate);

router.route("/profile").get(verifyJWT, onlyCandidate, getCandidateProfile);

router.route("/company/:id").get(verifyJWT, onlyCandidate, getCompanyForCandidate);

export default router;