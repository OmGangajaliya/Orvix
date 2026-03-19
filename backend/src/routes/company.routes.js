import { Router } from "express";
import {
    onboardCompany,
    getCompanyProfile,
    getCandidateForCompany
} from "../controllers/company.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { onlyCompany } from "../middlewares/role.middleware.js";

const router = Router();

router.route("/onboard").post(verifyJWT, onlyCompany, onboardCompany);

router.route("/profile").get(verifyJWT, onlyCompany, getCompanyProfile);

router.route("/candidate/:id").get(verifyJWT, onlyCompany, getCandidateForCompany);

export default router;