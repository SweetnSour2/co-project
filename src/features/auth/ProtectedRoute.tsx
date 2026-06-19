import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper text-ink">
        <p className="text-sm text-slate-500">Loading your study workspace...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (profile && !profile.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function OnboardingRoute() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper text-ink">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.onboardingCompleted) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
