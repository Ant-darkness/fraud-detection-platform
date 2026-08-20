import json
import logging
from typing import Any, Dict
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from agentic_service.config import GEMINI_API_KEY, GEMINI_MODEL_NAME, DATABASE_URL
from agentic_service.prompts import MODEL_AUDIT_SYSTEM_PROMPT

logger = logging.getLogger("agentic_service")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={"connect_timeout": 5}
)

class ModelAuditAgent:

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
    def audit_and_save_model(cls, model_id: int, metrics: Dict[str, Any]) -> Dict[str, Any]:
        if not client:
            raise ValueError("GEMINI_API_KEY haijawekwa au haipatikani.")

        if not model_id or not isinstance(model_id, int):
            raise ValueError("Model ID lazima iwe namba kamili (integer).")

        try:
            formatted_metrics = json.dumps(metrics, default=str)
        except Exception as e:
            raise ValueError(f"Imeshindikana kubadilisha metrics kuwa JSON: {str(e)}")

        prompt = f"Model ID: {model_id}. Metrics: {formatted_metrics}. Generate concise 50-100 word technical description."

        config = types.GenerateContentConfig(
            system_instruction=MODEL_AUDIT_SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.1,
            max_output_tokens=300
        )

        try:
            response = cls._call_gemini_with_retry(prompt, config)
            audit_res = json.loads(response.text)
        except Exception as e:
            logger.error(f"Model audit generation failed: {str(e)}")
            raise RuntimeError(f"Kosa limetokea wakati wa kuwasiliana na Gemini API: {str(e)}")

        description_text = audit_res.get("technical_description", "").strip()
        recommendation_text = audit_res.get("deployment_recommendation", "PENDING").strip()

        if not description_text:
            raise ValueError("AI haikutoa maelezo ya technical_description.")

        update_query = text("""
            UPDATE model_registry 
            SET model_description = :desc
            WHERE model_id = :m_id
        """)

        try:
            with engine.begin() as conn:
                result = conn.execute(update_query, {
                    "desc": description_text,
                    "m_id": model_id
                })
                if result.rowcount == 0:
                    raise ValueError(f"Model yenye ID {model_id} haikupatikana kwenye database.")
        except SQLAlchemyError as e:
            error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
            raise RuntimeError(f"Kosa limetokea wakati wa kuhifadhi audit kwenye Database: {error_msg}")

        return {
            "success": True,
            "model_id": model_id,
            "saved_description": description_text,
            "recommendation": recommendation_text
        }
