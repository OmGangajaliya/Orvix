import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAlert } from "./context/AlertContext";
import { useAuth } from "./context/AuthContext";
import "./style/auth.css";
import logo from "./assets/orvix-white-logo.png";

const CompanyAuth = () => {
    const navigate = useNavigate();
    const { errorMsg, successMsg } = useAlert();
    const { login, register, loading } = useAuth();

    const [isRegister, setIsRegister] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    const [registerName, setRegisterName] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");

    const loginSubmitHandler = async (event) => {
        event.preventDefault();
        try {
            const user = await login({ email: loginEmail, password: loginPassword });
            if (user?.role !== "company") {
                errorMsg("This account belongs to candidate panel");
                return;
            }

            const username = user?.name || loginEmail.split("@")[0] || "User";
            successMsg(`Welcome ${username}`);
            navigate("/company/dashboard/jobs");
        } catch (error) {
            errorMsg(error?.response?.data?.message || "Invalid credentials");
        }
    };

    const registerSubmitHandler = async (event) => {
        event.preventDefault();
        try {
            await register({
                name: registerName,
                email: registerEmail,
                password: registerPassword,
                role: "company"
            });
            successMsg("Company registered, please login");
            setIsRegister(false);
            setLoginEmail(registerEmail);
            setLoginPassword("");
        } catch (error) {
            errorMsg(error?.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="candidate-login-container">
                <div className="login-content">
                    <div className="top">
                        <img src={logo} alt="Orvix Logo" className="logo-image" />
                        <h2>{isRegister ? "Company Register" : "Company Panel Login"}</h2>
                    </div>
                    <div className="bottom">
                        {!isRegister ? (
                            <form onSubmit={loginSubmitHandler}>
                                <div className="input-group">
                                    <label htmlFor="company-email">Email</label>
                                    <input
                                        type="email"
                                        required
                                        id="company-email"
                                        placeholder="Your email"
                                        value={loginEmail}
                                        onChange={(event) => setLoginEmail(event.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="company-password">Password</label>
                                    <input
                                        type="password"
                                        id="company-password"
                                        required
                                        placeholder="Your password"
                                        value={loginPassword}
                                        onChange={(event) => setLoginPassword(event.target.value)}
                                    />
                                </div>
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? "Please wait..." : "Login"}
                                </button>
                                <p className="alt-login-text">
                                    Dont have an account? <button type="button" onClick={() => setIsRegister(true)}>Register here</button>
                                </p>
                            </form>
                        ) : (
                            <form onSubmit={registerSubmitHandler}>
                                <div className="input-group">
                                    <label htmlFor="company-name">Company name</label>
                                    <input
                                        type="text"
                                        required
                                        id="company-name"
                                        placeholder="Company name"
                                        value={registerName}
                                        onChange={(event) => setRegisterName(event.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="company-register-email">Email</label>
                                    <input
                                        type="email"
                                        required
                                        id="company-register-email"
                                        placeholder="Company email"
                                        value={registerEmail}
                                        onChange={(event) => setRegisterEmail(event.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="company-register-password">Password</label>
                                    <input
                                        type="password"
                                        id="company-register-password"
                                        required
                                        placeholder="Create password"
                                        value={registerPassword}
                                        onChange={(event) => setRegisterPassword(event.target.value)}
                                    />
                                </div>
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? "Please wait..." : "Create Company Account"}
                                </button>
                                <p className="alt-login-text">
                                    Already registered? <button type="button" onClick={() => setIsRegister(false)}>Back to login</button>
                                </p>
                            </form>
                        )}
                        <p className="auth-switch-link">
                            Candidate account? <Link to="/candidate/login">Switch to candidate panel</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyAuth;
