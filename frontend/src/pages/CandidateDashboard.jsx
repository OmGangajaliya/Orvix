import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import API from "../api/axios";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const tabs = [
  { id: "jobs", label: "Browse Jobs" },
  { id: "applications", label: "My Applications" },
  { id: "profile", label: "Profile" },
  { id: "matches", label: "Match Scores" }
];

const CandidateDashboard = () => {
  const rootRef = useRef(null);
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobFilters, setJobFilters] = useState({ role_id: "", industry_id: "", status: "active" });
  const [onboardForm, setOnboardForm] = useState({ phone: "", location: "", resume: null });

  const { successMsg, errorMsg } = useAlert();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!rootRef.current) return;
    gsap.fromTo(
      rootRef.current.querySelectorAll(".panel-card"),
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power2.out" }
    );
  }, [activeTab]);

  useEffect(() => {
    loadMeta();
    loadJobs();
    loadApplications();
    loadProfile();
    loadMatches();
  }, []);

  const appliedJobIds = useMemo(() => new Set(applications.map((app) => app.job_id)), [applications]);

  const loadMeta = async () => {
    try {
      const [roleRes, industryRes] = await Promise.all([
        API.get("/meta/roles"),
        API.get("/meta/industries")
      ]);
      setRoles(roleRes.data?.data || []);
      setIndustries(industryRes.data?.data || []);
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to load metadata");
    }
  };

  const loadJobs = async (override = jobFilters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(override).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await API.get(`/jobs${query}`);
      setJobs(res.data?.data || []);
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const res = await API.get("/applications/mine");
      setApplications(res.data?.data || []);
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to load applications");
    }
  };

  const loadProfile = async () => {
    try {
      const res = await API.get("/candidate/profile");
      setProfile(res.data?.data || null);
    } catch {
      setProfile(null);
    }
  };

  const loadMatches = async () => {
    try {
      const res = await API.get("/matching/scores/mine");
      setMatches(res.data?.data || []);
    } catch {
      setMatches([]);
    }
  };

  const applyToJob = async (jobId) => {
    try {
      await API.post(`/applications/jobs/${jobId}/apply`);
      successMsg("Application submitted");
      loadApplications();
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to apply");
    }
  };

  const submitOnboarding = async (event) => {
    event.preventDefault();

    if (!onboardForm.resume) {
      errorMsg("Resume file is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("phone", onboardForm.phone);
      formData.append("location", onboardForm.location);
      formData.append("resume_url", onboardForm.resume);

      await API.post("/candidate/onboard", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      successMsg("Candidate onboarding submitted");
      await loadProfile();
      setOnboardForm({ phone: "", location: "", resume: null });
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Onboarding failed");
    }
  };

  const renderJobs = () => (
    <section className="panel-card">
      <div className="card-title-row">
        <h3>Jobs</h3>
      </div>
      <div className="filter-grid">
        <select
          value={jobFilters.role_id}
          onChange={(event) => setJobFilters((prev) => ({ ...prev, role_id: event.target.value }))}
        >
          <option value="">All roles</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.role_name}
            </option>
          ))}
        </select>

        <select
          value={jobFilters.industry_id}
          onChange={(event) => setJobFilters((prev) => ({ ...prev, industry_id: event.target.value }))}
        >
          <option value="">All industries</option>
          {industries.map((industry) => (
            <option key={industry.id} value={industry.id}>
              {industry.industry_name}
            </option>
          ))}
        </select>

        <button type="button" className="primary-btn" onClick={() => loadJobs(jobFilters)}>
          Apply Filters
        </button>
      </div>

      {loading ? <p className="muted">Loading jobs...</p> : null}

      <div className="list-stack">
        {jobs.map((job) => (
          <article className="list-card" key={job.id}>
            <div>
              <h4>{job.title}</h4>
              <p>{job.company_name} • {job.location || "remote/flexible"}</p>
              <p className="muted">{job.description?.slice(0, 220)}...</p>
              <p className="chip-row">
                {(job.skills || []).slice(0, 6).map((skill) => (
                  <span key={skill} className="chip">{skill}</span>
                ))}
              </p>
            </div>
            <button
              type="button"
              className="primary-btn"
              disabled={appliedJobIds.has(job.id)}
              onClick={() => applyToJob(job.id)}
            >
              {appliedJobIds.has(job.id) ? "Applied" : "Apply"}
            </button>
          </article>
        ))}
        {!jobs.length ? <p className="muted">No jobs available.</p> : null}
      </div>
    </section>
  );

  const renderApplications = () => (
    <section className="panel-card">
      <h3>My Application Status</h3>
      <div className="list-stack">
        {applications.map((app) => (
          <article className="list-card" key={app.id}>
            <div>
              <h4>{app.job_title}</h4>
              <p>{app.company_name} • {app.job_location || "n/a"}</p>
            </div>
            <span className="status-pill">{app.status}</span>
          </article>
        ))}
        {!applications.length ? <p className="muted">You have not applied to jobs yet.</p> : null}
      </div>
    </section>
  );

  const renderProfile = () => (
    <section className="panel-card">
      <h3>Profile Management</h3>
      {profile ? (
        <div className="profile-grid">
          <p><strong>Name:</strong> {profile.candidate_name || user?.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Phone:</strong> {profile.phone || "-"}</p>
          <p><strong>Location:</strong> {profile.location || "-"}</p>
          <p><strong>Experience:</strong> {profile.total_experience_years ?? "-"} years</p>
          <p><strong>Summary:</strong> {profile.profile_summary || "Pending after resume processing"}</p>
          <a href={profile.resume_url} target="_blank" rel="noreferrer" className="text-link">
            View Uploaded Resume
          </a>
        </div>
      ) : (
        <form className="form-grid" onSubmit={submitOnboarding}>
          <p className="muted">Complete onboarding to upload your resume.</p>
          <input
            type="text"
            placeholder="Phone"
            value={onboardForm.phone}
            onChange={(event) => setOnboardForm((prev) => ({ ...prev, phone: event.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={onboardForm.location}
            onChange={(event) => setOnboardForm((prev) => ({ ...prev, location: event.target.value }))}
            required
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(event) => setOnboardForm((prev) => ({ ...prev, resume: event.target.files?.[0] || null }))}
            required
          />
          <button type="submit" className="primary-btn">Submit Onboarding</button>
        </form>
      )}
    </section>
  );

  const renderMatches = () => (
    <section className="panel-card">
      <h3>Match Scores</h3>
      <div className="list-stack">
        {matches.map((match) => (
          <article className="list-card" key={match.id}>
            <div>
              <h4>{match.job_title}</h4>
              <p>{match.company_name}</p>
            </div>
            <span className="status-pill">{match.final_score ?? "-"}</span>
          </article>
        ))}
        {!matches.length ? <p className="muted">No match score records yet.</p> : null}
      </div>
    </section>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar userRole="candidate" />
      <main className="dashboard-shell" ref={rootRef}>
        <header className="dashboard-top panel-card">
          <div>
            <h2>Candidate Panel</h2>
            <p className="muted">Welcome {user?.email}</p>
          </div>
        </header>

        <nav className="tab-row panel-card">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={tab.id === activeTab ? "tab-btn active" : "tab-btn"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "jobs" ? renderJobs() : null}
        {activeTab === "applications" ? renderApplications() : null}
        {activeTab === "profile" ? renderProfile() : null}
        {activeTab === "matches" ? renderMatches() : null}
      </main>
    </div>
  );
};

export default CandidateDashboard;
