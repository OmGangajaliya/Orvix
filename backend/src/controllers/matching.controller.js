import {
  upsertMatchScoreService,
  listMatchScoresForJobService,
  listMyMatchScoresService,
  createHiringFeedbackService,
  listHiringFeedbackForJobService
} from "../services/matching.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createMatchScore = async (req, res, next) => {
  try {
    const { candidate_id, job_id } = req.body;
    if (!candidate_id || !job_id) {
      throw new ApiError(400, "candidate_id and job_id are required");
    }

    const score = await upsertMatchScoreService(req.body);
    res.status(201).json(new ApiResponse(201, score, "Match score created"));
  } catch (err) {
    next(new ApiError(400, err.message || "Failed to create match score"));
  }
};

const getJobMatchScores = async (req, res, next) => {
  try {
    const data = await listMatchScoresForJobService(req.user.id, req.params.jobId);
    res.status(200).json(new ApiResponse(200, data, "Match scores fetched"));
  } catch (err) {
    next(new ApiError(400, err.message || "Failed to fetch match scores"));
  }
};

const getMyMatchScores = async (req, res, next) => {
  try {
    const data = await listMyMatchScoresService(req.user.id);
    res.status(200).json(new ApiResponse(200, data, "My match scores fetched"));
  } catch (err) {
    next(new ApiError(400, err.message || "Failed to fetch your match scores"));
  }
};

const createHiringFeedback = async (req, res, next) => {
  try {
    const { candidate_id, job_id, decision } = req.body;
    if (!candidate_id || !job_id || !decision) {
      throw new ApiError(400, "candidate_id, job_id and decision are required");
    }

    const feedback = await createHiringFeedbackService(req.user.id, req.body);
    res.status(201).json(new ApiResponse(201, feedback, "Hiring feedback saved"));
  } catch (err) {
    next(new ApiError(400, err.message || "Failed to save hiring feedback"));
  }
};

const getHiringFeedbackForJob = async (req, res, next) => {
  try {
    const data = await listHiringFeedbackForJobService(req.user.id, req.params.jobId);
    res.status(200).json(new ApiResponse(200, data, "Hiring feedback fetched"));
  } catch (err) {
    next(new ApiError(400, err.message || "Failed to fetch hiring feedback"));
  }
};

export {
  createMatchScore,
  getJobMatchScores,
  getMyMatchScores,
  createHiringFeedback,
  getHiringFeedbackForJob
};
