"""
퀀트 대시보드 API 서버
- quant_py-main의 ranking JSON / portfolio CSV를 읽어서 REST API로 제공
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from data_loader import (
    get_available_dates,
    load_ranking,
    load_latest_ranking,
    compute_picks,
    compute_death_list,
    get_ranking_history,
    get_all_history,
)

app = FastAPI(title="Quant Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    """3일 교집합 최종 추천"""
    return compute_picks()


@app.get("/api/deathlist")
def api_death_list():
    """Death List (이탈 종목)"""
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
