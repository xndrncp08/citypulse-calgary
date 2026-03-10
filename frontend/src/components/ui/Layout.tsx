import { Outlet, NavLink } from "react-router-dom";
import clsx from "clsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/map", label: "City Map" },
  { to: "/traffic", label: "Traffic" },
  { to: "/transit", label: "Transit" },
  { to: "/environment", label: "Environment" },
  { to: "/bikes", label: "Bikes" },
  { to: "/history", label: "Historical Data" },
  { to: "/commute", label: "Commute Predictor" },
  { to: "/simulation", label: "Scenario Simulator" },
];

export default function Layout() {
  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-surface-1 border-r border-border">
        {/* Wordmark */}
        <div className="px-5 py-5 border-b border-border">
          <span className="text-sm font-semibold text-text-primary tracking-tight">
            CityPulse
          </span>
          <span className="ml-1.5 text-xs text-text-tertiary font-mono">Calgary</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "block px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-surface-2 text-text-primary font-medium"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border">
          <p className="text-xs text-text-tertiary">
            Data: City of Calgary
            <br />
            Open Data Portal
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface-1 border-b border-border">
          <span className="text-sm font-semibold text-text-primary">CityPulse Calgary</span>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
