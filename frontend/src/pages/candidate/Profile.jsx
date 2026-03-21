import { useEffect, useState } from "react";
import API from "../../api/axios";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";

const CandidateProfile = () => {
  const [profile, setProfile] = useState(null);
  const [onboardForm, setOnboardForm] = useState({ phone: "", location: "", resume: null });
  const { successMsg, errorMsg } = useAlert();
  const { user } = useAuth();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await API.get("/candidate/profile");
      setProfile(res.data?.data || null);
    } catch {
      setProfile(null);
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

      successMsg("Profile updated successfully");
      await loadProfile();
      setOnboardForm({ phone: "", location: "", resume: null });
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Onboarding failed");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar userRole="candidate" />
      <main className="dashboard-shell">
        <header className="dashboard-top panel-card">
          <div>
            <h2>Profile Management</h2>
          </div>
        </header>

        <section className="panel-card">
          {profile ? (
            <div className="profile-grid">
              <p><strong>Name:</strong> {profile.candidate_name || user?.name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Phone:</strong> {profile.phone || "-"}</p>
              <p><strong>Location:</strong> {profile.location || "-"}</p>
              <p><strong>Experience:</strong> {profile.total_experience_years ?? "-"} years</p>
              <p><strong>Summary:</strong> {profile.profile_summary || "Pending after resume processing"}</p>
              {profile.resume_url && (
                <a href={profile.resume_url} target="_blank" rel="noreferrer" className="text-link">
                  View Uploaded Resume
                </a>
              )}
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
      </main>
    </div>
  );
};

export default CandidateProfile;
