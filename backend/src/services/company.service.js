import { pool } from "../db/connectDB.js";

const createCompany = async ({
  user_id,
  company_name,
  website,
  location,
  description
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
      SELECT id
      FROM companies
      WHERE user_id = $1
      ORDER BY id DESC
      LIMIT 1
      `,
      [user_id]
    );

    if (existing.rows.length > 0) {
      const { rows } = await client.query(
        `
        UPDATE companies
        SET
          company_name = COALESCE($2, company_name),
          website = COALESCE($3, website),
          location = COALESCE($4, location),
          description = COALESCE($5, description)
        WHERE id = $1
        RETURNING *
        `,
        [
          existing.rows[0].id,
          company_name,
          website,
          location,
          description
        ]
      );

      await client.query("COMMIT");
      return rows[0];
    }

    const companyQuery = `
      INSERT INTO companies
      (user_id, company_name, website, location, description)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `;

    const { rows } = await client.query(companyQuery, [
      user_id,
      company_name,
      website,
      location,
      description
    ]);

    await client.query("COMMIT");

    return rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// company.service.js
const getCompanyByIdService = async (id) => {
  const { rows } = await pool.query(
    `SELECT * FROM companies WHERE id = $1`,
    [id]
  );
  return rows[0];
};

export { createCompany, getCompanyByIdService };