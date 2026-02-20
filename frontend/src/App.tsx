import { useState, useEffect } from "react";
import { MarketTab } from "./tabs/MarketTab";
import { RankingTab } from "./tabs/RankingTab";
import { AITab } from "./tabs/AITab";
import { PicksTab } from "./tabs/PicksTab";
import { Activity, Moon, Sun } from "lucide-react";

type TabKey = "market" | "ranking" | "ai" | "picks";

const tabs: { key: TabKey; label: string; labelShort: string }[] = [
  { key: "market", label: "시장 현황", labelShort: "시장" },
  { key: "ranking", label: "Top 30", labelShort: "Top30" },
  { key: "ai", label: "AI 분석", labelShort: "AI" },
  { key: "picks", label: "최종 추천", labelShort: "추천" },
];

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return true;
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
  const [activeTab, setActiveTab] = useState<TabKey>("market");

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-default)" }}
      >
        <div className="max-w-3xl mx-auto px-4">
          {/* Title row */}
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                AI 종목 브리핑 KR
              </span>
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: "var(--text-tertiary)" }}
              title={isDark ? "라이트 모드" : "다크 모드"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 text-center text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-400 text-blue-400"
                    : "border-transparent hover:border-[var(--border-hover)]"
                }`}
                style={activeTab === tab.key ? undefined : { color: "var(--text-tertiary)" }}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.labelShort}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-5">
        {activeTab === "market" && <MarketTab />}
        {activeTab === "ranking" && <RankingTab />}
        {activeTab === "ai" && <AITab />}
        {activeTab === "picks" && <PicksTab />}
      </main>

      {/* Footer */}
      <footer
        className="text-center text-xs py-3 border-t"
        style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
      >
        v18.2 · Slow In, Fast Out · 전략 v5.3
      </footer>
    </div>
  );
}

export default App;
