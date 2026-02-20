"""
퀀트 대시보드 API 서버 v2.0
- quant_py-main의 ranking JSON / web_data JSON / credit_monitor를 읽어서 REST API로 제공
- 시장 지표, 파이프라인, AI 분석 엔드포인트 추가
"""
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from data_loader import (
    get_available_dates,
    load_ranking,
    load_latest_ranking,
    compute_picks,
    compute_death_list,
    get_ranking_history,
    get_all_history,
    # v2.0 추가
    get_market_data,
    compute_pipeline_status,
    get_ai_data,
)

app = FastAPI(title="Quant Dashboard API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Cache-Control 미들웨어
# ============================================================

# 정적(변동 적은) 데이터: 1시간 캐시
STATIC_PATHS = {"/api/market", "/api/ai", "/api/pipeline"}
# 동적 데이터: 5분 캐시
DYNAMIC_PATHS = {"/api/picks", "/api/deathlist", "/api/rankings/latest"}


@app.middleware("http")
async def add_cache_headers(request: Request, call_next):
    response: Response = await call_next(request)
    path = request.url.path

    if path in STATIC_PATHS:
        response.headers["Cache-Control"] = "public, max-age=3600"
    elif path in DYNAMIC_PATHS or path.startswith("/api/rankings/"):
        response.headers["Cache-Control"] = "public, max-age=300"
    elif path.startswith("/api/history"):
        response.headers["Cache-Control"] = "public, max-age=1800"

    return response


# ============================================================
# 기존 엔드포인트 (유지)
# ============================================================

@app.get("/api/dates")
def api_dates():
    """사용 가능한 날짜 목록"""
    return {"dates": get_available_dates()}


@app.get("/api/rankings/latest")
def api_latest_ranking():
    """최신 순위"""
    data = load_latest_ranking()
    if not data:
        raise HTTPException(404, "순위 데이터 없음")
    return data


@app.get("/api/rankings/{date}")
def api_ranking_by_date(date: str):
    """특정 날짜 순위"""
    data = load_ranking(date)
    if not data:
        raise HTTPException(404, f"{date} 데이터 없음")
    return data


@app.get("/api/picks")
def api_picks():
    """3일 교집합 최종 추천 — Enhanced with factor_grades, roe, fwd_per, weight, buy_rationale"""
    return compute_picks()


@app.get("/api/deathlist")
def api_death_list():
    """Death List (이탈 종목) — Enhanced with exit_reason tags"""
    return compute_death_list()


@app.get("/api/history/{ticker}")
def api_stock_history(ticker: str):
    """특정 종목의 순위 히스토리"""
    history = get_ranking_history(ticker)
    if not history:
        raise HTTPException(404, f"{ticker} 히스토리 없음")
    return {"ticker": ticker, "history": history}


@app.get("/api/history")
def api_all_history():
    """전체 Top 30 종목 순위 히스토리"""
    return get_all_history()


# ============================================================
# 새 엔드포인트 (v2.0)
# ============================================================

@app.get("/api/market")
def api_market():
    """
    시장 지표 — 인덱스(KOSPI/KOSDAQ) + 신용시장(HY/KR/VIX) + 행동 등급

    Response:
    {
        "indices": {"kospi": {...}, "kosdaq": {...}},
        "credit": {"hy": {...}, "kr": {...}, "vix": {...}, "concordance": "...", "action": {...}},
        "warnings": [...],
        "date": "20260219"
    }
    """
    try:
        return get_market_data()
    except Exception as e:
        raise HTTPException(500, f"시장 데이터 로드 실패: {str(e)}")


@app.get("/api/pipeline")
def api_pipeline():
    """
    파이프라인 상태 — Top 30 종목의 연속 진입 상태

    Response:
    {
        "verified": [...],   # 3일 연속 (매수 대상)
        "pending": [...],    # 2일 연속 (관찰)
        "new_entry": [...],  # 신규 진입
        "sectors": {"반도체": 5, ...}
    }
    """
    try:
        return compute_pipeline_status()
    except Exception as e:
        raise HTTPException(500, f"파이프라인 데이터 로드 실패: {str(e)}")


@app.get("/api/ai")
def api_ai():
    """
    AI 분석 결과 (캐시)

    Response:
    {
        "available": true/false,
        "risk_filter": "...",
        "picks_text": "...",
        "flagged_tickers": [...]
    }
    """
    try:
        return get_ai_data()
    except Exception as e:
        raise HTTPException(500, f"AI 데이터 로드 실패: {str(e)}")


# ============================================================
# Health check
# ============================================================

@app.get("/api/health")
def api_health():
    """서버 상태 확인"""
    dates = get_available_dates()
    cache_available = False
    try:
        from data_loader import load_web_cache
        cache_available = load_web_cache() is not None
    except Exception:
        pass

    return {
        "status": "ok",
        "version": "2.0.0",
        "ranking_dates": len(dates),
        "latest_date": dates[0] if dates else None,
        "web_cache_available": cache_available,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
