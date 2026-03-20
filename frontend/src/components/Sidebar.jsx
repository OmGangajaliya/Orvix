import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/orvix-white-logo.png";
import "../style/sidebar.css";

const Sidebar = ({ userRole }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const candidateMenuItems = [
        { label: "Dashboard", path: "/candidate/dashboard", icon: "📊" },
        { label: "Browse Jobs", path: "/candidate/dashboard?tab=jobs", icon: "💼" },
        { label: "My Applications", path: "/candidate/dashboard?tab=applications", icon: "📋" },
        { label: "Matches", path: "/candidate/dashboard?tab=matches", icon: "⭐" },
        { label: "Profile", path: "/candidate/dashboard?tab=profile", icon: "👤" }
    ];

    const companyMenuItems = [
        { label: "Dashboard", path: "/company/dashboard", icon: "📊" },
        { label: "My Jobs", path: "/company/dashboard?tab=jobs", icon: "💼" },
        { label: "Post New Job", path: "/company/dashboard?tab=create", icon: "➕" },
        { label: "Applicants", path: "/company/dashboard?tab=applicants", icon: "👥" },
        { label: "Profile", path: "/company/dashboard?tab=profile", icon: "🏢" }
    ];

    const menuItems = userRole === "candidate" ? candidateMenuItems : companyMenuItems;

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.includes(path);
    };

    return (
        <aside className={`sidebar ${isExpanded ? "expanded" : "collapsed"}`}>
            {/* Logo Section */}
            <div className="sidebar-header">
                <div className="logo-wrapper">
                    <img src={logo} alt="Orvix" className="sidebar-logo" />
                    {isExpanded && <span className="logo-text">Orvix</span>}
                </div>
                <button
                    className="toggle-btn"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Collapse" : "Expand"}
                >
                    {isExpanded ? "−" : "+"}
                </button>
            </div>

            {/* Menu Items */}
            <nav className="sidebar-nav">
                {menuItems.map((item, idx) => (
                    <Link
                        key={idx}
                        to={item.path}
                        className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                        title={!isExpanded ? item.label : ""}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {isExpanded && <span className="nav-label">{item.label}</span>}
                    </Link>
                ))}
            </nav>

            {/* User Profile Section */}
            <div className="sidebar-footer">
                <div className={`user-card ${!isExpanded ? "collapsed" : ""}`}>
                    <div className="user-avatar">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    {isExpanded && (
                        <div className="user-info">
                            <p className="user-name">{user?.name}</p>
                            <p className="user-role">
                                {userRole === "candidate" ? "Candidate" : "Company"}
                            </p>
                        </div>
                    )}
                </div>

                <button onClick={handleLogout} className="logout-btn" title="Logout">
                    {isExpanded ? "Logout" : "↪"}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
