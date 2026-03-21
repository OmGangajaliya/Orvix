import { useEffect, useState } from "react";
import API from "../../api/axios";
import { useAlert } from "../../context/AlertContext";
import Sidebar from "../../components/Sidebar";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const { errorMsg } = useAlert();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const res = await API.get("/applications/mine");
      setApplications(res.data?.data || []);
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to load applications");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar userRole="candidate" />
      <main className="dashboard-shell">
        <header className="dashboard-top panel-card">
          <div>
            <h2>My Applications</h2>
          </div>
        </header>

        <section className="panel-card">
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
      </main>
    </div>
  );
};

export default MyApplications;
