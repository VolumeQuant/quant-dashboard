import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AIResponse } from "../types";

export function AITab() {
  const [ai, setAI] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAI()
      .then(setAI)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4 animate-pulse"><div className="skeleton h-40 w-full" /></div>;

  if (!ai?.available) {
    return (
      <div className="space-y-4">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>🤖 AI 리스크 필터</p>
        <div className="card p-6 text-center">
          <p className="text-4xl mb-3">🤖</p>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            AI 분석 데이터 준비 중
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
            매일 오전 리밸런싱 시 자동 생성됩니다.
            <br />
            텔레그램 메시지 전송 후 웹 데이터가 업데이트됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>🤖 AI 리스크 필터</p>

      {/* Risk Filter Analysis */}
      {ai.risk_filter && (
        <div className="card p-4">
          <div
            className="text-sm leading-relaxed whitespace-pre-line"
            style={{ color: "var(--text-secondary)" }}
          >
            {formatRiskText(ai.risk_filter)}
          </div>
        </div>
      )}

      {/* Flagged Tickers */}
      {ai.flagged_tickers.length > 0 ? (
        <div className="card p-4">
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
            ⚠️ 매수 주의 종목 ({ai.flagged_tickers.length}개)
          </p>
          <div className="flex flex-wrap gap-2">
            {ai.flagged_tickers.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono font-bold"
                style={{
                  backgroundColor: "rgba(255, 71, 87, 0.1)",
                  color: "var(--negative)",
                  border: "1px solid rgba(255, 71, 87, 0.2)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-4 text-center">
          <p className="text-sm" style={{ color: "var(--positive)" }}>
            ✅ 위험 신호 없음
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            모든 후보 종목이 안전합니다
          </p>
        </div>
      )}

      {/* Picks AI Text */}
      {ai.picks_text && (
        <div className="card p-4">
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
            📝 AI 종목별 분석
          </p>
          <div
            className="text-sm leading-relaxed whitespace-pre-line"
            style={{ color: "var(--text-secondary)" }}
          >
            {ai.picks_text}
          </div>
        </div>
      )}
    </div>
  );
}

function formatRiskText(text: string): string {
  // Clean up any HTML tags that might be in the text
  return text
    .replace(/<\/?b>/g, "")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/─+/g, "")
    .trim();
}
