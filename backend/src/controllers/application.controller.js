import {
  applyToJobService,
  listMyApplicationsService,
  listApplicationsForJobService,
  updateApplicationStatusService
} from "../services/application.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const application = await applyToJobService(req.user.id, jobId);

    res.status(201).json(
      new ApiResponse(201, application, "Application submitted")
    );
  } catch (err) {
    next(new ApiError(400, err.message || "Failed to apply"));
  }
};

const listMyApplications = async (req, res, next) => {
  try {
    const applications = await listMyApplicationsService(req.user.id);
    res
      .status(200)
      .json(new ApiResponse(200, applications, "Applications fetched"));
  } catch (err) {
    next(new ApiError(400, err.message || "Failed to fetch applications"));
  }
};

const listApplicationsForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const applications = await listApplicationsForJobService(req.user.id, jobId);

    res
      .status(200)
      .json(new ApiResponse(200, applications, "Job applications fetched"));
  } catch (err) {
    next(new ApiError(400, err.message || "Failed to fetch job applications"));
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) throw new ApiError(400, "status is required");

    const updated = await updateApplicationStatusService(req.user.id, id, status);
    if (!updated) throw new ApiError(404, "Application not found");

    res.status(200).json(new ApiResponse(200, updated, "Application updated"));
  } catch (err) {
    next(new ApiError(400, err.message || "Failed to update application"));
  }
};

export {
  applyToJob,
  listMyApplications,
  listApplicationsForJob,
  updateApplicationStatus
};
