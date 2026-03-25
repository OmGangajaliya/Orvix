import { Navigate, Route, Routes } from "react-router-dom";
import CandidateAuth from "./cadidateAuth";
import CompanyAuth from "./companyAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import CandidateOnboarding from "./pages/CandidateOnboarding";
import BrowseJobs from "./pages/candidate/BrowseJobs";
import MyApplications from "./pages/candidate/MyApplications";
import CandidateProfile from "./pages/candidate/Profile";
import MatchScores from "./pages/candidate/MatchScores";
import MyJobs from "./pages/company/MyJobs";
import PostJob from "./pages/company/PostJob";
import Applicants from "./pages/company/Applicants";
import CompanyProfile from "./pages/company/Profile";
import CandidateDashboard from "./pages/CandidateDashboard";

const App = () => {
  return (
    <Routes>
      <Route path="/candidate/login" element={<CandidateAuth />} />
      <Route path="/" element={<CandidateAuth />} />
      <Route path="/company/login" element={<CompanyAuth />} />

      <Route
        path="/candidate/onboarding"
        element={
          <ProtectedRoute role="candidate">
            <CandidateOnboarding />
          </ProtectedRoute>
        }
      />

      <Route
        path="/candidate/dashboard/jobs"
        element={
          <ProtectedRoute role="candidate">
            <BrowseJobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/candidate/dashboard/applications"
        element={
          <ProtectedRoute role="candidate">
            <MyApplications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/candidate/dashboard/profile"
        element={
          <ProtectedRoute role="candidate">
            <CandidateProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/candidate/dashboard/matches"
        element={
          <ProtectedRoute role="candidate">
            <MatchScores />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/dashboard/jobs"
        element={
          <ProtectedRoute role="company">
            <MyJobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/dashboard/create"
        element={
          <ProtectedRoute role="company">
            <PostJob />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/dashboard/applicants"
        element={
          <ProtectedRoute role="company">
            <Applicants />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/dashboard/profile"
        element={
          <ProtectedRoute role="company">
            <CompanyProfile />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;