import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import API from "../../api/axios";
import { useAlert } from "../../context/AlertContext";
import Sidebar from "../../components/Sidebar";

const Applicants = () => {
  const rootRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [jobMatches, setJobMatches] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const { successMsg, errorMsg } = useAlert();

  const scoreMap = useMemo(() => {
    return jobMatches.reduce((acc, current) => {
      acc[current.candidate_id] = current.final_score ?? 0;
      return acc;
    }, {});
  }, [jobMatches]);

  useEffect(() => {
    if (!rootRef.current) return;
    gsap.fromTo(
      rootRef.current.querySelectorAll(".list-card"),
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power2.out" }
    );
  }, [applications]);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    loadApplicants(selectedJobId);
    loadJobMatches(selectedJobId);
  }, [selectedJobId]);

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

  return (
    <div className="dashboard-layout">
      <Sidebar userRole="company" />
      <main className="dashboard-shell" ref={rootRef}>
        <header className="dashboard-top panel-card">
          <div>
            <h2>Applicant Workflow</h2>
          </div>
        </header>

        <section className="panel-card">
          <div className="card-title-row">
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
      </main>
    </div>
  );
};

export default Applicants;
