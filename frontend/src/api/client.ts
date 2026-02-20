const API_BASE = "/api";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getDates: () => fetchJson<{ dates: string[] }>("/dates"),
  getLatestRanking: () => fetchJson<import("../types").RankingData>("/rankings/latest"),
  getRanking: (date: string) => fetchJson<import("../types").RankingData>(`/rankings/${date}`),
  getPicks: () => fetchJson<import("../types").PicksResponse>("/picks"),
  getDeathList: () => fetchJson<import("../types").DeathListResponse>("/deathlist"),
  getStockHistory: (ticker: string) => fetchJson<{ ticker: string; history: import("../types").StockHistory[] }>(`/history/${ticker}`),
  getAllHistory: () => fetchJson<import("../types").AllHistoryResponse>("/history"),
};
