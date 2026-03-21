import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import API from "../../api/axios";
import { useAlert } from "../../context/AlertContext";
import Sidebar from "../../components/Sidebar";

const MyJobs = () => {
  const rootRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [salaryDraft, setSalaryDraft] = useState({});
  const { successMsg, errorMsg } = useAlert();

  useEffect(() => {
    if (!rootRef.current) return;
    gsap.fromTo(
      rootRef.current.querySelectorAll(".list-card"),
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power2.out" }
    );
  }, [jobs]);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchText.trim().toLowerCase());
    }, 350);

    return () => clearTimeout(debounceTimer);
  }, [searchText]);

  const visibleJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus = statusFilter ? (job.status || "").toLowerCase() === statusFilter.toLowerCase() : true;

      if (!matchesStatus) return false;
      if (!debouncedSearch) return true;

      const searchable = [
        job.title,
        job.company_name,
        job.location,
        job.description,
        job.role_name,
        job.industry_name,
        ...(job.skills || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(debouncedSearch);
    });
  }, [jobs, debouncedSearch, statusFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await API.get("/jobs");
      setJobs(res.data?.data || []);
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
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

  return (
    <div className="dashboard-layout">
      <Sidebar userRole="company" />
      <main className="dashboard-shell" ref={rootRef}>
        <header className="dashboard-top panel-card">
          <div>
            <h2>Manage Job Postings</h2>
          </div>
        </header>

        <section className="panel-card">
          <div className="filter-grid minimal-filter-grid">
            <input
              type="text"
              placeholder="Search title, location, role, description"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>

            <button type="button" className="ghost-btn" onClick={() => { setSearchText(""); setStatusFilter(""); }}>
              Clear
            </button>
          </div>

          {loading ? <p className="muted">Loading jobs...</p> : null}

          <div className="list-stack">
            {visibleJobs.map((job) => (
              <article className="list-card job-card-compact" key={job.id}>
                <div className="job-card-main">
                  <h4>{job.title}</h4>
                  <p className="job-card-subtitle">{job.company_name || "Your Company"}</p>
                  <p className="job-card-subtitle">{job.location || "Remote / Flexible"}</p>
                </div>

                <div className="job-card-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => {
                      setSelectedJob(job);
                      setSalaryDraft({
                        min: job.salary_min ?? "",
                        max: job.salary_max ?? ""
                      });
                    }}
                  >
                    View Job
                  </button>
                </div>
              </article>
            ))}
            {!visibleJobs.length ? <p className="muted">No jobs yet.</p> : null}
          </div>
        </section>

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
                <p><strong>Company:</strong> {selectedJob.company_name || "Your Company"}</p>
                <p><strong>Location:</strong> {selectedJob.location || "Remote / Flexible"}</p>
                <p><strong>Role:</strong> {selectedJob.role_name || "Not specified"}</p>
                <p><strong>Industry:</strong> {selectedJob.industry_name || "Not specified"}</p>
                <p><strong>Experience Required:</strong> {selectedJob.experience_required ?? "Not specified"} years</p>
                <p><strong>Employment Type:</strong> {selectedJob.employment_type || "Not specified"}</p>
                <p><strong>Status:</strong> {selectedJob.status || "active"}</p>
                <p><strong>Created:</strong> {selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleString() : "N/A"}</p>
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

                <h4>Update Salary</h4>
                <div className="inline-editor compact">
                  <input
                    type="number"
                    placeholder="Salary min"
                    value={salaryDraft.min}
                    onChange={(event) => setSalaryDraft((prev) => ({ ...prev, min: event.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Salary max"
                    value={salaryDraft.max}
                    onChange={(event) => setSalaryDraft((prev) => ({ ...prev, max: event.target.value }))}
                  />
                </div>
              </div>

              <div className="job-modal-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={async () => {
                    await updateSalary(selectedJob.id, salaryDraft.min, salaryDraft.max);
                    setSelectedJob((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        salary_min: salaryDraft.min,
                        salary_max: salaryDraft.max
                      };
                    });
                  }}
                >
                  Save Salary
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default MyJobs;
