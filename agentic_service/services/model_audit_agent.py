import json
from typing import Any, Dict
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from google import genai
from google.genai import types

from agentic_service.config import GEMINI_API_KEY, GEMINI_MODEL_NAME, DATABASE_URL
from agentic_service.prompts import MODEL_AUDIT_SYSTEM_PROMPT

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Database Connection Pool kwa ajili ya Production Writes
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Inazuia staled connections
    pool_size=5,             # Limit ya kutosha kwa ajili ya auditing writes
    max_overflow=10,
    connect_args={"connect_timeout": 5}
)


class ModelAuditAgent:
    @classmethod
    def audit_and_save_model(cls, model_id: int, metrics: Dict[str, Any]) -> Dict[str, Any]:
        if not client:
            raise ValueError("GEMINI_API_KEY haijawekwa au haipatikani.")

        if not model_id or not isinstance(model_id, int):
            raise ValueError("Model ID lazima iwe namba kamili (integer).")

        # 1. Tumia default=str kuzuia TypeError kama metrics ina float64, numpy types, au datetimes
        try:
            formatted_metrics = json.dumps(metrics, default=str)
        except Exception as e:
            raise ValueError(f"Imeshindikana kubadilisha metrics kuwa JSON: {str(e)}")

        prompt = f"Model ID: {model_id}. Metrics: {formatted_metrics}. Generate concise 50-100 word technical description."

        # 2. Config yenye Strict Output Control na Low Temperature
        config = types.GenerateContentConfig(
            system_instruction=MODEL_AUDIT_SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.1,        # Inazuia AI kubuni vitu visivyopo kwenye metrics
            max_output_tokens=300   # Inahakikisha maelezo hayazidi maneno 100
        )

        # 3. Tuma ombi kwa Gemini API
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL_NAME,
                contents=prompt,
                config=config
            )
        except Exception as e:
            raise RuntimeError(f"Kosa limetokea wakati wa kuwasiliana na Gemini API: {str(e)}")

        if not response or not response.text:
            raise ValueError("Model haikurudisha majibu yoyote (huenda yamezuiwa na Safety Filters).")

        # 4. Handle JSON Parsing
        try:
            audit_res = json.loads(response.text)
        except json.JSONDecodeError:
            raise ValueError(f"Jibu kutoka kwa AI halikuwa kwenye muundo halali wa JSON: {response.text}")

        description_text = audit_res.get("technical_description", "").strip()
        recommendation_text = audit_res.get("deployment_recommendation", "PENDING").strip()

        if not description_text:
            raise ValueError("AI haikutoa maelezo ya technical_description.")

        # 5. Kuhifadhi kwenye model_registry (column: model_description)
        update_query = text("""
            UPDATE model_registry 
            SET model_description = :desc
            WHERE model_id = :m_id
        """)

        try:
            # engine.begin() inafanya automatic COMMIT ikimaliza na ROLLBACK kukiwa na error
            with engine.begin() as conn:
                result = conn.execute(update_query, {
                    "desc": description_text,
                    "m_id": model_id
                })

                if result.rowcount == 0:
                    raise ValueError(f"Model yenye ID {model_id} haikupatikana kwenye database (UPDATE failed).")

        except SQLAlchemyError as e:
            error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
            raise RuntimeError(f"Kosa limetokea wakati wa kuhifadhi audit kwenye Database: {error_msg}")

        return {
            "success": True,
            "model_id": model_id,
            "saved_description": description_text,
            "recommendation": recommendation_text
        }
