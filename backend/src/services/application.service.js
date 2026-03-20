import { pool } from "../db/connectDB.js";
import { calculateMatchScores, upsertMatchScore } from "./score.service.js";

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

  // Calculate and store match scores asynchronously
  try {
    const scores = await calculateMatchScores(candidate.id, jobId);
    if (scores.final_score !== null) {
      await upsertMatchScore(candidate.id, jobId, scores);
    }
  } catch (err) {
    console.warn("Match score calculation error (non-blocking):", err.message);
    // Non-blocking - application is created regardless of score calculation
  }

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
      COALESCE(
        NULLIF(c.total_experience_years, 0),
        NULLIF((ra.parsed_json->>'experience_years')::INT, 0),
        NULLIF(ROUND(exp_hist.years)::INT, 0),
        0
      ) AS total_experience_years,
      c.resume_url,
      COALESCE(ms.final_score, 0) AS final_score
    FROM applications a
    JOIN candidates c ON c.id = a.candidate_id
    JOIN users u ON u.id = c.user_id
    JOIN jobs j ON j.id = a.job_id
    LEFT JOIN LATERAL (
      SELECT parsed_json
      FROM resume_analysis ra
      WHERE ra.candidate_id = c.id
      ORDER BY ra.created_at DESC
      LIMIT 1
    ) ra ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        COALESCE(
          SUM(
            GREATEST(
              0,
              DATE_PART('year', AGE(COALESCE(cwh.end_date, CURRENT_DATE), cwh.start_date)) * 12 +
              DATE_PART('month', AGE(COALESCE(cwh.end_date, CURRENT_DATE), cwh.start_date))
            )
          ) / 12.0,
          0
        ) AS years
      FROM candidate_work_history cwh
      WHERE cwh.candidate_id = c.id
        AND cwh.start_date IS NOT NULL
    ) exp_hist ON TRUE
    LEFT JOIN match_scores ms ON ms.candidate_id = c.id AND ms.job_id = j.id
    WHERE a.job_id = $1 AND j.company_id = $2
    ORDER BY ms.final_score DESC NULLS LAST, a.applied_at DESC
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
