import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Rankings } from "./pages/Rankings";
import { History } from "./pages/History";
import { StockDetail } from "./pages/StockDetail";
import { BarChart3, ListOrdered, TrendingUp } from "lucide-react";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <span className="font-bold text-lg text-gray-900">퀀트 대시보드</span>
              </div>
              <div className="flex items-center gap-1">
                <NavItem to="/" icon={<BarChart3 className="h-4 w-4" />} label="대시보드" />
                <NavItem to="/rankings" icon={<ListOrdered className="h-4 w-4" />} label="순위표" />
                <NavItem to="/history" icon={<TrendingUp className="h-4 w-4" />} label="추이" />
              </div>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/history" element={<History />} />
            <Route path="/stock/:ticker" element={<StockDetail />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
          Quant Dashboard v1.0 · Slow In, Fast Out
        </footer>
      </div>
    </BrowserRouter>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

export default App;
