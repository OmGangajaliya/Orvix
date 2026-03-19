import { pool } from "../db/connectDB.js";

const getCompanyByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id FROM companies WHERE user_id = $1`,
    [userId]
  );
  return rows[0];
};

const getCandidateByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id FROM candidates WHERE user_id = $1`,
    [userId]
  );
  return rows[0];
};

const verifyCompanyOwnsJob = async (companyId, jobId) => {
  const { rows } = await pool.query(
    `SELECT id FROM jobs WHERE id = $1 AND company_id = $2`,
    [jobId, companyId]
  );
  return rows[0];
};

const upsertMatchScoreService = async ({
  candidate_id,
  job_id,
  semantic_score = null,
  skill_score = null,
  industry_score = null,
  experience_score = null,
  final_score = null
}) => {
  const { rows } = await pool.query(
    `
    INSERT INTO match_scores (
      candidate_id, job_id, semantic_score, skill_score,
      industry_score, experience_score, final_score
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      candidate_id,
      job_id,
      semantic_score,
      skill_score,
      industry_score,
      experience_score,
      final_score
    ]
  );

  return rows[0];
};

const listMatchScoresForJobService = async (companyUserId, jobId) => {
  const company = await getCompanyByUserId(companyUserId);
  if (!company) throw new Error("Company profile not found");

  const ownsJob = await verifyCompanyOwnsJob(company.id, jobId);
  if (!ownsJob) throw new Error("Job not found or access denied");

  const { rows } = await pool.query(
    `
    SELECT
      ms.*,
      u.name AS candidate_name,
      u.email AS candidate_email
    FROM match_scores ms
    JOIN candidates c ON c.id = ms.candidate_id
    JOIN users u ON u.id = c.user_id
    WHERE ms.job_id = $1
    ORDER BY ms.final_score DESC NULLS LAST, ms.created_at DESC
    `,
    [jobId]
  );

  return rows;
};

const listMyMatchScoresService = async (candidateUserId) => {
  const candidate = await getCandidateByUserId(candidateUserId);
  if (!candidate) throw new Error("Candidate profile not found");

  const { rows } = await pool.query(
    `
    SELECT
      ms.*,
      j.title AS job_title,
      c.company_name
    FROM match_scores ms
    JOIN jobs j ON j.id = ms.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE ms.candidate_id = $1
    ORDER BY ms.final_score DESC NULLS LAST, ms.created_at DESC
    `,
    [candidate.id]
  );

  return rows;
};

const createHiringFeedbackService = async (companyUserId, payload) => {
  const company = await getCompanyByUserId(companyUserId);
  if (!company) throw new Error("Company profile not found");

  const { candidate_id, job_id, decision, notes = null } = payload;

  const ownsJob = await verifyCompanyOwnsJob(company.id, job_id);
  if (!ownsJob) throw new Error("Job not found or access denied");

  const { rows } = await pool.query(
    `
    INSERT INTO hiring_feedback (candidate_id, job_id, decision, notes)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [candidate_id, job_id, decision, notes]
  );

  await pool.query(
    `
    UPDATE applications
    SET status = $1
    WHERE candidate_id = $2 AND job_id = $3
    `,
    [decision, candidate_id, job_id]
  );

  return rows[0];
};

const listHiringFeedbackForJobService = async (companyUserId, jobId) => {
  const company = await getCompanyByUserId(companyUserId);
  if (!company) throw new Error("Company profile not found");

  const ownsJob = await verifyCompanyOwnsJob(company.id, jobId);
  if (!ownsJob) throw new Error("Job not found or access denied");

  const { rows } = await pool.query(
    `
    SELECT
      hf.*,
      u.name AS candidate_name,
      u.email AS candidate_email
    FROM hiring_feedback hf
    JOIN candidates c ON c.id = hf.candidate_id
    JOIN users u ON u.id = c.user_id
    WHERE hf.job_id = $1
    ORDER BY hf.created_at DESC
    `,
    [jobId]
  );

  return rows;
};

export {
  upsertMatchScoreService,
  listMatchScoresForJobService,
  listMyMatchScoresService,
  createHiringFeedbackService,
  listHiringFeedbackForJobService
};
