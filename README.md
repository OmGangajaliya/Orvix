# Orvix

Orvix is a full-stack recruitment platform with role-based experiences for candidates and companies.

- Candidates can register, complete onboarding with resume upload, browse jobs, apply, and view match scores.
- Companies can register, onboard organization details, create jobs, review applicants, and manage hiring decisions.
- The backend supports resume/job analysis and vector-based matching using embeddings.

## Tech Stack

### Frontend
- React 19
- Vite
- React Router
- Axios
- GSAP (UI animation)
- Font Awesome (icons)
- Vanilla CSS

### Backend
- Node.js + Express 5
- PostgreSQL + pg
- pgvector extension for embeddings
- JWT auth (access + refresh tokens)
- Multer (file upload)
- Cloudinary (file storage)
- Google Generative AI SDK (Gemini)

## Project Structure

```text
Orvix/
  backend/
    src/
      app.js
      index.js
      controllers/
      db/
      middlewares/
      routes/
      services/
      utils/
    package.json
  frontend/
    src/
      api/
      components/
      context/
      pages/
      style/
      App.jsx
      main.jsx
    package.json
  IMPLEMENTATION_SUMMARY.md
  REGISTRATION_FLOW.md
```

## Core Features

### Authentication and Roles
- Candidate registration and login
- Company registration and login
- JWT-based protected APIs
- Role-based authorization middleware (`onlyCandidate`, `onlyCompany`)

### Candidate Experience
- Two-stage user journey:
  - Register/login
  - Onboarding with phone, location, and resume upload
- Browse jobs
- Apply to jobs
- View own applications
- View profile details
- View match scores

### Company Experience
- Company onboarding (name, website, location, description)
- Create/edit/delete jobs
- View posted jobs
- View job applicants
- Update application status
- Access match data and hiring feedback endpoints

### AI and Matching Layer
- Resume parsing/analysis service
- Job parsing/analysis service
- Embedding generation (default dimension: 768)
- Candidate/job embedding persistence in PostgreSQL (pgvector)
- Match scoring APIs

## Weightage and Scoring

Match scoring is implemented in `backend/src/services/score.service.js`.

### Component Scores (0-100)
- Semantic score:
  - Cosine similarity between candidate and job embeddings.
  - Normalized to 0-100 using `(similarity + 1) / 2 * 100`.
- Skill score:
  - Percentage of required job skills matched by candidate skills.
  - Includes table-based skills and parsed resume/job analysis fallback.
- Experience score:
  - `100` if candidate experience >= required experience.
  - Proportional score when lower.
  - Neutral defaults for missing values.
- Industry score:
  - `100` for clear match.
  - `60` for partial text overlap.
  - `50` neutral when job/candidate industry data is missing.
  - `0` for mismatch.

### Final Score Weightage

Final score is a weighted average:

```text
final_score =
  semantic_score   * 0.40 +
  skill_score      * 0.30 +
  experience_score * 0.20 +
  industry_score   * 0.10
```

### Null/Default Handling
- If `semantic_score` is missing, it is treated as `0`.
- If `skill_score`, `experience_score`, or `industry_score` are missing, each defaults to `50` (neutral).
- Final score is rounded to the nearest integer before storing.

## Architecture Overview

### Frontend Flow
- `App.jsx` defines role-protected routes:
  - `/candidate/login`
  - `/candidate/onboarding`
  - `/candidate/dashboard`
  - `/company/login`
  - `/company/dashboard`
- `AuthContext` stores current user and token state.
- `ProtectedRoute` enforces role-level route access.
- Axios client points to `VITE_API_BASE_URL` or defaults to `http://localhost:5000/api/v1`.

### Backend Flow
- `src/index.js` boots environment, DB connection, and HTTP server.
- `src/app.js` configures middleware and mounts API routes under `/api/v1/*`.
- Controllers orchestrate request handling.
- Services contain reusable business logic and AI processing steps.
- Middlewares enforce JWT validation and role restrictions.

## API Base URL

All backend routes are mounted under:

- `/api/v1`

## API Route Summary

### Auth (`/api/v1/auth`)
- `POST /register/candidate`
- `POST /register/company`
- `POST /login`
- `POST /logout` (auth required)
- `POST /refresh`

### Candidate (`/api/v1/candidate`)
- `POST /onboard` (candidate + auth, multipart upload field: `resume_url`)
- `GET /profile` (candidate + auth)
- `GET /company/:id` (candidate + auth)

### Company (`/api/v1/company`)
- `POST /onboard` (company + auth)
- `GET /profile` (company + auth)
- `GET /candidate/:id` (company + auth)

### Jobs (`/api/v1/jobs`)
- `GET /` (auth)
- `POST /` (company + auth)
- `GET /:id` (auth)
- `PATCH /:id` (company + auth)
- `DELETE /:id` (company + auth)

### Applications (`/api/v1/applications`)
- `POST /jobs/:jobId/apply` (candidate + auth)
- `GET /mine` (candidate + auth)
- `GET /jobs/:jobId` (company + auth)
- `PATCH /:id/status` (company + auth)

### Master Data (`/api/v1/meta`)
- `GET /industries` (auth)
- `POST /industries` (company + auth)
- `GET /roles` (auth)
- `POST /roles` (company + auth)
- `GET /skills` (auth)
- `POST /skills` (company + auth)

### Matching (`/api/v1/matching`)
- `POST /scores` (company + auth)
- `GET /scores/job/:jobId` (company + auth)
- `GET /scores/mine` (candidate + auth)
- `POST /feedback` (company + auth)
- `GET /feedback/job/:jobId` (company + auth)

## Database Overview

The schema is managed in `backend/src/db/createTables.js` and includes:

- Users, candidates, companies
- Jobs, job skills, applications
- Industries, roles, skills, skill aliases
- Resume and job analysis JSON storage
- Candidate and job embeddings (`VECTOR(768)`)
- Match scores and hiring feedback

Important note:
- `connectDB.js` currently has table auto-creation disabled (`createTables()` is commented out).
- Enable it if you want automatic table bootstrap on server start.

## Environment Variables

Create `backend/.env` with:

```env
PORT=5000
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<db>
ACCESS_TOKEN_SECRET=<strong_secret>
REFRESH_TOKEN_SECRET=<strong_secret>
GEMINI_API_KEY=<gemini_api_key>
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
CANDIDATE_EMBEDDING_DIMENSION=768
JOB_EMBEDDING_DIMENSION=768
```

Create `frontend/.env` with:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Local Setup

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL with pgvector extension enabled

### 1) Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2) Configure environment
- Add `backend/.env`
- Add `frontend/.env`

### 3) Run backend

```bash
cd backend
npm run dev
```

### 4) Run frontend

```bash
cd frontend
npm run dev
```

### 5) Build frontend

```bash
cd frontend
npm run build
```

## File Upload and Resume Processing

- Candidate onboarding accepts multipart upload field name: `resume_url`.
- Multer stores temporary files in `backend/uploads/`.
- Cloudinary upload utility uploads and removes local temp files.
- Resume and job processors generate structured JSON + embeddings.

## Security Notes

- Access and refresh tokens are used for session management.
- Cookies are used for token transport on auth endpoints.
- Role middleware prevents candidate/company route misuse.
- Keep all secrets out of source control.

## Known Implementation Notes

- File name `resumeProccessor.js` uses a double "cc" spelling in the repository. Keep imports consistent with the existing file name.
- CORS origin is currently set to `http://localhost:5173` in backend `app.js`.

## Reference Docs

- `IMPLEMENTATION_SUMMARY.md` for feature completion notes
- `REGISTRATION_FLOW.md` for onboarding sequence details

## Deployment Checklist

- Set production-grade secrets and DB URL
- Configure CORS for deployed frontend URL
- Ensure pgvector is available in production database
- Verify Cloudinary credentials
- Validate Gemini API quotas/keys
- Build frontend and run backend in production mode

## License

No license file is currently defined in the repository.
