import json
from typing import Dict, Any
from sqlalchemy import create_engine, text
from google import genai
from google.genai import types

from agentic_service.config import GEMINI_API_KEY, GEMINI_MODEL_NAME, DATABASE_URL
from agentic_service.prompts import VOLUME_ANALYST_SYSTEM_PROMPT

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5)


class VolumeMetricsAgent:
    TIMEFRAME_MAP = {
        "24HRS": "INTERVAL '24 hours'",
        "7DAYS": "INTERVAL '7 days'",
        "4WEEKS": "INTERVAL '28 days'",
        "1YEAR": "INTERVAL '1 year'"
    }

    @classmethod
    def _fetch_volume_metrics(cls, timeframe: str) -> list:
        interval = cls.TIMEFRAME_MAP.get(
            timeframe.upper(), "INTERVAL '7 days'")
        query = text(f"""
            SELECT 
                DATE_TRUNC('hour', created_at) AS period,
                COUNT(transaction_id) AS total_volume,
                COALESCE(SUM(amount), 0) AS total_amount,
                COALESCE(AVG(amount), 0) AS avg_amount
            FROM transactions
            WHERE created_at >= NOW() - {interval}
            GROUP BY period
            ORDER BY period ASC;
        """)
        with engine.connect().execution_options(read_only=True) as conn:
            result = conn.execute(query)
            return [dict(row._mapping) for row in result]

    @classmethod
    def analyze_volume(cls, timeframe: str = "7DAYS", language: str = "sw") -> Dict[str, Any]:
        if not client:
            raise ValueError("GEMINI_API_KEY haijawekwa.")

        # 1. Fetch real-time chart data directly from DB
        chart_data = cls._fetch_volume_metrics(timeframe)

        prompt = f"""
        Timeframe: {timeframe}
        Output Language: {language}
        Data Metrics: {json.dumps(chart_data, default=str)}
        
        Evaluate these transaction volume trends and generate business comments and liquidity insights.
        """

        config = types.GenerateContentConfig(
            system_instruction=VOLUME_ANALYST_SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.2,
            max_output_tokens=1000
        )

        # 2. Generate AI Comments
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL_NAME, contents=prompt, config=config
            )
            ai_analysis = json.loads(response.text)
        except Exception as e:
            raise RuntimeError(
                f"Kosa wakati wa kuchakata Volume Analytics: {str(e)}")

        # 3. Return Dual-Payload
        return {
            "success": True,
            "metric_type": "volume",
            "timeframe": timeframe,
            "chart_data": chart_data,      # Inatumika kuchora real-time graph
            "ai_comments": ai_analysis      # Dynamic Executive Comments
        }
