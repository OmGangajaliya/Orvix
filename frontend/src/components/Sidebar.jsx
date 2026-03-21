import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBriefcase,
    faBuilding,
    faChartSimple,
    faFileLines,
    faGaugeHigh,
    faPlus,
    faRightFromBracket,
    faStar,
    faUser,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import logo from "../assets/orvix-white-logo.png";
import "../style/sidebar.css";

const Sidebar = ({ userRole }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { successMsg } = useAlert();

    const candidateMenuItems = [
        { label: "Browse Jobs", path: "/candidate/dashboard/jobs", icon: faBriefcase },
        { label: "My Applications", path: "/candidate/dashboard/applications", icon: faFileLines },
        { label: "Matches", path: "/candidate/dashboard/matches", icon: faStar },
        { label: "Profile", path: "/candidate/dashboard/profile", icon: faUser }
    ];

    const companyMenuItems = [
        { label: "My Jobs", path: "/company/dashboard/jobs", icon: faBriefcase },
        { label: "Post New Job", path: "/company/dashboard/create", icon: faPlus },
        { label: "Applicants", path: "/company/dashboard/applicants", icon: faUsers },
        { label: "Profile", path: "/company/dashboard/profile", icon: faBuilding }
    ];

    const menuItems = userRole === "candidate" ? candidateMenuItems : companyMenuItems;

    const handleLogout = async () => {
        await logout();
        successMsg("Logged out successfully");
        navigate("/");
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.includes(path);
    };

    return (
        <aside className={`sidebar ${isExpanded ? "expanded" : "collapsed"}`}>
            {/* Logo Section */}
            <div className="sidebar-header">
                <img src={logo} alt="Orvix" className="sidebar-logo" />
            </div>

            {/* Menu Items */}
            <div className="nav-wrapper">
                <nav className="sidebar-nav">
                    {menuItems.map((item, idx) => (
                        <Link
                            key={idx}
                            to={item.path}
                            className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                            title={!isExpanded ? item.label : ""}
                        >
                            <span className="nav-icon">
                                <FontAwesomeIcon icon={item.icon} />
                            </span>
                            {isExpanded && <span className="nav-label">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* User Profile Section */}
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn" title="Logout">
                        {isExpanded ? "Logout" : <FontAwesomeIcon icon={faRightFromBracket} />}
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
