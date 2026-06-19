import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AuthPage } from "../features/auth/AuthPage";
import { AuthProvider } from "../features/auth/AuthContext";
import { OnboardingRoute, ProtectedRoute } from "../features/auth/ProtectedRoute";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { AssignmentsPage } from "../pages/AssignmentsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { FocusPage } from "../pages/FocusPage";
import { LandingPage } from "../pages/LandingPage";
import { ProgressPage } from "../pages/ProgressPage";
import { SettingsPage } from "../pages/SettingsPage";

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<OnboardingRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/focus" element={<FocusPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
