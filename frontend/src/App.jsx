import { Navigate, Route, Routes } from "react-router-dom";
import CandidateAuth from "./cadidateAuth";
import CompanyAuth from "./companyAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import CandidateDashboard from "./pages/CandidateDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import CandidateOnboarding from "./pages/CandidateOnboarding";

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
        path="/candidate/dashboard"
        element={
          <ProtectedRoute role="candidate">
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/dashboard"
        element={
          <ProtectedRoute role="company">
            <CompanyDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;