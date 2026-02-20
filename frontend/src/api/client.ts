import type {
  RankingData,
  PicksResponse,
  DeathListResponse,
  MarketResponse,
  PipelineResponse,
  AIResponse,
  StockHistory,
  AllHistoryResponse,
} from "../types";

const API_BASE = "/api";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
  return res.json();
}

/**
 * Wrapper that catches errors and returns null instead of throwing.
 * Useful for optional endpoints (market, AI, pipeline) that may not be available.
 */
async function fetchOptional<T>(path: string): Promise<T | null> {
  try {
    return await fetchJson<T>(path);
  } catch {
    return null;
  }
}

export const api = {
  /* ── Dates ── */
  getDates: () => fetchJson<{ dates: string[] }>("/dates"),

  /* ── Rankings ── */
  getLatestRanking: () => fetchJson<RankingData>("/rankings/latest"),
  getRanking: (date: string) => fetchJson<RankingData>(`/rankings/${date}`),

  /* ── Picks / Death List ── */
  getPicks: () => fetchJson<PicksResponse>("/picks"),
  getDeathList: () => fetchJson<DeathListResponse>("/deathlist"),

  /* ── Market (optional - may not be implemented yet) ── */
  getMarket: () => fetchOptional<MarketResponse>("/market"),

  /* ── Pipeline (optional) ── */
  getPipeline: () => fetchOptional<PipelineResponse>("/pipeline"),

  /* ── AI (optional) ── */
  getAI: () => fetchOptional<AIResponse>("/ai"),

  /* ── History ── */
  getStockHistory: (ticker: string) =>
    fetchJson<{ ticker: string; history: StockHistory[] }>(`/history/${ticker}`),
  getAllHistory: () => fetchJson<AllHistoryResponse>("/history"),
};
