import { useEffect, useState } from "react";
import API from "../../api/axios";
import { useAlert } from "../../context/AlertContext";
import Sidebar from "../../components/Sidebar";

const MatchScores = () => {
  const [matches, setMatches] = useState([]);
  const { errorMsg } = useAlert();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const res = await API.get("/matching/scores/mine");
      setMatches(res.data?.data || []);
    } catch {
      setMatches([]);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar userRole="candidate" />
      <main className="dashboard-shell">
        <header className="dashboard-top panel-card">
          <div>
            <h2>Match Scores</h2>
          </div>
        </header>

        <section className="panel-card">
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
      </main>
    </div>
  );
};

export default MatchScores;
