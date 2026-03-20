import { pool } from "../db/connectDB.js";

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const uniqueNormalized = (items = []) => {
  const set = new Set();
  for (const item of items) {
    const normalized = normalizeText(item);
    if (normalized) set.add(normalized);
  }
  return Array.from(set);
};

const overlapRatio = (left, right) => {
  const l = new Set(normalizeText(left).split(" ").filter(Boolean));
  const r = new Set(normalizeText(right).split(" ").filter(Boolean));
  if (l.size === 0 || r.size === 0) return 0;

  let common = 0;
  for (const token of l) {
    if (r.has(token)) common += 1;
  }

  return common / Math.max(l.size, r.size);
};

const isSkillMatch = (requiredSkill, candidateSkill) => {
  const req = normalizeText(requiredSkill);
  const cand = normalizeText(candidateSkill);
  if (!req || !cand) return false;
  if (req === cand) return true;
  if (req.includes(cand) || cand.includes(req)) return true;
  return overlapRatio(req, cand) >= 0.6;
};

const getLatestResumeAnalysis = async (candidateId) => {
  const { rows } = await pool.query(
    `
    SELECT parsed_json
    FROM resume_analysis
    WHERE candidate_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [candidateId]
  );

  return rows[0]?.parsed_json || null;
};

const getLatestJobAnalysis = async (jobId) => {
  const { rows } = await pool.query(
    `
    SELECT parsed_json
    FROM job_analysis
    WHERE job_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [jobId]
  );

  return rows[0]?.parsed_json || null;
};

const getCandidateExperienceYears = async (candidateId) => {
  const { rows: candidate } = await pool.query(
    `SELECT total_experience_years FROM candidates WHERE id = $1`,
    [candidateId]
  );

  let years = Number(candidate[0]?.total_experience_years);
  if (Number.isFinite(years) && years > 0) {
    return years;
  }

  const resumeAnalysis = await getLatestResumeAnalysis(candidateId);
  const parsedYears = Number(resumeAnalysis?.experience_years);
  if (Number.isFinite(parsedYears) && parsedYears > 0) {
    return parsedYears;
  }

  const { rows: fromHistory } = await pool.query(
    `
    SELECT
      COALESCE(
        SUM(
          GREATEST(
            0,
            DATE_PART('year', AGE(COALESCE(end_date, CURRENT_DATE), start_date)) * 12 +
            DATE_PART('month', AGE(COALESCE(end_date, CURRENT_DATE), start_date))
          )
        ) / 12.0,
        0
      ) AS years
    FROM candidate_work_history
    WHERE candidate_id = $1 AND start_date IS NOT NULL
    `,
    [candidateId]
  );

  const historyYears = Number(fromHistory[0]?.years);
  if (Number.isFinite(historyYears) && historyYears > 0) {
    return historyYears;
  }

  return null;
};

const getJobRequiredExperienceYears = async (jobId) => {
  const { rows: job } = await pool.query(
    `SELECT experience_required FROM jobs WHERE id = $1`,
    [jobId]
  );

  if (!job[0]) return null;

  const direct = Number(job[0].experience_required);
  if (Number.isFinite(direct) && direct > 0) {
    return direct;
  }

  const jobAnalysis = await getLatestJobAnalysis(jobId);
  const parsed = Number(jobAnalysis?.experience_years);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return 0;
};

/**
 * Calculate cosine similarity between two vectors
 * Formula: (A · B) / (||A|| * ||B||)
 */
const cosineSimilarity = (vectorA, vectorB) => {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) return 0;
  if (vectorA.length === 0 || vectorB.length === 0) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    const a = Number(vectorA[i]) || 0;
    const b = Number(vectorB[i]) || 0;
    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Get candidate embeddings and job embeddings, calculate semantic score
 */
const calculateSemanticScore = async (candidateId, jobId) => {
  const { rows: candidateRows } = await pool.query(
    `SELECT embedding FROM candidate_embeddings WHERE candidate_id = $1`,
    [candidateId]
  );

  const { rows: jobRows } = await pool.query(
    `SELECT embedding FROM job_embeddings WHERE job_id = $1`,
    [jobId]
  );

  if (candidateRows.length === 0 || jobRows.length === 0) {
    return null;
  }

  const candidateEmbedding = candidateRows[0].embedding;
  const jobEmbedding = jobRows[0].embedding;

  const similarity = cosineSimilarity(candidateEmbedding, jobEmbedding);
  // Normalize to 0-100 scale
  return Math.round((similarity + 1) / 2 * 100);
};

/**
 * Calculate skill match score
 * Percentage of job required skills found in candidate's resume analysis
 */
const calculateSkillScore = async (candidateId, jobId) => {
  // 1) Skills explicitly linked to job
  const { rows: explicitJobSkills } = await pool.query(
    `
    SELECT s.skill_name, sa.alias_name
    FROM job_skills js
    JOIN skills s ON s.id = js.skill_id
    LEFT JOIN skill_aliases sa ON sa.skill_id = s.id
    WHERE js.job_id = $1
    `,
    [jobId]
  );

  let requiredSkills = explicitJobSkills.flatMap((row) => [row.skill_name, row.alias_name]).filter(Boolean);

  // 2) Fallback to parsed job analysis skills
  if (requiredSkills.length === 0) {
    const jobAnalysis = await getLatestJobAnalysis(jobId);
    if (Array.isArray(jobAnalysis?.skills)) {
      requiredSkills = jobAnalysis.skills;
    }
  }

  requiredSkills = uniqueNormalized(requiredSkills);

  if (requiredSkills.length === 0) {
    return null;
  }

  // 3) Candidate skills from structured table
  const { rows: explicitCandidateSkills } = await pool.query(
    `
    SELECT s.skill_name, sa.alias_name
    FROM candidate_skills cs
    JOIN skills s ON s.id = cs.skill_id
    LEFT JOIN skill_aliases sa ON sa.skill_id = s.id
    WHERE cs.candidate_id = $1
    `,
    [candidateId]
  );

  // 4) Candidate skills from resume analysis
  const resumeAnalysis = await getLatestResumeAnalysis(candidateId);
  const resumeSkills = Array.isArray(resumeAnalysis?.skills)
    ? resumeAnalysis.skills
    : [];

  const candidateSkills = uniqueNormalized([
    ...explicitCandidateSkills.flatMap((row) => [row.skill_name, row.alias_name]),
    ...resumeSkills
  ]);

  if (candidateSkills.length === 0) {
    return 50;
  }

  const matchCount = requiredSkills.filter((requiredSkill) =>
    candidateSkills.some((candidateSkill) => isSkillMatch(requiredSkill, candidateSkill))
  ).length;

  return Math.round((matchCount / requiredSkills.length) * 100);
};

/**
 * Calculate experience match score
 * 0-100 based on how close candidate experience is to job requirement
 */
const calculateExperienceScore = async (candidateId, jobId) => {
  const requiredExperience = await getJobRequiredExperienceYears(jobId);
  if (requiredExperience === null) return null;

  const candidateExperience = await getCandidateExperienceYears(candidateId);

  if (requiredExperience === 0) {
    return candidateExperience !== null ? 100 : 50;
  }

  if (candidateExperience === null) {
    return 50;
  }

  if (candidateExperience >= requiredExperience) {
    return 100;
  }

  return Math.round((candidateExperience / requiredExperience) * 100);
};

/**
 * Calculate industry match score
 * 100 if industries match, 50 if job has no industry specified, 0 otherwise
 */
const calculateIndustryScore = async (candidateId, jobId) => {
  const { rows: job } = await pool.query(
    `
    SELECT j.industry_id, i.industry_name
    FROM jobs j
    LEFT JOIN industries i ON i.id = j.industry_id
    WHERE j.id = $1
    `,
    [jobId]
  );

  if (!job[0] || !job[0].industry_id) {
    return 50; // Neutral if no industry specified
  }

  const { rows: candidateIndustries } = await pool.query(
    `
    SELECT DISTINCT industry_id
    FROM candidate_work_history
    WHERE candidate_id = $1
      AND industry_id IS NOT NULL
    `,
    [candidateId]
  );

  const candidateIndustryIds = candidateIndustries
    .map((row) => row.industry_id)
    .filter(Boolean);

  if (candidateIndustryIds.includes(job[0].industry_id)) {
    return 100;
  }

  // Fallback: compare resume parsed industry text with job industry name
  const resumeAnalysis = await getLatestResumeAnalysis(candidateId);
  const resumeIndustry = normalizeText(resumeAnalysis?.industry);
  const jobIndustry = normalizeText(job[0].industry_name);

  if (!resumeIndustry) {
    return 50;
  }

  if (
    resumeIndustry === jobIndustry ||
    resumeIndustry.includes(jobIndustry) ||
    jobIndustry.includes(resumeIndustry) ||
    overlapRatio(resumeIndustry, jobIndustry) >= 0.6
  ) {
    return 100;
  }

  if (overlapRatio(resumeIndustry, jobIndustry) >= 0.3) {
    return 60;
  }

  return 0;
};

/**
 * Calculate final composite score
 * Weighted average: semantic 40%, skills 30%, experience 20%, industry 10%
 */
const calculateFinalScore = (semanticScore, skillScore, experienceScore, industryScore) => {
  const scores = {
    semantic: semanticScore !== null ? semanticScore : 0,
    skill: skillScore !== null ? skillScore : 50,
    experience: experienceScore !== null ? experienceScore : 50,
    industry: industryScore !== null ? industryScore : 50
  };

  const finalScore =
    scores.semantic * 0.4 +
    scores.skill * 0.3 +
    scores.experience * 0.2 +
    scores.industry * 0.1;

  return Math.round(finalScore);
};

/**
 * Calculate all match scores for a candidate-job pair
 */
const calculateMatchScores = async (candidateId, jobId) => {
  const semanticScore = await calculateSemanticScore(candidateId, jobId);
  const skillScore = await calculateSkillScore(candidateId, jobId);
  const experienceScore = await calculateExperienceScore(candidateId, jobId);
  const industryScore = await calculateIndustryScore(candidateId, jobId);

  const finalScore = calculateFinalScore(
    semanticScore,
    skillScore,
    experienceScore,
    industryScore
  );

  return {
    semantic_score: semanticScore,
    skill_score: skillScore,
    experience_score: experienceScore,
    industry_score: industryScore,
    final_score: finalScore
  };
};

/**
 * Upsert match scores
 */
const upsertMatchScore = async (candidateId, jobId, scores) => {
  const { rows } = await pool.query(
    `
    INSERT INTO match_scores (
      candidate_id, job_id, semantic_score, skill_score,
      industry_score, experience_score, final_score
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (candidate_id, job_id)
    DO UPDATE SET
      semantic_score = EXCLUDED.semantic_score,
      skill_score = EXCLUDED.skill_score,
      industry_score = EXCLUDED.industry_score,
      experience_score = EXCLUDED.experience_score,
      final_score = EXCLUDED.final_score
    RETURNING *
    `,
    [
      candidateId,
      jobId,
      scores.semantic_score,
      scores.skill_score,
      scores.industry_score,
      scores.experience_score,
      scores.final_score
    ]
  );

  return rows[0];
};

export {
  calculateMatchScores,
  upsertMatchScore,
  calculateSemanticScore,
  calculateSkillScore,
  calculateExperienceScore,
  calculateIndustryScore,
  calculateFinalScore
};
