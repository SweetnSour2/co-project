import {
  BarChart3,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Settings,
  Timer,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../features/auth/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assignments", label: "Assignments", icon: CheckSquare },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout() {
  const { profile, logOut } = useAuth();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 lg:block">
        <div className="text-xl font-black text-slate-950">StudyPilot AI</div>
        <p className="mt-1 text-sm text-slate-500">Academic planning assistant</p>
        <nav className="mt-8 grid gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-slate-50 p-4">
          <p className="font-semibold text-slate-950">{profile?.displayName ?? "Student"}</p>
          <Button className="mt-3 w-full" variant="ghost" onClick={logOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-black">StudyPilot AI</span>
            <Button variant="ghost" onClick={logOut}>
              Log out
            </Button>
          </div>
          <nav className="flex gap-2 overflow-x-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-xs font-semibold ${
                    isActive ? "bg-brand-50 text-brand-700" : "text-slate-600"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
