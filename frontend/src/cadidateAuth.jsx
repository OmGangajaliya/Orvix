import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAlert } from "./context/AlertContext";
import { useAuth } from "./context/AuthContext";
import "./style/auth.css";
import logo from "./assets/orvix-white-logo.png";

const CadidateAuth = () => {
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
            const user = await login({
                email: loginEmail,
                password: loginPassword
            });

            if (user?.role !== "candidate") {
                errorMsg("This account belongs to company panel");
                return;
            }

            const username = user?.name || loginEmail.split("@")[0] || "User";
            successMsg(`Welcome ${username}`);

            navigate("/candidate/dashboard/jobs");
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
                role: "candidate"
            });
            
            successMsg("Registration successful! Logging you in...");
            
            // Auto-login after registration
            setTimeout(async () => {
                try {
                    const user = await login({
                        email: registerEmail,
                        password: registerPassword
                    });

                    if (user?.role === "candidate") {
                        navigate("/candidate/onboarding");
                    }
                } catch (loginError) {
                    errorMsg("Auto-login failed. Please login manually.");
                    setIsRegister(false);
                    setLoginEmail(registerEmail);
                    setLoginPassword("");
                }
            }, 500);
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
                        <h2>{isRegister ? "Candidate Register" : "Candidate Panel Login"}</h2>
                    </div>
                    <div className="bottom">
                        {!isRegister ? (
                            <form onSubmit={loginSubmitHandler}>
                                <div className="input-group">
                                    <label htmlFor="candidate-email">Email</label>
                                    <input
                                        type="email"
                                        required
                                        id="candidate-email"
                                        placeholder="Your email"
                                        value={loginEmail}
                                        onChange={(event) => setLoginEmail(event.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="candidate-password">Password</label>
                                    <input
                                        type="password"
                                        id="candidate-password"
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
                                    <label htmlFor="candidate-name">Full name</label>
                                    <input
                                        type="text"
                                        required
                                        id="candidate-name"
                                        placeholder="Your name"
                                        value={registerName}
                                        onChange={(event) => setRegisterName(event.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="candidate-register-email">Email</label>
                                    <input
                                        type="email"
                                        required
                                        id="candidate-register-email"
                                        placeholder="Your email"
                                        value={registerEmail}
                                        onChange={(event) => setRegisterEmail(event.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="candidate-register-password">Password</label>
                                    <input
                                        type="password"
                                        id="candidate-register-password"
                                        required
                                        placeholder="Create password (min 6 characters)"
                                        value={registerPassword}
                                        onChange={(event) => setRegisterPassword(event.target.value)}
                                    />
                                </div>
                                <button type="submit" className="login-btn" disabled={loading}>
                                    {loading ? "Please wait..." : "Create Account"}
                                </button>
                                <p className="alt-login-text">
                                    Already registered? <button type="button" onClick={() => setIsRegister(false)}>Back to login</button>
                                </p>
                            </form>
                        )}

                        <p className="auth-switch-link">
                            Company account? <Link to="/company/login">Switch to company panel</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CadidateAuth;
