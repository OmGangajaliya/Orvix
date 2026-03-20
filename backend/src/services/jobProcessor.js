import { GoogleGenerativeAI } from "@google/generative-ai";
import { pool } from "../db/connectDB.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DEFAULT_JOB_EMBEDDING_DIMENSION = Number(
  process.env.JOB_EMBEDDING_DIMENSION || 768
);

function safeJSONParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON from Gemini");
    return JSON.parse(match[0]);
  }
}

function toNumericEmbeddingArray(embedding) {
  if (!embedding) throw new Error("Embedding is null/undefined");
  if (!Array.isArray(embedding)) throw new Error("Embedding must be an array");

  const normalized = embedding.map((value, index) => {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      throw new Error(`Invalid number at index ${index}`);
    }
    return num;
  });

  if (normalized.length !== DEFAULT_JOB_EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch: expected ${DEFAULT_JOB_EMBEDDING_DIMENSION}, got ${normalized.length}`
    );
  }

  return normalized;
}

function formatEmbeddingForPgvector(arr) {
  return `[${arr.join(",")}]`;
}

async function resolveSkillNames(conn, skills, jobId) {
  if (Array.isArray(skills) && skills.length > 0) {
    const first = skills[0];
    if (typeof first === "string") {
      return skills.map((skill) => String(skill).trim()).filter(Boolean);
    }

    if (typeof first === "number" || /^\d+$/.test(String(first))) {
      const ids = skills
        .map((skill) => Number(skill))
        .filter((skillId) => Number.isInteger(skillId));

      if (ids.length === 0) return [];

      const { rows } = await conn.query(
        `SELECT skill_name FROM skills WHERE id = ANY($1::int[])`,
        [ids]
      );

      return rows.map((row) => row.skill_name).filter(Boolean);
    }
  }

  if (!jobId) return [];

  const { rows } = await conn.query(
    `
    SELECT s.skill_name
    FROM job_skills js
    JOIN skills s ON s.id = js.skill_id
    WHERE js.job_id = $1
    ORDER BY s.skill_name ASC
    `,
    [jobId]
  );

  return rows.map((row) => row.skill_name).filter(Boolean);
}

async function saveJobEmbeddingToDB(conn, jobId, embedding) {
  const normalized = toNumericEmbeddingArray(embedding);
  const vectorString = formatEmbeddingForPgvector(normalized);

  await conn.query(
    `
    INSERT INTO job_embeddings (job_id, embedding)
    VALUES ($1, $2::vector)
    ON CONFLICT (job_id)
    DO UPDATE SET embedding = EXCLUDED.embedding, created_at = CURRENT_TIMESTAMP
    `,
    [jobId, vectorString]
  );
}

async function upsertJobAnalysis(conn, jobId, parsedData) {
  const updated = await conn.query(
    `
    UPDATE job_analysis
    SET parsed_json = $1, created_at = CURRENT_TIMESTAMP
    WHERE job_id = $2
    RETURNING id
    `,
    [parsedData, jobId]
  );

  if (updated.rowCount > 0) return;

  await conn.query(
    `
    INSERT INTO job_analysis (job_id, parsed_json)
    VALUES ($1, $2)
    `,
    [jobId, parsedData]
  );
}

export async function processJob(jobId, input = {}) {
  const conn = await pool.connect();

  try {
    const { rows } = await conn.query(
      `
      SELECT
        j.id,
        j.title,
        j.description,
        j.experience_required,
        r.role_name,
        i.industry_name
      FROM jobs j
      LEFT JOIN roles r ON r.id = j.role_id
      LEFT JOIN industries i ON i.id = j.industry_id
      WHERE j.id = $1
      `,
      [jobId]
    );

    if (rows.length === 0) {
      throw new Error("Job not found");
    }

    const dbJob = rows[0];

    const role = String(input.role || dbJob.role_name || dbJob.title || "").trim();
    const description = String(input.description || dbJob.description || "").trim();
    const experience =
      input.experience ?? input.experience_required ?? dbJob.experience_required ?? 0;
    const industry = String(input.industry || dbJob.industry_name || "").trim();
    const skills = await resolveSkillNames(conn, input.skills, jobId);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview"
    });

    const result = await model.generateContent([
      {
        text: `
Analyze this job data and return structured JSON.

INPUT:
- role: ${role}
- description: ${description}
- experience_required_years: ${experience}
- skills: ${(skills || []).join(", ")}
- industry: ${industry}

STRICT RULES:
- Return ONLY valid JSON
- No explanation
- No extra text
- No markdown
- summary should be less than 200 characters

FORMAT (exact keys):
{
  "skills": ["lowercase, full-form"],
  "experience_years": number,
  "roles": ["job roles"],
  "industry": "string",
  "summary": "short summary"
}

For experience_years, use the provided value as the primary source unless it is clearly invalid.
Return ONLY integer (no decimals).
`
      }
    ]);

    const raw = result.response.text();
    const data = safeJSONParse(raw);

    await upsertJobAnalysis(conn, jobId, data);

    const embeddingText = `
      skills: ${(data.skills || []).join(", ")}
      roles: ${(data.roles || []).join(", ")}
      experience: ${data.experience_years || 0}
      industry: ${data.industry || ""}
      summary: ${data.summary || ""}
      role_input: ${role}
      description_input: ${description}
    `;

    const embedModel = genAI.getGenerativeModel({
      model: "gemini-embedding-2-preview"
    });

    const embeddingRes = await embedModel.embedContent({
      outputDimensionality: DEFAULT_JOB_EMBEDDING_DIMENSION,
      content: {
        parts: [{ text: embeddingText }]
      }
    });

    let embedding;
    if (embeddingRes.embedding?.values) {
      embedding = embeddingRes.embedding.values;
    } else if (embeddingRes.embeddings?.[0]?.values) {
      embedding = embeddingRes.embeddings[0].values;
    } else {
      throw new Error("Invalid embedding response structure");
    }

    await saveJobEmbeddingToDB(conn, jobId, embedding);

    return { success: true, data };
  } catch (error) {
    console.error("Job Processing Error:", error);
    throw error;
  } finally {
    conn.release();
  }
}
