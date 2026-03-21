import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useAlert } from "../../context/AlertContext";
import Sidebar from "../../components/Sidebar";

const PostJob = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const { successMsg, errorMsg } = useAlert();

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

  useEffect(() => {
    loadMeta();
  }, []);

  const filteredSkills = useMemo(() => {
    const query = skillQuery.trim().toLowerCase();
    if (!query) return skills;
    return skills.filter((skill) => skill.skill_name?.toLowerCase().includes(query));
  }, [skills, skillQuery]);

  const loadMeta = async () => {
    try {
      setLoadingMeta(true);
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
    } finally {
      setLoadingMeta(false);
    }
  };

  const toggleSkill = (skillId) => {
    setJobForm((prev) => {
      const exists = prev.skill_ids.includes(String(skillId));
      return {
        ...prev,
        skill_ids: exists
          ? prev.skill_ids.filter((id) => id !== String(skillId))
          : [...prev.skill_ids, String(skillId)]
      };
    });
  };

  const postJob = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
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
      navigate("/company/dashboard/jobs");
    } catch (error) {
      errorMsg(error?.response?.data?.message || "Failed to post job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar userRole="company" />
      <main className="dashboard-shell">
        <header className="dashboard-top panel-card">
          <div>
            <h2>Post New Job</h2>
          </div>
        </header>

        <section className="panel-card add-job-shell">
          {loadingMeta ? <p className="muted">Loading form data...</p> : null}

          <form className="add-job-form" onSubmit={postJob}>
            <div className="add-job-grid">
              <div className="add-job-block">
                <h3>Core Details</h3>

                <label className="add-job-field">
                  <span>Job Title</span>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Senior Backend Engineer"
                    value={jobForm.title}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </label>

                <label className="add-job-field">
                  <span>Role</span>
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
                </label>

                <label className="add-job-field">
                  <span>Industry</span>
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
                </label>

                <label className="add-job-field">
                  <span>Description</span>
                  <textarea
                    required
                    placeholder="Write responsibilities, expectations, and success criteria"
                    value={jobForm.description}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>
              </div>

              <div className="add-job-block">
                <h3>Compensation and Terms</h3>

                <label className="add-job-field">
                  <span>Location</span>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, Hybrid"
                    value={jobForm.location}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, location: event.target.value }))}
                  />
                </label>

                <div className="add-job-inline">
                  <label className="add-job-field">
                    <span>Salary Min</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={jobForm.salary_min}
                      onChange={(event) => setJobForm((prev) => ({ ...prev, salary_min: event.target.value }))}
                    />
                  </label>

                  <label className="add-job-field">
                    <span>Salary Max</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={jobForm.salary_max}
                      onChange={(event) => setJobForm((prev) => ({ ...prev, salary_max: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="add-job-inline">
                  <label className="add-job-field">
                    <span>Experience (Years)</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={jobForm.experience_required}
                      onChange={(event) => setJobForm((prev) => ({ ...prev, experience_required: event.target.value }))}
                    />
                  </label>

                  <label className="add-job-field">
                    <span>Employment Type</span>
                    <select
                      value={jobForm.employment_type}
                      onChange={(event) => setJobForm((prev) => ({ ...prev, employment_type: event.target.value }))}
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="add-job-block">
              <h3>Required Skills</h3>
              <input
                type="text"
                placeholder="Search skills"
                value={skillQuery}
                onChange={(event) => setSkillQuery(event.target.value)}
              />

              <div className="skills-picker-grid">
                {filteredSkills.map((skill) => (
                  <label className="skill-toggle" key={skill.id}>
                    <input
                      type="checkbox"
                      checked={jobForm.skill_ids.includes(String(skill.id))}
                      onChange={() => toggleSkill(skill.id)}
                    />
                    <span>{skill.skill_name}</span>
                  </label>
                ))}
              </div>

              <div className="chip-row">
                {jobForm.skill_ids.length
                  ? jobForm.skill_ids.map((id) => {
                      const skill = skills.find((item) => String(item.id) === id);
                      return <span className="chip" key={id}>{skill?.skill_name || `Skill ${id}`}</span>;
                    })
                  : <p className="muted">No skills selected</p>}
              </div>
            </div>

            <div className="add-job-actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => navigate("/company/dashboard/jobs")}
              >
                Cancel
              </button>
              <button className="primary-btn" type="submit" disabled={submitting || loadingMeta}>
                {submitting ? "Posting..." : "Create Job"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default PostJob;
