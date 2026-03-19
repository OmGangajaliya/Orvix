import {
  listIndustriesService,
  createIndustryService,
  listRolesService,
  createRoleService,
  listSkillsService,
  createSkillService
} from "../services/masterdata.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const listIndustries = async (req, res, next) => {
  try {
    const industries = await listIndustriesService();
    res.status(200).json(new ApiResponse(200, industries, "Industries fetched"));
  } catch (err) {
    next(err);
  }
};

const createIndustry = async (req, res, next) => {
  try {
    const { industry_name } = req.body;
    if (!industry_name) throw new ApiError(400, "industry_name is required");

    const industry = await createIndustryService(industry_name.trim().toLowerCase());
    res.status(201).json(new ApiResponse(201, industry, "Industry saved"));
  } catch (err) {
    next(err);
  }
};

const listRoles = async (req, res, next) => {
  try {
    const roles = await listRolesService();
    res.status(200).json(new ApiResponse(200, roles, "Roles fetched"));
  } catch (err) {
    next(err);
  }
};

const createRole = async (req, res, next) => {
  try {
    const { role_name, parent_role_id } = req.body;
    if (!role_name) throw new ApiError(400, "role_name is required");

    const role = await createRoleService({
      role_name: role_name.trim().toLowerCase(),
      parent_role_id: parent_role_id || null
    });

    res.status(201).json(new ApiResponse(201, role, "Role saved"));
  } catch (err) {
    next(err);
  }
};

const listSkills = async (req, res, next) => {
  try {
    const skills = await listSkillsService();
    res.status(200).json(new ApiResponse(200, skills, "Skills fetched"));
  } catch (err) {
    next(err);
  }
};

const createSkill = async (req, res, next) => {
  try {
    const { skill_name, category } = req.body;
    if (!skill_name) throw new ApiError(400, "skill_name is required");

    const skill = await createSkillService({
      skill_name: skill_name.trim().toLowerCase(),
      category: category || null
    });

    res.status(201).json(new ApiResponse(201, skill, "Skill saved"));
  } catch (err) {
    next(err);
  }
};

export {
  listIndustries,
  createIndustry,
  listRoles,
  createRole,
  listSkills,
  createSkill
};
