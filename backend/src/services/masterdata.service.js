import { pool } from "../db/connectDB.js";

const listIndustriesService = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM industries ORDER BY industry_name ASC`
  );
  return rows;
};

const createIndustryService = async (industryName) => {
  const { rows } = await pool.query(
    `
    INSERT INTO industries (industry_name)
    VALUES ($1)
    ON CONFLICT (industry_name)
    DO UPDATE SET industry_name = EXCLUDED.industry_name
    RETURNING *
    `,
    [industryName]
  );
  return rows[0];
};

const listRolesService = async () => {
  const { rows } = await pool.query(
    `
    SELECT r.id, r.role_name, r.parent_role_id, p.role_name AS parent_role_name
    FROM roles r
    LEFT JOIN roles p ON p.id = r.parent_role_id
    ORDER BY r.role_name ASC
    `
  );
  return rows;
};

const createRoleService = async ({ role_name, parent_role_id = null }) => {
  const { rows } = await pool.query(
    `
    INSERT INTO roles (role_name, parent_role_id)
    VALUES ($1, $2)
    ON CONFLICT (role_name)
    DO UPDATE SET parent_role_id = EXCLUDED.parent_role_id
    RETURNING *
    `,
    [role_name, parent_role_id]
  );
  return rows[0];
};

const listSkillsService = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM skills ORDER BY skill_name ASC`
  );
  return rows;
};

const createSkillService = async ({ skill_name, category = null }) => {
  const { rows } = await pool.query(
    `
    INSERT INTO skills (skill_name, category)
    VALUES ($1, $2)
    ON CONFLICT (skill_name)
    DO UPDATE SET category = EXCLUDED.category
    RETURNING *
    `,
    [skill_name, category]
  );
  return rows[0];
};

export {
  listIndustriesService,
  createIndustryService,
  listRolesService,
  createRoleService,
  listSkillsService,
  createSkillService
};
