import { useEffect, useState } from "react";
import API from "../../api/axios";
import { useAlert } from "../../context/AlertContext";
import Sidebar from "../../components/Sidebar";

const CompanyProfile = () => {
  const [companyProfile, setCompanyProfile] = useState(null);
  const [onboardForm, setOnboardForm] = useState({
    company_name: "",
    website: "",
    location: "",
    description: ""
  });
  const { successMsg, errorMsg } = useAlert();

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      const res = await API.get("/company/profile");
      setCompanyProfile(res.data?.data || null);
    } catch {
      setCompanyProfile(null);
    }
  };

  const submitCompanyOnboarding = async (event) => {
    event.preventDefault();
    try {
      await API.post("/company/onboard", onboardForm);
      successMsg("Company profile updated");
      await loadCompanyProfile();
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to update company profile");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar userRole="company" />
      <main className="dashboard-shell">
        <header className="dashboard-top panel-card">
          <div>
            <h2>Company Profile</h2>
          </div>
        </header>

        <section className="panel-card">
          {companyProfile ? (
            <div className="profile-grid">
              <p><strong>Company Name:</strong> {companyProfile.company_name || "-"}</p>
              <p><strong>Website:</strong> {companyProfile.website || "-"}</p>
              <p><strong>Location:</strong> {companyProfile.location || "-"}</p>
              <p><strong>Description:</strong> {companyProfile.description || "-"}</p>
            </div>
          ) : (
            <form className="form-grid" onSubmit={submitCompanyOnboarding}>
              <p className="muted">Complete your company profile.</p>
              <input
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
                placeholder="Company description"
                value={onboardForm.description}
                onChange={(event) => setOnboardForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <button type="submit" className="primary-btn">Save Company Profile</button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
};

export default CompanyProfile;
