import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Rankings } from "./pages/Rankings";
import { History } from "./pages/History";
import { StockDetail } from "./pages/StockDetail";
import {
  BarChart3,
  ListOrdered,
  TrendingUp,
  Moon,
  Sun,
  Activity,
} from "lucide-react";

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return true; // default to dark
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return [isDark, setIsDark] as const;
}

function App() {
  const [isDark, setIsDark] = useDarkMode();

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-primary)" }}>
        {/* Desktop Navigation */}
        <nav
          className="sticky top-0 z-50 border-b hidden md:block"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="max-w-dashboard mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <NavLink to="/" className="flex items-center gap-2.5 group">
                <div className="p-1.5 rounded-lg bg-blue-500/15 group-hover:bg-blue-500/25 transition-colors">
                  <Activity className="h-5 w-5 text-blue-400" />
                </div>
                <span
                  className="font-bold text-base"
                  style={{ color: "var(--text-primary)" }}
                >
                  AI 종목 브리핑 KR
                </span>
              </NavLink>

              {/* Nav Links */}
              <div className="flex items-center gap-1">
                <DesktopNavItem
                  to="/"
                  icon={<BarChart3 className="h-4 w-4" />}
                  label="대시보드"
                />
                <DesktopNavItem
                  to="/rankings"
                  icon={<ListOrdered className="h-4 w-4" />}
                  label="순위표"
                />
                <DesktopNavItem
                  to="/history"
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="추이"
                />

                {/* Dark mode toggle */}
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="ml-3 p-2 rounded-lg transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = "transparent";
                  }}
                  title={isDark ? "라이트 모드" : "다크 모드"}
                >
                  {isDark ? (
                    <Sun className="h-4.5 w-4.5" />
                  ) : (
                    <Moon className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 max-w-dashboard mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/history" element={<History />} />
            <Route path="/stock/:ticker" element={<StockDetail />} />
          </Routes>
        </main>

        {/* Footer - Desktop */}
        <footer
          className="hidden md:block border-t py-4 text-center text-xs"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--text-tertiary)",
          }}
        >
          AI 종목 브리핑 KR v18.2 · Slow In, Fast Out · 전략 v5.3
        </footer>

        {/* Mobile Bottom Navigation */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="flex items-center justify-around h-14">
            <MobileNavItem
              to="/"
              icon={<BarChart3 className="h-5 w-5" />}
              label="대시보드"
            />
            <MobileNavItem
              to="/rankings"
              icon={<ListOrdered className="h-5 w-5" />}
              label="순위표"
            />
            <MobileNavItem
              to="/history"
              icon={<TrendingUp className="h-5 w-5" />}
              label="추이"
            />
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="text-[10px]">{isDark ? "라이트" : "다크"}</span>
            </button>
          </div>
        </nav>
      </div>
    </BrowserRouter>
  );
}

function DesktopNavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-blue-500/15 text-blue-400"
            : "hover:bg-[var(--bg-hover)]"
        }`
      }
      style={({ isActive }) =>
        isActive
          ? undefined
          : { color: "var(--text-secondary)" }
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function MobileNavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
          isActive ? "text-blue-400" : ""
        }`
      }
      style={({ isActive }) =>
        isActive ? undefined : { color: "var(--text-tertiary)" }
      }
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}

export default App;
