import { useState } from "react";
import { MarketTab } from "./tabs/MarketTab";
import { RankingTab } from "./tabs/RankingTab";
import { AITab } from "./tabs/AITab";
import { PicksTab } from "./tabs/PicksTab";
import { Activity } from "lucide-react";

type TabKey = "market" | "ranking" | "ai" | "picks";

const tabs: { key: TabKey; label: string; num: string }[] = [
  { key: "market", label: "시장 현황", num: "" },
  { key: "ranking", label: "Top 30", num: "" },
  { key: "ai", label: "AI 분석", num: "" },
  { key: "picks", label: "최종 추천", num: "" },
];

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("market");

  return (
    <div className="min-h-screen bg-surface-deep">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-default/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="font-bold text-sm text-slate-100">AI 종목 브리핑 KR</span>
              <span className="hidden sm:inline text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                v18.2 · Slow In, Fast Out
              </span>
            </div>

            {/* Desktop tabs */}
            <nav className="hidden sm:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-emerald-600/20 border border-emerald-600/30 text-emerald-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-surface-hover"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden border-t border-border-subtle">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 text-center text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-emerald-400 text-emerald-400"
                    : "border-transparent text-slate-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "market" && <MarketTab />}
        {activeTab === "ranking" && <RankingTab />}
        {activeTab === "ai" && <AITab />}
        {activeTab === "picks" && <PicksTab />}
      </main>
    </div>
  );
}

export default App;
