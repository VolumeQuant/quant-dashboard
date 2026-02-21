import { Activity } from "lucide-react";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="min-h-screen bg-surface-deep">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-default/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="font-bold text-sm text-slate-100">AI 종목 브리핑 KR</span>
              <span className="hidden sm:inline text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                v20.4 · Slow In, Fast Out
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
