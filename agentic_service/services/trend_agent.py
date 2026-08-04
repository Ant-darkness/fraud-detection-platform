import json
from google import genai
from google.genai import types
from agentic_service.config import GEMINI_API_KEY, GEMINI_MODEL_NAME
from agentic_service.prompts import TREND_ANALYST_SYSTEM_PROMPT

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


class TrendAgent:
    @classmethod
    def analyze_trend(cls, timeframe: str, metrics_data: dict, language: str = "sw") -> dict:
        if not client:
            raise ValueError("GEMINI_API_KEY haijawekwa au haipatikani.")

        # 1. Tumia default=str ili kuzuia TypeError kama metrics_data ina datetime/Decimal
        try:
            formatted_data = json.dumps(metrics_data, default=str)
        except Exception as e:
            raise ValueError(f"Imeshindikana kubadilisha metrics_data kuwa JSON: {str(e)}")

        prompt = f"""
        Timeframe: {timeframe}
        Language: {language}
        Data Summary: {formatted_data}
        Please evaluate this transaction metrics data and write an executive summary for the dashboard.
        """

        config = types.GenerateContentConfig(
            system_instruction=TREND_ANALYST_SYSTEM_PROMPT,
            response_mime_type="application/json"
        )

        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL_NAME,
                contents=prompt,
                config=config
            )
        except Exception as e:
            raise RuntimeError(f"Kosa limetokea wakati wa kuwasiliana na Gemini API: {str(e)}")

        # 2. Hakikisha kuwa response.text ipo
        if not response or not response.text:
            raise ValueError("Model haikurudisha majibu yoyote (huenda yamezuiwa na Safety Filters).")

        # 3. Handle JSON Parsing kwa usalama
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            raise ValueError(f"Jibu kutoka kwa AI halikuwa kwenye muundo halali wa JSON: {response.text}")
