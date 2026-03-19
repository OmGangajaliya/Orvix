import { pool } from "../db/connectDB.js";

const getCandidateByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id FROM candidates WHERE user_id = $1`,
    [userId]
  );
  return rows[0];
};

const getCompanyByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id FROM companies WHERE user_id = $1`,
    [userId]
  );
  return rows[0];
};

const applyToJobService = async (candidateUserId, jobId) => {
  const candidate = await getCandidateByUserId(candidateUserId);
  if (!candidate) {
    throw new Error("Candidate profile not found for this user");
  }

  const { rows } = await pool.query(
    `
    INSERT INTO applications (candidate_id, job_id)
    VALUES ($1, $2)
    ON CONFLICT (candidate_id, job_id)
    DO UPDATE SET status = applications.status
    RETURNING *
    `,
    [candidate.id, jobId]
  );

  return rows[0];
};

const listMyApplicationsService = async (candidateUserId) => {
  const candidate = await getCandidateByUserId(candidateUserId);
  if (!candidate) {
    throw new Error("Candidate profile not found for this user");
  }

  const { rows } = await pool.query(
    `
    SELECT
      a.*,
      j.title AS job_title,
      j.location AS job_location,
      c.company_name
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE a.candidate_id = $1
    ORDER BY a.applied_at DESC
    `,
    [candidate.id]
  );

  return rows;
};

const listApplicationsForJobService = async (companyUserId, jobId) => {
  const company = await getCompanyByUserId(companyUserId);
  if (!company) {
    throw new Error("Company profile not found for this user");
  }

  const { rows } = await pool.query(
    `
    SELECT
      a.*,
      u.name AS candidate_name,
      u.email AS candidate_email,
      c.phone,
      c.location,
      c.profile_summary,
      c.total_experience_years,
      c.resume_url
    FROM applications a
    JOIN candidates c ON c.id = a.candidate_id
    JOIN users u ON u.id = c.user_id
    JOIN jobs j ON j.id = a.job_id
    WHERE a.job_id = $1 AND j.company_id = $2
    ORDER BY a.applied_at DESC
    `,
    [jobId, company.id]
  );

  return rows;
};

const updateApplicationStatusService = async (companyUserId, applicationId, status) => {
  const company = await getCompanyByUserId(companyUserId);
  if (!company) {
    throw new Error("Company profile not found for this user");
  }

  const { rows } = await pool.query(
    `
    UPDATE applications a
    SET status = $1
    FROM jobs j
    WHERE a.id = $2
      AND a.job_id = j.id
      AND j.company_id = $3
    RETURNING a.*
    `,
    [status, applicationId, company.id]
  );

  return rows[0];
};

export {
  applyToJobService,
  listMyApplicationsService,
  listApplicationsForJobService,
  updateApplicationStatusService
};
