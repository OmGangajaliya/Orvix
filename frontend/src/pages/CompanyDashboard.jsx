import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import API from "../api/axios";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const tabs = [
  { id: "jobs", label: "My Jobs" },
  { id: "create", label: "Post Job" },
  { id: "applicants", label: "Applicants" },
  { id: "profile", label: "Company Profile" }
];

const CompanyDashboard = () => {
  const rootRef = useRef(null);
  const { successMsg, errorMsg } = useAlert();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [skills, setSkills] = useState([]);
  const [applications, setApplications] = useState([]);
  const [jobMatches, setJobMatches] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [companyProfile, setCompanyProfile] = useState(null);

  const [jobForm, setJobForm] = useState({
    role_id: "",
    title: "",
    description: "",
    industry_id: "",
    experience_required: "",
    location: "",
    salary_min: "",
    salary_max: "",
    employment_type: "full-time",
    skill_ids: []
  });

  const [onboardForm, setOnboardForm] = useState({
    company_name: "",
    website: "",
    location: "",
    description: ""
  });

  useEffect(() => {
    if (!rootRef.current) return;
    gsap.fromTo(
      rootRef.current.querySelectorAll(".panel-card"),
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power2.out" }
    );
  }, [activeTab]);

  useEffect(() => {
    loadMeta();
    loadCompanyProfile();
    loadJobs();
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    loadApplicants(selectedJobId);
    loadJobMatches(selectedJobId);
  }, [selectedJobId]);

  const scoreMap = useMemo(() => {
    return jobMatches.reduce((acc, current) => {
      acc[current.candidate_id] = current.final_score ?? 0;
      return acc;
    }, {});
  }, [jobMatches]);

  const loadMeta = async () => {
    try {
      const [roleRes, industryRes, skillRes] = await Promise.all([
        API.get("/meta/roles"),
        API.get("/meta/industries"),
        API.get("/meta/skills")
      ]);
      setRoles(roleRes.data?.data || []);
      setIndustries(industryRes.data?.data || []);
      setSkills(skillRes.data?.data || []);
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to load metadata");
    }
  };

  const loadCompanyProfile = async () => {
    try {
      const res = await API.get("/company/profile");
      setCompanyProfile(res.data?.data || null);
    } catch {
      setCompanyProfile(null);
    }
  };

  const loadJobs = async () => {
    try {
      const res = await API.get("/jobs");
      const records = res.data?.data || [];
      setJobs(records);
      if (!selectedJobId && records.length) {
        setSelectedJobId(String(records[0].id));
      }
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to load jobs");
    }
  };

  const loadApplicants = async (jobId) => {
    try {
      const res = await API.get(`/applications/jobs/${jobId}`);
      setApplications(res.data?.data || []);
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to load applicants");
      setApplications([]);
    }
  };

  const loadJobMatches = async (jobId) => {
    try {
      const res = await API.get(`/matching/scores/job/${jobId}`);
      setJobMatches(res.data?.data || []);
    } catch {
      setJobMatches([]);
    }
  };

  const postJob = async (event) => {
    event.preventDefault();
    try {
      await API.post("/jobs", {
        ...jobForm,
        role_id: Number(jobForm.role_id),
        industry_id: jobForm.industry_id ? Number(jobForm.industry_id) : null,
        experience_required: jobForm.experience_required ? Number(jobForm.experience_required) : null,
        salary_min: jobForm.salary_min ? Number(jobForm.salary_min) : null,
        salary_max: jobForm.salary_max ? Number(jobForm.salary_max) : null,
        skill_ids: jobForm.skill_ids.map((id) => Number(id))
      });
      successMsg("Job posted successfully");
      await loadJobs();
      setActiveTab("jobs");
      setJobForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        location: "",
        salary_min: "",
        salary_max: "",
        skill_ids: []
      }));
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to post job");
    }
  };

  const updateSalary = async (jobId, salaryMin, salaryMax) => {
    try {
      await API.patch(`/jobs/${jobId}`, {
        salary_min: salaryMin ? Number(salaryMin) : null,
        salary_max: salaryMax ? Number(salaryMax) : null
      });
      successMsg("Salary updated");
      await loadJobs();
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to update salary");
    }
  };

  const submitCompanyOnboarding = async (event) => {
    event.preventDefault();
    try {
      await API.post("/company/onboard", onboardForm);
      successMsg("Company onboarded");
      await loadCompanyProfile();
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to onboard company");
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await API.patch(`/applications/${applicationId}/status`, { status });
      successMsg(`Application marked as ${status}`);
      await loadApplicants(selectedJobId);
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to update application");
    }
  };

  const shortlistTopTen = async () => {
    if (!selectedJobId) return;

    const ranked = [...applications]
      .sort((a, b) => {
        const scoreDiff = (scoreMap[b.candidate_id] || 0) - (scoreMap[a.candidate_id] || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (b.total_experience_years || 0) - (a.total_experience_years || 0);
      })
      .slice(0, 10);

    if (!ranked.length) {
      errorMsg("No applicants available for shortlisting");
      return;
    }

    try {
      await Promise.all(
        ranked.map((item) => API.patch(`/applications/${item.id}/status`, { status: "shortlisted" }))
      );
      successMsg("Top 10 candidates shortlisted");
      await loadApplicants(selectedJobId);
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Shortlisting failed");
    }
  };

  const renderJobs = () => (
    <section className="panel-card">
      <h3>Manage Job Postings</h3>
      <div className="list-stack">
        {jobs.map((job) => (
          <article className="list-card" key={job.id}>
            <div>
              <h4>{job.title}</h4>
              <p>{job.location || "n/a"} • {job.status}</p>
              <p className="muted">{job.description?.slice(0, 160)}...</p>
            </div>
            <div className="inline-editor">
              <input
                type="number"
                placeholder="Salary min"
                defaultValue={job.salary_min || ""}
                onChange={(event) => {
                  job._salaryMin = event.target.value;
                }}
              />
              <input
                type="number"
                placeholder="Salary max"
                defaultValue={job.salary_max || ""}
                onChange={(event) => {
                  job._salaryMax = event.target.value;
                }}
              />
              <button
                type="button"
                className="primary-btn"
                onClick={() => updateSalary(job.id, job._salaryMin ?? job.salary_min, job._salaryMax ?? job.salary_max)}
              >
                Update Salary
              </button>
            </div>
          </article>
        ))}
        {!jobs.length ? <p className="muted">No jobs yet.</p> : null}
      </div>
    </section>
  );

  const renderCreateJob = () => (
    <section className="panel-card">
      <h3>Post New Job</h3>
      <form className="form-grid" onSubmit={postJob}>
        <select
          required
          value={jobForm.role_id}
          onChange={(event) => setJobForm((prev) => ({ ...prev, role_id: event.target.value }))}
        >
          <option value="">Select role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.role_name}
            </option>
          ))}
        </select>

        <input
          required
          type="text"
          placeholder="Job title"
          value={jobForm.title}
          onChange={(event) => setJobForm((prev) => ({ ...prev, title: event.target.value }))}
        />

        <textarea
          required
          placeholder="Job description"
          value={jobForm.description}
          onChange={(event) => setJobForm((prev) => ({ ...prev, description: event.target.value }))}
        />

        <select
          value={jobForm.industry_id}
          onChange={(event) => setJobForm((prev) => ({ ...prev, industry_id: event.target.value }))}
        >
          <option value="">Select industry</option>
          {industries.map((industry) => (
            <option key={industry.id} value={industry.id}>
              {industry.industry_name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Experience required (years)"
          value={jobForm.experience_required}
          onChange={(event) => setJobForm((prev) => ({ ...prev, experience_required: event.target.value }))}
        />
        <input
          type="text"
          placeholder="Location"
          value={jobForm.location}
          onChange={(event) => setJobForm((prev) => ({ ...prev, location: event.target.value }))}
        />
        <input
          type="number"
          placeholder="Salary min"
          value={jobForm.salary_min}
          onChange={(event) => setJobForm((prev) => ({ ...prev, salary_min: event.target.value }))}
        />
        <input
          type="number"
          placeholder="Salary max"
          value={jobForm.salary_max}
          onChange={(event) => setJobForm((prev) => ({ ...prev, salary_max: event.target.value }))}
        />
        <input
          type="text"
          placeholder="Employment type"
          value={jobForm.employment_type}
          onChange={(event) => setJobForm((prev) => ({ ...prev, employment_type: event.target.value }))}
        />

        <select
          multiple
          value={jobForm.skill_ids}
          onChange={(event) => {
            const values = Array.from(event.target.selectedOptions).map((option) => option.value);
            setJobForm((prev) => ({ ...prev, skill_ids: values }));
          }}
        >
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.skill_name}
            </option>
          ))}
        </select>

        <button className="primary-btn" type="submit">Create Job</button>
      </form>
    </section>
  );

  const renderApplicants = () => (
    <section className="panel-card">
      <div className="card-title-row">
        <h3>Applicant Workflow</h3>
        <div className="inline-editor compact">
          <select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)}>
            <option value="">Select job</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <button type="button" className="primary-btn" onClick={shortlistTopTen}>
            Shortlist Top 10
          </button>
        </div>
      </div>

      <div className="list-stack">
        {applications.map((app) => (
          <article className="list-card" key={app.id}>
            <div>
              <h4>{app.candidate_name}</h4>
              <p>{app.candidate_email} • {app.location || "n/a"}</p>
              <p className="muted">Experience: {app.total_experience_years ?? 0} years</p>
              <p className="muted">Match score: {scoreMap[app.candidate_id] ?? "-"}</p>
            </div>
            <div className="inline-editor compact">
              <span className="status-pill">{app.status}</span>
              <button type="button" className="ghost-btn" onClick={() => updateApplicationStatus(app.id, "shortlisted")}>Shortlist</button>
              <button type="button" className="ghost-btn" onClick={() => updateApplicationStatus(app.id, "rejected")}>Reject</button>
            </div>
          </article>
        ))}
        {!applications.length ? <p className="muted">No applicants for selected job.</p> : null}
      </div>
    </section>
  );

  const renderProfile = () => (
    <section className="panel-card">
      <h3>Company Profile</h3>
      {companyProfile ? (
        <div className="profile-grid">
          <p><strong>Company:</strong> {companyProfile.company_name}</p>
          <p><strong>Website:</strong> {companyProfile.website || "-"}</p>
          <p><strong>Location:</strong> {companyProfile.location || "-"}</p>
          <p><strong>Description:</strong> {companyProfile.description || "-"}</p>
        </div>
      ) : (
        <form className="form-grid" onSubmit={submitCompanyOnboarding}>
          <p className="muted">Complete company onboarding first.</p>
          <input
            required
            type="text"
            placeholder="Company name"
            value={onboardForm.company_name}
            onChange={(event) => setOnboardForm((prev) => ({ ...prev, company_name: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Website"
            value={onboardForm.website}
            onChange={(event) => setOnboardForm((prev) => ({ ...prev, website: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Location"
            value={onboardForm.location}
            onChange={(event) => setOnboardForm((prev) => ({ ...prev, location: event.target.value }))}
          />
          <textarea
            placeholder="Description"
            value={onboardForm.description}
            onChange={(event) => setOnboardForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <button type="submit" className="primary-btn">Submit Onboarding</button>
        </form>
      )}
    </section>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar userRole="company" />
      <main className="dashboard-shell" ref={rootRef}>
        <header className="dashboard-top panel-card">
          <div>
            <h2>Company Panel</h2>
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
        {activeTab === "create" ? renderCreateJob() : null}
        {activeTab === "applicants" ? renderApplicants() : null}
        {activeTab === "profile" ? renderProfile() : null}
      </main>
    </div>
  );
};

export default CompanyDashboard;
