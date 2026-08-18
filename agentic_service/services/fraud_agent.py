import json
from typing import Dict, Any
from sqlalchemy import create_engine, text
from google import genai
from google.genai import types

from agentic_service.config import GEMINI_API_KEY, GEMINI_MODEL_NAME, DATABASE_URL
from agentic_service.prompts import FRAUD_ANALYST_SYSTEM_PROMPT

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5)


class FraudMetricsAgent:
    TIMEFRAME_MAP = {
        "24HRS": "INTERVAL '24 hours'",
        "7DAYS": "INTERVAL '7 days'",
        "4WEEKS": "INTERVAL '28 days'",
        "1YEAR": "INTERVAL '1 year'"
    }

    @classmethod
    def _fetch_fraud_metrics(cls, timeframe: str) -> list:
        interval = cls.TIMEFRAME_MAP.get(
            timeframe.upper(), "INTERVAL '7 days'")
        query = text(f"""
            SELECT 
                DATE_TRUNC('hour', t.created_at) AS period,
                COUNT(CASE WHEN frq.final_label = TRUE OR fp.prediction = TRUE THEN 1 END) AS fraud_cases,
                COUNT(CASE WHEN (frq.final_label = FALSE OR frq.final_label IS NULL) AND fp.prediction = FALSE THEN 1 END) AS non_fraud_cases
            FROM transactions t
            LEFT JOIN fraud_review_queue frq ON t.transaction_id = frq.transaction_id
            LEFT JOIN fraud_predictions fp ON t.transaction_id = fp.transaction_id
            WHERE t.created_at >= NOW() - {interval}
            GROUP BY period
            ORDER BY period ASC;
        """)
        with engine.connect().execution_options(read_only=True) as conn:
            result = conn.execute(query)
            return [dict(row._mapping) for row in result]

    @classmethod
    def analyze_fraud(cls, timeframe: str = "7DAYS", language: str = "sw") -> Dict[str, Any]:
        if not client:
            raise ValueError("GEMINI_API_KEY haijawekwa.")

        # 1. Fetch real-time fraud data directly from DB
        chart_data = cls._fetch_fraud_metrics(timeframe)

        prompt = f"""
        Timeframe: {timeframe}
        Output Language: {language}
        Fraud Metrics: {json.dumps(chart_data, default=str)}
        
        Analyze Fraud vs Non-Fraud ratios and write a forensic risk assessment with operational advice.
        """

        config = types.GenerateContentConfig(
            system_instruction=FRAUD_ANALYST_SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.1,
            max_output_tokens=1000
        )

        # 2. Generate AI Risk Comments
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL_NAME, contents=prompt, config=config
            )
            ai_analysis = json.loads(response.text)
        except Exception as e:
            raise RuntimeError(
                f"Kosa wakati wa kuchakata Fraud Analytics: {str(e)}")

        # 3. Return Dual-Payload
        return {
            "success": True,
            "metric_type": "fraud",
            "timeframe": timeframe,
            "chart_data": chart_data,      # Real-time Graph Data
            "ai_comments": ai_analysis      # Dynamic Risk Assessment Comments
        }
