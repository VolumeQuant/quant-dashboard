import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AIResponse } from "../types";
import { Bot, ShieldCheck, AlertTriangle } from "lucide-react";

export function AITab() {
  const [ai, setAI] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAI()
      .then(setAI)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4 animate-pulse"><div className="skeleton h-48 w-full" /></div>;

  if (!ai?.available) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-emerald-500 rounded-full" />
          <h3 className="text-sm font-semibold text-slate-100">AI 리스크 필터</h3>
        </div>
        <div className="card p-8 text-center">
          <Bot className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">AI 분석 데이터 준비 중</p>
          <p className="text-xs text-slate-500 mt-2">
            매일 오전 리밸런싱 시 자동 생성됩니다.
            <br />
            텔레그램 메시지 전송 후 웹 데이터가 업데이트됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-emerald-500 rounded-full" />
          <h3 className="text-sm font-semibold text-slate-100">AI 리스크 필터</h3>
        </div>
        {ai.flagged_tickers.length > 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold tracking-wider text-amber-400">
              {ai.flagged_tickers.length}개 주의
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-bold tracking-wider text-emerald-400">
              안전
            </span>
          </div>
        )}
      </div>

      {/* Risk filter text */}
      {ai.risk_filter && (
        <div className="card p-5">
          <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
            {cleanText(ai.risk_filter)}
          </div>
        </div>
      )}

      {/* Flagged tickers */}
      {ai.flagged_tickers.length > 0 && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            ⚠️ 매수 주의 종목
          </p>
          <div className="flex flex-wrap gap-2">
            {ai.flagged_tickers.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {ai.flagged_tickers.length === 0 && (
        <div className="card p-5 text-center">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-emerald-400">위험 신호 없음</p>
          <p className="text-xs text-slate-500 mt-1">모든 후보 종목이 안전합니다</p>
        </div>
      )}

      {/* Picks AI text */}
      {ai.picks_text && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            📝 종목별 AI 분석
          </p>
          <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
            {cleanText(ai.picks_text)}
          </div>
        </div>
      )}
    </div>
  );
}

function cleanText(text: string): string {
  return text.replace(/<\/?b>/g, "").replace(/<br\s*\/?>/g, "\n").replace(/─+/g, "").trim();
}
