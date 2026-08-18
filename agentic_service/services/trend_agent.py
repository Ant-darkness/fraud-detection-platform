import json
from typing import Any, Dict
from google import genai
from google.genai import types

from agentic_service.config import GEMINI_API_KEY, GEMINI_MODEL_NAME
from agentic_service.prompts import TREND_ANALYST_SYSTEM_PROMPT

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


class TrendAgent:
    ALLOWED_LANGUAGES = ["sw", "en"]

    @classmethod
    def analyze_trend(cls, timeframe: str, metrics_data: Dict[str, Any], language: str = "sw") -> Dict[str, Any]:
        # 1. Guardrail Validation
        if not client:
            raise ValueError("GEMINI_API_KEY haijawekwa au haipatikani.")

        if not metrics_data:
            raise ValueError(
                "metrics_data haiwezi kuwa tupu (empty dictionary).")

        lang = language.lower() if language.lower() in cls.ALLOWED_LANGUAGES else "sw"

        # 2. Convert Data kwa Usalama (Handles Decimal, datetime, float64)
        try:
            formatted_data = json.dumps(metrics_data, default=str)
        except Exception as e:
            raise ValueError(
                f"Imeshindikana kubadilisha metrics_data kuwa JSON: {str(e)}")

        prompt = f"""
        Timeframe Analysis Target: {timeframe}
        Requested Language Output: {lang}
        Transaction & Fraud Metrics Summary:
        {formatted_data}
        
        Task: Evaluate the provided metric trends and return an executive-level risk summary formatted for the fraud dashboard.
        """

        # 3. Production Configuration
        config = types.GenerateContentConfig(
            system_instruction=TREND_ANALYST_SYSTEM_PROMPT,
            response_mime_type="application/json",
            # Inahakikisha uchambuzi unazingatia namba pekee (No Hallucinations)
            temperature=0.2,
            max_output_tokens=1500   # Limit inayofaa Dashboard UI Layout
        )

        # 4. API Call kwa Gemini
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL_NAME,
                contents=prompt,
                config=config
            )
        except Exception as e:
            raise RuntimeError(
                f"Kosa limetokea wakati wa kuwasiliana na Gemini API: {str(e)}")

        if not response or not response.text:
            raise ValueError(
                "Model haikurudisha majibu yoyote (huenda yamezuiwa na Safety Filters).")

        # 5. Parsing & Schema Safety Check
        try:
            analysis_result = json.loads(response.text)
        except json.JSONDecodeError:
            raise ValueError(
                f"Jibu kutoka kwa AI halikuwa kwenye muundo halali wa JSON: {response.text}")

        return {
            "success": True,
            "timeframe": timeframe,
            "language": lang,
            "analysis": analysis_result
        }
