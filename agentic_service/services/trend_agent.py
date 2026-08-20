import json
import logging
from typing import Any, Dict
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from agentic_service.config import GEMINI_API_KEY, GEMINI_MODEL_NAME
from agentic_service.prompts import TREND_ANALYST_SYSTEM_PROMPT

logger = logging.getLogger("agentic_service")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

class TrendAgent:
    ALLOWED_LANGUAGES = ["sw", "en"]

    @classmethod
    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=2, max=10),
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
    def analyze_trend(cls, timeframe: str, metrics_data: Dict[str, Any], language: str = "sw") -> Dict[str, Any]:
        if not client:
            raise ValueError("GEMINI_API_KEY haijawekwa au haipatikani.")

        if not metrics_data:
            raise ValueError("metrics_data haiwezi kuwa tupu.")

        lang = language.lower() if language.lower() in cls.ALLOWED_LANGUAGES else "sw"

        try:
            formatted_data = json.dumps(metrics_data, default=str)
        except Exception as e:
            raise ValueError(f"Imeshindikana kubadilisha metrics_data kuwa JSON: {str(e)}")

        prompt = f"""
        Timeframe Analysis Target: {timeframe}
        Requested Language Output: {lang}
        Transaction & Fraud Metrics Summary:
        {formatted_data}
        
        Task: Evaluate the provided metric trends and return an executive-level risk summary formatted for the fraud dashboard.
        """

        config = types.GenerateContentConfig(
            system_instruction=TREND_ANALYST_SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.2,
            max_output_tokens=1500
        )

        try:
            response = cls._call_gemini_with_retry(prompt, config)
            analysis_result = json.loads(response.text)
        except Exception as e:
            logger.error(f"Error analyzing trends: {str(e)}")
            raise RuntimeError(f"Kosa limetokea wakati wa kuwasiliana na Gemini API: {str(e)}")

        return {
            "success": True,
            "timeframe": timeframe,
            "language": lang,
            "analysis": analysis_result
        }
