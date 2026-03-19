import { Router } from "express";
import {
  listIndustries,
  createIndustry,
  listRoles,
  createRole,
  listSkills,
  createSkill
} from "../controllers/masterdata.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { onlyCompany } from "../middlewares/role.middleware.js";

const router = Router();

router.route("/industries").get(verifyJWT, listIndustries);
router.route("/industries").post(verifyJWT, onlyCompany, createIndustry);

router.route("/roles").get(verifyJWT, listRoles);
router.route("/roles").post(verifyJWT, onlyCompany, createRole);

router.route("/skills").get(verifyJWT, listSkills);
router.route("/skills").post(verifyJWT, onlyCompany, createSkill);

export default router;
