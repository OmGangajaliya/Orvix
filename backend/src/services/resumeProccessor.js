import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import { pool } from "../db/connectDB.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔒 Safe JSON parser
function safeJSONParse(text) {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Invalid JSON from Gemini");
        return JSON.parse(match[0]);
    }
}

// Keep embedding dimension aligned with pgvector column dimension.
const DEFAULT_EMBEDDING_DIMENSION = Number(
    process.env.CANDIDATE_EMBEDDING_DIMENSION || 768
);

// ✅ Ensure numeric array
function toNumericEmbeddingArray(embedding) {
    if (!embedding) throw new Error("Embedding is null/undefined");

    if (!Array.isArray(embedding)) {
        throw new Error("Embedding must be an array");
    }

    const normalized = embedding.map((v, i) => {
        const num = Number(v);
        if (!Number.isFinite(num)) {
            throw new Error(`Invalid number at index ${i}`);
        }
        return num;
    });

    if (normalized.length !== DEFAULT_EMBEDDING_DIMENSION) {
        throw new Error(
            `Embedding dimension mismatch: expected ${DEFAULT_EMBEDDING_DIMENSION}, got ${normalized.length}`
        );
    }

    return normalized;
}

// ✅ Convert to pgvector format
function formatEmbeddingForPgvector(arr) {
    return `[${arr.join(",")}]`;
}

function normalizeText(value) {
    return String(value || "").trim();
}

function normalizeDate(value) {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw || /^present|current|now$/i.test(raw)) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10);
}

function normalizeWorkHistory(workHistory) {
    if (!Array.isArray(workHistory)) return [];

    return workHistory
        .map((entry) => ({
            company_name: normalizeText(entry?.company_name),
            role_title: normalizeText(entry?.role_title),
            industry: normalizeText(entry?.industry),
            start_date: normalizeDate(entry?.start_date),
            end_date: normalizeDate(entry?.end_date),
            description: normalizeText(entry?.description)
        }))
        .filter((entry) => entry.company_name || entry.role_title || entry.start_date);
}

async function resolveIndustryId(conn, industryName) {
    const normalized = normalizeText(industryName);
    if (!normalized) return null;

    const { rows: existing } = await conn.query(
        `
        SELECT id
        FROM industries
        WHERE LOWER(industry_name) = LOWER($1)
        LIMIT 1
        `,
        [normalized]
    );

    if (existing[0]?.id) return existing[0].id;

    const { rows: inserted } = await conn.query(
        `
        INSERT INTO industries (industry_name)
        VALUES ($1)
        ON CONFLICT (industry_name) DO UPDATE SET industry_name = EXCLUDED.industry_name
        RETURNING id
        `,
        [normalized]
    );

    return inserted[0]?.id || null;
}

async function upsertCandidateWorkHistory(conn, candidateId, workHistory = []) {
    await conn.query(`DELETE FROM candidate_work_history WHERE candidate_id = $1`, [candidateId]);

    if (!workHistory.length) return;

    for (const item of workHistory) {
        const industryId = await resolveIndustryId(conn, item.industry);

        await conn.query(
            `
            INSERT INTO candidate_work_history (
                candidate_id,
                company_name,
                role_title,
                industry_id,
                start_date,
                end_date,
                description
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
                candidateId,
                item.company_name || null,
                item.role_title || null,
                industryId,
                item.start_date,
                item.end_date,
                item.description || null
            ]
        );
    }
}

// ✅ Save embedding
export async function saveEmbeddingToDB(conn, candidateId, embedding) {
    if (!conn) throw new Error("DB connection required");
    if (!candidateId) throw new Error("Candidate ID required");

    console.log("💾 Preparing embedding for DB...");

    const normalized = toNumericEmbeddingArray(embedding);
    const vectorString = formatEmbeddingForPgvector(normalized);

    console.log("📊 Embedding length:", normalized.length);

    await conn.query(
        `
    INSERT INTO candidate_embeddings (candidate_id, embedding)
    VALUES ($1, $2::vector)
    ON CONFLICT (candidate_id)
    DO UPDATE SET embedding = EXCLUDED.embedding
    `,
        [candidateId, vectorString]
    );

    console.log("✅ Embedding saved in DB");
}

// 🔥 MAIN FUNCTION
export async function processResume(candidateId, filePath) {
    const conn = await pool.connect();

    try {
        await conn.query("BEGIN");
        console.log("🚀 Processing resume:", candidateId);

        // 1. Read file
        const fileBuffer = fs.readFileSync(filePath);
        const base64File = fileBuffer.toString("base64");

        let mimeType = "application/pdf";
        if (filePath.endsWith(".png")) mimeType = "image/png";
        if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg"))
            mimeType = "image/jpeg";
        if (filePath.endsWith(".docx"))
            mimeType =
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        // 2. Gemini analysis
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview"
        });

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType,
                    data: base64File
                }
            },
            {
                text: `
Analyze this resume and return structured JSON.

STRICT RULES:
- Return ONLY valid JSON
- No explanation
- No extra text
- No markdown
- summary should be less than 200 characters

FORMAT:
{
  "skills": ["lowercase, full-form"],
  "experience_years": number,
  "roles": ["job roles"],
  "industry": "string",
    "summary": "short summary",
    "work_history": [
        {
            "company_name": "string",
            "role_title": "string",
            "industry": "string",
            "start_date": "YYYY-MM-DD",
            "end_date": "YYYY-MM-DD or null if current",
            "description": "string"
        }
    ]
}

Calculate total experience in years based on given dates.

- If "Now" is present, use current date.
- Calculate accurately.
Return ONLY integer (no decimals).

work_history rules:
- Include each role from resume in reverse chronological order.
- start_date/end_date must be ISO format YYYY-MM-DD.
- If current role, end_date must be null.
- If date is missing, use null.

Example:
Feb 2025 – Now → 1 year
`
            }
        ]);

        const raw = result.response.text();
        const data = safeJSONParse(raw);
        const normalizedWorkHistory = normalizeWorkHistory(data.work_history);

        console.log("✅ Resume parsed");

        // 3. Save analysis
        await conn.query(
            `INSERT INTO resume_analysis (candidate_id, parsed_json)
       VALUES ($1, $2)`,
            [candidateId, data]
        );

        // 3.1 Save candidate work history extracted from resume
        await upsertCandidateWorkHistory(conn, candidateId, normalizedWorkHistory);

        // 4. Update candidate
        await conn.query(
           `UPDATE candidates
           SET total_experience_years = $1,
           profile_summary = $2
           WHERE id = $3`,
            [
                data.experience_years || null,
                data.summary || null,
                candidateId
            ]
        );

        console.log("✅ Candidate updated");

        const workHistoryText = normalizedWorkHistory
            .map((item) => {
                const period = item.start_date
                    ? `${item.start_date} to ${item.end_date || "present"}`
                    : "date unavailable";
                return [
                    `company: ${item.company_name || ""}`,
                    `role: ${item.role_title || ""}`,
                    `industry: ${item.industry || ""}`,
                    `period: ${period}`,
                    `description: ${item.description || ""}`
                ].join(" | ");
            })
            .join("\n");

        // 5. Prepare embedding text
        const embeddingText = `
            skills: ${(data.skills || []).join(", ")}
            roles: ${(data.roles || []).join(", ")}
            experience: ${data.experience_years || 0}
            industry: ${data.industry || ""}
            summary: ${data.summary || ""}
            work_history: ${workHistoryText || "none"}
            `;

        // 6. Generate embedding
        console.log("🧠 Generating embedding...");

        const embedModel = genAI.getGenerativeModel({
            model: "gemini-embedding-2-preview"
        });

        const embeddingRes = await embedModel.embedContent({
            outputDimensionality: DEFAULT_EMBEDDING_DIMENSION,
            content: {
                parts: [{ text: embeddingText }]
            }
        });

        console.log("📦 Raw embedding response received");

        // ✅ SAFE extraction
        let embedding;

        if (embeddingRes.embedding?.values) {
            embedding = embeddingRes.embedding.values;
        } else if (embeddingRes.embeddings?.[0]?.values) {
            embedding = embeddingRes.embeddings[0].values;
        } else {
            throw new Error("❌ Invalid embedding response structure");
        }

        console.log("📊 Embedding extracted:", embedding.length);

        // 7. Save embedding
        await saveEmbeddingToDB(conn, candidateId, embedding);

        await conn.query("COMMIT");

        console.log("🎉 Resume fully processed:", candidateId);

        return { success: true, data };

    } catch (err) {
        await conn.query("ROLLBACK");
        console.error("❌ Resume Processing Error:", err);
        throw err;
    } finally {
        conn.release();
    }
}