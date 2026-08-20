import json
import logging
import re
from typing import Dict, Any

from sqlalchemy import create_engine, text
from google import genai
from google.genai import types
from google.genai.errors import APIError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)

from agentic_service.config import GEMINI_API_KEY, GEMINI_MODEL_NAME, DATABASE_URL
from agentic_service.prompts import FRAUD_ANALYST_SYSTEM_PROMPT

logger = logging.getLogger("agentic_service")

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5)


def safe_parse_json(text_content: str) -> dict:
    """
    Inasafisha na ku-parse JSON kutoka kwa Gemini bila kuruhusu 
    Unterminated string au Markdown code blocks kuzuia JSONDecodeError.
    """
    if not text_content:
        raise ValueError("Gemini ilirudisha jibu tupu (empty response).")

    # 1. Ondoa Markdown code blocks kama zipo (```json ... ```)
    cleaned = re.sub(r"^```(?:json)?\s*", "", text_content.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()

    # 2. Jaribu ku-parse moja kwa moja
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback 1: Extract block yoyote ya JSON {}
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        
        # Fallback 2: Kama JSON imekatika kwa token limit, funga maswali/mabano
        try:
            patched = cleaned
            if not patched.endswith("}"):
                patched += '"}'
            return json.loads(patched)
        except Exception:
            raise json.JSONDecodeError(
                f"Imeshindwa ku-parse JSON iliyosafishwa: {cleaned[:100]}...",
                cleaned,
                0
            )


class FraudMetricsAgent:

    TIMEFRAME_MAP = {
        "24HRS": "INTERVAL '24 hours'",
        "7DAYS": "INTERVAL '7 days'",
        "4WEEKS": "INTERVAL '28 days'",
        "1YEAR": "INTERVAL '1 year'"
    }

    @classmethod
    def _fetch_fraud_metrics(cls, timeframe: str) -> list:
        interval = cls.TIMEFRAME_MAP.get(timeframe.upper(), "INTERVAL '7 days'")
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
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=3, max=15),
        retry=retry_if_exception_type(Exception),
        reraise=True
    )
    def _call_gemini_with_retry(cls, prompt: str, config: types.GenerateContentConfig):
        return client.models.generate_content(
            model=GEMINI_MODEL_NAME,
            contents=prompt,
            config=config
        )

    @classmethod
    def analyze_fraud(cls, timeframe: str = "7DAYS", language: str = "sw") -> Dict[str, Any]:
        if not client:
            raise ValueError("GEMINI_API_KEY haijawekwa.")

        chart_data = cls._fetch_fraud_metrics(timeframe)

        prompt = f"""
        Timeframe: {timeframe}
        Output Language: {language}
        Fraud Metrics Data: {json.dumps(chart_data, default=str)}

        Analyze Fraud vs Non-Fraud ratios and write a forensic risk assessment with operational advice.
        Return ONLY valid JSON matching your schema without trailing markdown.
        """

        config = types.GenerateContentConfig(
            system_instruction=FRAUD_ANALYST_SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.1,
            max_output_tokens=2048  # Kuongeza nafasi ili kuzuia Unterminated JSON
        )

        try:
            response = cls._call_gemini_with_retry(prompt, config)
            ai_analysis = safe_parse_json(response.text)

        except APIError as api_err:
            logger.error(f"[GEMINI API ERROR]: {str(api_err)}")
            # Fallback ya kiutendaji ikiwa Rate Limit (429) imefikiwa badala ya kurusha Error 500
            if "429" in str(api_err) or "RESOURCE_EXHAUSTED" in str(api_err):
                ai_analysis = {
                    "summary": "Mfumo umefikia kikomo cha maombi kwa muda (Rate Limit). Uchambuzi wa papo hapo utajirejesha mara moja.",
                    "risk_level": "UNKNOWN",
                    "status": "rate_limited",
                    "actionable_insight": "Tafadhali subiri sekunde 30 kabla ya kuboresha au kuomba uchambuzi mwingine."
                }
            else:
                ai_analysis = {
                    "summary": f"Kosa la kitaalamu wakati wa mawasiliano na Gemini API: {str(api_err)}",
                    "risk_level": "ERROR",
                    "status": "failed"
                }

        except Exception as e:
            logger.error(f"Error generating fraud analytics: {str(e)}")
            ai_analysis = {
                "summary": "Imeshindwa kutengeneza uchambuzi wa ki-AI kwa sasa kutokana na kosa la uumbaji wa taarifa.",
                "risk_level": "UNDETERMINED",
                "error": str(e)
            }

        return {
            "success": True,
            "metric_type": "fraud",
            "timeframe": timeframe,
            "chart_data": chart_data,
            "ai_comments": ai_analysis
        }
