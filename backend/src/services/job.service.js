import { pool } from "../db/connectDB.js";

const getCompanyByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `
    SELECT id, user_id, company_name
    FROM companies
    WHERE user_id = $1
    ORDER BY id DESC
    LIMIT 1
    `,
    [userId]
  );
  return rows[0] || null;
};

const ensureCompanyByUserId = async (userId, client) => {
  const existing = await getCompanyByUserId(userId, client);
  if (existing) return existing;

  const { rows } = await client.query(
    `
    INSERT INTO companies (user_id, company_name)
    VALUES (
      $1,
      COALESCE((SELECT NULLIF(name, '') FROM users WHERE id = $1), 'Company')
    )
    RETURNING id, user_id, company_name
    `,
    [userId]
  );

  return rows[0];
};

const syncJobSkills = async (client, jobId, skillIds = []) => {
  await client.query(`DELETE FROM job_skills WHERE job_id = $1`, [jobId]);

  if (!Array.isArray(skillIds) || skillIds.length === 0) return;

  const values = [];
  const placeholders = [];

  skillIds.forEach((skillId, index) => {
    const offset = index * 2;
    placeholders.push(`($${offset + 1}, $${offset + 2})`);
    values.push(jobId, skillId);
  });

  await client.query(
    `
    INSERT INTO job_skills (job_id, skill_id)
    VALUES ${placeholders.join(",")}
    ON CONFLICT (job_id, skill_id) DO NOTHING
    `,
    values
  );
};

const createJobService = async (companyUserId, payload) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const company = await ensureCompanyByUserId(companyUserId, client);

    const {
      role_id,
      title,
      description,
      industry_id = null,
      experience_required = null,
      location = null,
      salary_min = null,
      salary_max = null,
      employment_type = null,
      status = "active",
      skill_ids = []
    } = payload;

    const { rows } = await client.query(
      `
      INSERT INTO jobs (
        company_id, role_id, title, description, industry_id,
        experience_required, location, salary_min, salary_max,
        employment_type, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        company.id,
        role_id,
        title,
        description,
        industry_id,
        experience_required,
        location,
        salary_min,
        salary_max,
        employment_type,
        status
      ]
    );

    const job = rows[0];

    await syncJobSkills(client, job.id, skill_ids);
    await client.query("COMMIT");

    return job;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const listJobsService = async ({ status, company_id, industry_id, role_id }) => {
  const filters = [];
  const values = [];

  if (status) {
    values.push(status);
    filters.push(`j.status = $${values.length}`);
  }

  if (company_id) {
    values.push(company_id);
    filters.push(`j.company_id = $${values.length}`);
  }

  if (industry_id) {
    values.push(industry_id);
    filters.push(`j.industry_id = $${values.length}`);
  }

  if (role_id) {
    values.push(role_id);
    filters.push(`j.role_id = $${values.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `
    SELECT
      j.*,
      c.company_name,
      r.role_name,
      i.industry_name,
      COALESCE(
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT s.skill_name), NULL),
        '{}'
      ) AS skills
    FROM jobs j
    JOIN companies c ON c.id = j.company_id
    LEFT JOIN roles r ON r.id = j.role_id
    LEFT JOIN industries i ON i.id = j.industry_id
    LEFT JOIN job_skills js ON js.job_id = j.id
    LEFT JOIN skills s ON s.id = js.skill_id
    ${whereClause}
    GROUP BY j.id, c.company_name, r.role_name, i.industry_name
    ORDER BY j.created_at DESC
    `,
    values
  );

  return rows;
};

const getJobByIdService = async (jobId) => {
  const { rows } = await pool.query(
    `
    SELECT
      j.*,
      c.company_name,
      r.role_name,
      i.industry_name,
      COALESCE(
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT s.skill_name), NULL),
        '{}'
      ) AS skills,
      COALESCE(
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT s.id), NULL),
        '{}'
      ) AS skill_ids
    FROM jobs j
    JOIN companies c ON c.id = j.company_id
    LEFT JOIN roles r ON r.id = j.role_id
    LEFT JOIN industries i ON i.id = j.industry_id
    LEFT JOIN job_skills js ON js.job_id = j.id
    LEFT JOIN skills s ON s.id = js.skill_id
    WHERE j.id = $1
    GROUP BY j.id, c.company_name, r.role_name, i.industry_name
    `,
    [jobId]
  );

  return rows[0];
};

const updateJobService = async (companyUserId, jobId, payload) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const company = await ensureCompanyByUserId(companyUserId, client);
    if (!company) {
      throw new Error("Company profile not found for this user");
    }

    const existing = await client.query(
      `SELECT * FROM jobs WHERE id = $1 AND company_id = $2`,
      [jobId, company.id]
    );

    if (existing.rows.length === 0) {
      throw new Error("Job not found or access denied");
    }

    const {
      role_id,
      title,
      description,
      industry_id,
      experience_required,
      location,
      salary_min,
      salary_max,
      employment_type,
      status,
      skill_ids
    } = payload;

    const { rows } = await client.query(
      `
      UPDATE jobs
      SET
        role_id = COALESCE($1, role_id),
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        industry_id = COALESCE($4, industry_id),
        experience_required = COALESCE($5, experience_required),
        location = COALESCE($6, location),
        salary_min = COALESCE($7, salary_min),
        salary_max = COALESCE($8, salary_max),
        employment_type = COALESCE($9, employment_type),
        status = COALESCE($10, status)
      WHERE id = $11 AND company_id = $12
      RETURNING *
      `,
      [
        role_id,
        title,
        description,
        industry_id,
        experience_required,
        location,
        salary_min,
        salary_max,
        employment_type,
        status,
        jobId,
        company.id
      ]
    );

    if (Array.isArray(skill_ids)) {
      await syncJobSkills(client, jobId, skill_ids);
    }

    await client.query("COMMIT");

    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteJobService = async (companyUserId, jobId) => {
  const company = await getCompanyByUserId(companyUserId);
  if (!company) {
    throw new Error("Company profile not found for this user");
  }

  const { rowCount } = await pool.query(
    `DELETE FROM jobs WHERE id = $1 AND company_id = $2`,
    [jobId, company.id]
  );

  return rowCount > 0;
};

export {
  createJobService,
  listJobsService,
  getJobByIdService,
  updateJobService,
  deleteJobService
};
