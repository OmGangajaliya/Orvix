import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import "../style/auth.css";
import logo from "../assets/orvix-white-logo.png";

const CandidateOnboarding = () => {
    const navigate = useNavigate();
    const { errorMsg, successMsg } = useAlert();
    const { user, loading } = useAuth();

    const [onboardForm, setOnboardForm] = useState({
        phone: "",
        location: "",
        resume: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOnboardForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setOnboardForm((prev) => ({ ...prev, resume: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!onboardForm.phone.trim()) {
            errorMsg("Please enter your phone number");
            return;
        }

        if (!onboardForm.location.trim()) {
            errorMsg("Please enter your location");
            return;
        }

        if (!onboardForm.resume) {
            errorMsg("Please upload your resume");
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("phone", onboardForm.phone);
            formData.append("location", onboardForm.location);
            formData.append("resume_url", onboardForm.resume);

            const response = await API.post("/candidate/onboard", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            successMsg("Onboarding completed! Redirecting to dashboard...");
            
            // Small delay so user sees success message
            setTimeout(() => {
                navigate("/candidate/dashboard");
            }, 800);
        } catch (error) {
            errorMsg(
                error?.response?.data?.message || "Onboarding failed. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="candidate-login-container">
                <div className="login-content">
                    <div className="top">
                        <img src={logo} alt="Orvix Logo" className="logo-image" />
                        <h2>Complete Your Profile</h2>
                    </div>
                    <div className="bottom">
                        <div className="onboarding-welcome">
                            <p className="welcome-text">Welcome, <strong>{user?.name}</strong>!</p>
                            <p className="welcome-subtext">
                                Let's complete your profile so you can start applying to jobs
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="form-grid">
                            <div className="input-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    id="phone"
                                    name="phone"
                                    placeholder="Your phone number"
                                    value={onboardForm.phone}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="location">Location</label>
                                <input
                                    type="text"
                                    required
                                    id="location"
                                    name="location"
                                    placeholder="City, Country"
                                    value={onboardForm.location}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="resume">Upload Resume (PDF, DOC, DOCX)</label>
                                <input
                                    type="file"
                                    required
                                    id="resume"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                />
                                {onboardForm.resume && (
                                    <p className="file-selected">✓ {onboardForm.resume.name}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="login-btn"
                                disabled={isSubmitting || loading}
                            >
                                {isSubmitting
                                    ? "Completing onboarding..."
                                    : "Complete Onboarding"}
                            </button>
                        </form>

                        <p className="onboarding-skip">
                            You can skip this for now and{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/candidate/dashboard")}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#0e64b9",
                                    fontSize: "0.9rem",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    textUnderlineOffset: "3px"
                                }}
                            >
                                continue to dashboard
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateOnboarding;
