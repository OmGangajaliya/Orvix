import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import API from "../../api/axios";
import { useAlert } from "../../context/AlertContext";
import Sidebar from "../../components/Sidebar";
import "../../style/candidate/candidate-dashboard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faMagnifyingGlass, 
  faBriefcase, 
  faMapPin, 
  faEye, 
  faPaperPlane,
  faX,
  faClock
} from "@fortawesome/free-solid-svg-icons";

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
      rootRef.current.querySelectorAll(".cand-job-card"),
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
        <header className="dashboard-top panel-card" style={{ marginBottom: "1.5rem" }}>
          <div>
            <h2>Browse Opportunities</h2>
          </div>
        </header>

        <section className="cand-browse-jobs-panel">
          <div className="cand-browse-jobs-filter-header" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ color: "#0d62ca", fontSize: "1.2rem", margin: "0 0 0.8rem 0", fontWeight: "700" }}>
              <FontAwesomeIcon icon={faBriefcase} style={{ marginRight: "0.6rem" }} />
              Filter Jobs
            </h3>
          </div>

          <div className="cand-browse-jobs-filters">
            <div className="filter-input-wrapper" style={{ position: "relative" }}>
              <FontAwesomeIcon 
                icon={faMagnifyingGlass} 
                style={{
                  position: "absolute",
                  left: "1.3rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#0d62ca",
                  fontSize: "1rem",
                  pointerEvents: "none"
                }} 
              />
              <input
                type="text"
                placeholder="Search job title, company..."
                className="cand-browse-jobs-filter-input"
                style={{ paddingLeft: "3rem" }}
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="filter-input-wrapper" style={{ position: "relative" }}>
              <FontAwesomeIcon 
                icon={faBriefcase} 
                style={{
                  position: "absolute",
                  left: "1.3rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#0d62ca",
                  fontSize: "1rem",
                  pointerEvents: "none"
                }} 
              />
              <select
                className="cand-browse-jobs-filter-input"
                style={{ paddingLeft: "3rem" }}
                value={jobFilters.role_id}
                onChange={(event) => {
                  const next = { ...jobFilters, role_id: event.target.value };
                  setJobFilters(next);
                  loadJobs(next);
                }}
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-input-wrapper" style={{ position: "relative" }}>
              <FontAwesomeIcon 
                icon={faMapPin} 
                style={{
                  position: "absolute",
                  left: "1.3rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#0d62ca",
                  fontSize: "1rem",
                  pointerEvents: "none"
                }} 
              />
              <select
                className="cand-browse-jobs-filter-input"
                style={{ paddingLeft: "3rem" }}
                value={jobFilters.industry_id}
                onChange={(event) => {
                  const next = { ...jobFilters, industry_id: event.target.value };
                  setJobFilters(next);
                  loadJobs(next);
                }}
              >
                <option value="">Select Industry</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.industry_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#1a5d9e" }}>
              <FontAwesomeIcon icon={faClock} style={{ marginRight: "0.5rem", animation: "spin 1s linear infinite" }} />
              <span>Loading opportunities...</span>
            </div>
          ) : null}
        </section>

        <div className="cand-browse-jobs-jobs-container" style={{ marginTop: "1rem" }}>
          {visibleJobs.length > 0 ? (
            visibleJobs.map((job) => (
              <article className="cand-job-card" key={job.id}>
                <div style={{ flex: 1 }}>
                  <h4 className="cand-job-card-title">
                    <FontAwesomeIcon icon={faBriefcase} style={{ marginRight: "0.6rem", fontSize: "1.1rem" }} />
                    {job.title}
                  </h4>
                  
                  <p className="cand-job-card-company" style={{ marginTop: "0.6rem", fontWeight: "600" }}>
                    {job.company_name || "Unknown Company"}
                  </p>
                  
                  <p className="cand-job-card-company" style={{ marginTop: "0.4rem" }}>
                    <FontAwesomeIcon icon={faMapPin} style={{ marginRight: "0.4rem", fontSize: "0.9rem" }} />
                    {job.location || "Remote / Flexible"}
                  </p>
                </div>

                <div className="cand-job-card-actions">
                  <button
                    type="button"
                    className="cand-job-view-details-btn"
                    onClick={() => setSelectedJob(job)}
                  >
                    <FontAwesomeIcon icon={faEye} style={{ marginRight: "0.4rem" }} />
                    View Details
                  </button>

                  <button
                    type="button"
                    className="cand-job-apply-btn"
                    disabled={appliedJobIds.has(job.id)}
                    onClick={() => applyToJob(job.id)}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: "0.4rem" }} />
                    {appliedJobIds.has(job.id) ? "Applied ✓" : "Apply Now"}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="cand-browse-jobs-empty" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>
              No jobs available matching your criteria.
            </div>
          )}
        </div>

        {selectedJob ? (
          <div className="cand-job-modal-overlay" onClick={() => setSelectedJob(null)}>
            <section className="cand-job-modal" onClick={(event) => event.stopPropagation()}>
              <div className="cand-job-modal-header">
                <div>
                  <h3 style={{ margin: "0 0 0.3rem 0" }}>
                    <FontAwesomeIcon icon={faBriefcase} style={{ marginRight: "0.8rem", color: "#0d62ca" }} />
                    {selectedJob.title}
                  </h3>
                  <p style={{ margin: "0", color: "#1a5d9e", fontSize: "0.95rem", fontWeight: "500" }}>
                    {selectedJob.company_name}
                  </p>
                </div>
                <button 
                  type="button" 
                  className="cand-job-modal-close-btn" 
                  onClick={() => setSelectedJob(null)}
                  style={{ alignSelf: "flex-start" }}
                >
                  <FontAwesomeIcon icon={faX} style={{ marginRight: "0.4rem" }} />
                  Close
                </button>
              </div>

              <div className="cand-job-modal-grid" style={{ marginTop: "1.5rem" }}>
                <div>
                  <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.85rem", fontWeight: "600", color: "#0d62ca" }}>
                    <FontAwesomeIcon icon={faMapPin} style={{ marginRight: "0.4rem" }} />
                    Location
                  </p>
                  <p style={{ margin: "0", color: "#245f97" }}>{selectedJob.location || "Remote / Flexible"}</p>
                </div>

                <div>
                  <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.85rem", fontWeight: "600", color: "#0d62ca" }}>
                    💼 Role Type
                  </p>
                  <p style={{ margin: "0", color: "#245f97" }}>{selectedJob.role_name || "Not specified"}</p>
                </div>

                <div>
                  <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.85rem", fontWeight: "600", color: "#0d62ca" }}>
                    🏭 Industry
                  </p>
                  <p style={{ margin: "0", color: "#245f97" }}>{selectedJob.industry_name || "Not specified"}</p>
                </div>

                <div>
                  <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.85rem", fontWeight: "600", color: "#0d62ca" }}>
                    📊 Experience
                  </p>
                  <p style={{ margin: "0", color: "#245f97" }}>{selectedJob.experience_required ?? "Not specified"} years</p>
                </div>

                <div>
                  <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.85rem", fontWeight: "600", color: "#0d62ca" }}>
                    ⏱️ Employment
                  </p>
                  <p style={{ margin: "0", color: "#245f97", textTransform: "capitalize" }}>
                    {selectedJob.employment_type || "Not specified"}
                  </p>
                </div>

                <div>
                  <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.85rem", fontWeight: "600", color: "#0d62ca" }}>
                    💰 Salary
                  </p>
                  <p style={{ margin: "0", color: "#245f97" }}>
                    {selectedJob.salary_min || "-"} - {selectedJob.salary_max || "-"}
                  </p>
                </div>
              </div>

              <div className="cand-job-modal-body" style={{ marginTop: "1.5rem" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.8rem 0", color: "#0d62ca", fontSize: "1.1rem", fontWeight: "700" }}>
                    📝 Job Description
                  </h4>
                  <p style={{ margin: "0", color: "#245f97", lineHeight: "1.6", fontSize: "0.95rem" }}>
                    {selectedJob.description || "No description provided."}
                  </p>
                </div>

                <div style={{ marginTop: "1.2rem" }}>
                  <h4 style={{ margin: "0 0 0.8rem 0", color: "#0d62ca", fontSize: "1.1rem", fontWeight: "700" }}>
                    🎯 Required Skills
                  </h4>
                  <div className="cand-job-card-skills-row">
                    {(selectedJob.skills || []).length > 0 ? (
                      selectedJob.skills.map((skill) => (
                        <span key={skill} className="cand-job-skill-chip">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p style={{ margin: "0", color: "#245f97" }}>No skills listed.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="cand-job-modal-actions" style={{ marginTop: "2rem" }}>
                <button
                  type="button"
                  className="cand-job-modal-apply-btn"
                  disabled={appliedJobIds.has(selectedJob.id)}
                  onClick={() => applyToJob(selectedJob.id)}
                >
                  <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: "0.6rem" }} />
                  {appliedJobIds.has(selectedJob.id) ? "Already Applied ✓" : "Apply Now"}
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
