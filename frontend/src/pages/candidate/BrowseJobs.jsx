import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import API from "../../api/axios";
import { useAlert } from "../../context/AlertContext";
import Sidebar from "../../components/Sidebar";

const BrowseJobs = () => {
  const rootRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobFilters, setJobFilters] = useState({ role_id: "", industry_id: "", status: "active" });
  const [applications, setApplications] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  const { successMsg, errorMsg } = useAlert();

  useEffect(() => {
    if (!rootRef.current) return;
    gsap.fromTo(
      rootRef.current.querySelectorAll(".list-card"),
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power2.out" }
    );
  }, [jobs]);

  useEffect(() => {
    loadMeta();
    loadJobs();
    loadApplications();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchText.trim().toLowerCase());
    }, 350);

    return () => clearTimeout(debounceTimer);
  }, [searchText]);

  const appliedJobIds = useMemo(() => new Set(applications.map((app) => app.job_id)), [applications]);

  const visibleJobs = useMemo(() => {
    if (!debouncedSearch) return jobs;

    return jobs.filter((job) => {
      const searchable = [
        job.title,
        job.company_name,
        job.location,
        job.description,
        ...(job.skills || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(debouncedSearch);
    });
  }, [jobs, debouncedSearch]);

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

  const applyToJob = async (jobId) => {
    try {
      await API.post(`/applications/jobs/${jobId}/apply`);
      successMsg("Application submitted");
      loadApplications();
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to apply");
    }
  };

  return (
    <div className="dashboard-layout candidate-dashboard-layout">
      <Sidebar userRole="candidate" />
      <main className="dashboard-shell" ref={rootRef}>
        <header className="dashboard-top panel-card">
          <div>
            <h2>Browse Jobs</h2>
          </div>
        </header>

        <section className="panel-card">
          <div className="filter-grid minimal-filter-grid">
            <input
              type="text"
              placeholder="Search Position"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />

            <select
              value={jobFilters.role_id}
              onChange={(event) => {
                const next = { ...jobFilters, role_id: event.target.value };
                setJobFilters(next);
                loadJobs(next);
              }}
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
              onChange={(event) => {
                const next = { ...jobFilters, industry_id: event.target.value };
                setJobFilters(next);
                loadJobs(next);
              }}
            >
              <option value="">All industries</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.industry_name}
                </option>
              ))}
            </select>
          </div>

          {loading ? <p className="muted">Loading jobs...</p> : null}
        </section>
        <div className="list-stack">
          {visibleJobs.map((job) => (
            <article className="list-card job-card-compact" key={job.id}>
              <div className="job-card-main">
                <h4>{job.title}</h4>
                <p className="job-card-subtitle">{job.company_name || "Unknown company"}</p>
                <p className="job-card-subtitle">{job.location || "Remote / Flexible"}</p>
              </div>

              <div className="job-card-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setSelectedJob(job)}
                >
                  View Job
                </button>

                <button
                  type="button"
                  className="primary-btn"
                  disabled={appliedJobIds.has(job.id)}
                  onClick={() => applyToJob(job.id)}
                >
                  {appliedJobIds.has(job.id) ? "Applied" : "Apply"}
                </button>
              </div>
            </article>
          ))}
          {!visibleJobs.length ? <p className="muted">No jobs available.</p> : null}
        </div>
        {selectedJob ? (
          <div className="job-modal-overlay" onClick={() => setSelectedJob(null)}>
            <section className="job-modal" onClick={(event) => event.stopPropagation()}>
              <div className="job-modal-header">
                <h3>{selectedJob.title}</h3>
                <button type="button" className="ghost-btn" onClick={() => setSelectedJob(null)}>
                  Close
                </button>
              </div>

              <div className="job-modal-grid">
                <p><strong>Company:</strong> {selectedJob.company_name || "Unknown"}</p>
                <p><strong>Location:</strong> {selectedJob.location || "Remote / Flexible"}</p>
                <p><strong>Role:</strong> {selectedJob.role_name || "Not specified"}</p>
                <p><strong>Industry:</strong> {selectedJob.industry_name || "Not specified"}</p>
                <p><strong>Experience Required:</strong> {selectedJob.experience_required ?? "Not specified"} years</p>
                <p><strong>Employment Type:</strong> {selectedJob.employment_type || "Not specified"}</p>
                <p>
                  <strong>Salary:</strong> {selectedJob.salary_min ?? "-"} - {selectedJob.salary_max ?? "-"}
                </p>
                <p><strong>Status:</strong> {selectedJob.status || "active"}</p>
              </div>

              <div className="job-modal-body">
                <h4>Description</h4>
                <p>{selectedJob.description || "No description provided."}</p>

                <h4>Skills</h4>
                <p className="chip-row">
                  {(selectedJob.skills || []).length
                    ? selectedJob.skills.map((skill) => (
                      <span key={skill} className="chip">{skill}</span>
                    ))
                    : "No skills listed."}
                </p>
              </div>

              <div className="job-modal-actions">
                <button
                  type="button"
                  className="primary-btn"
                  disabled={appliedJobIds.has(selectedJob.id)}
                  onClick={() => applyToJob(selectedJob.id)}
                >
                  {appliedJobIds.has(selectedJob.id) ? "Applied" : "Apply"}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default BrowseJobs;
