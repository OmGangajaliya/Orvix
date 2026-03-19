import {
  createJobService,
  listJobsService,
  getJobByIdService,
  updateJobService,
  deleteJobService
} from "../services/job.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createJob = async (req, res, next) => {
  try {
    const { role_id, title, description } = req.body;
    if (!role_id || !title || !description) {
      throw new ApiError(400, "role_id, title, description are required");
    }

    const job = await createJobService(req.user.id, req.body);
    res.status(201).json(new ApiResponse(201, job, "Job created"));
  } catch (err) {
    next(new ApiError(400, err.message || "Failed to create job"));
  }
};

const listJobs = async (req, res, next) => {
  try {
    const jobs = await listJobsService(req.query);
    res.status(200).json(new ApiResponse(200, jobs, "Jobs fetched"));
  } catch (err) {
    next(err);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await getJobByIdService(req.params.id);
    if (!job) throw new ApiError(404, "Job not found");
    res.status(200).json(new ApiResponse(200, job, "Job fetched"));
  } catch (err) {
    next(err);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const updated = await updateJobService(req.user.id, req.params.id, req.body);
    if (!updated) throw new ApiError(404, "Job not found");
    res.status(200).json(new ApiResponse(200, updated, "Job updated"));
  } catch (err) {
    next(new ApiError(400, err.message || "Failed to update job"));
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const deleted = await deleteJobService(req.user.id, req.params.id);
    if (!deleted) throw new ApiError(404, "Job not found");
    res.status(200).json(new ApiResponse(200, {}, "Job deleted"));
  } catch (err) {
    next(new ApiError(400, err.message || "Failed to delete job"));
  }
};

export { createJob, listJobs, getJobById, updateJob, deleteJob };
