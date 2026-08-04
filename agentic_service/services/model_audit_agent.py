import json
from google import genai
from google.genai import types
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from agentic_service.config import GEMINI_API_KEY, GEMINI_MODEL_NAME, DATABASE_URL
from agentic_service.prompts import MODEL_AUDIT_SYSTEM_PROMPT

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
engine = create_engine(DATABASE_URL)


class ModelAuditAgent:
    @classmethod
    def audit_and_save_model(cls, model_id: int, metrics: dict) -> dict:
        if not client:
            raise ValueError("GEMINI_API_KEY haijawekwa au haipatikani.")

        # 1. Tumia default=str kuzuia TypeError kama metrics ina float64, Decimal, au datetime
        try:
            formatted_metrics = json.dumps(metrics, default=str)
        except Exception as e:
            raise ValueError(f"Imeshindikana kubadilisha metrics kuwa JSON: {str(e)}")

        prompt = f"Model ID: {model_id}. Metrics: {formatted_metrics}. Generate detailed description and recommendation."

        config = types.GenerateContentConfig(
            system_instruction=MODEL_AUDIT_SYSTEM_PROMPT,
            response_mime_type="application/json"
        )

        # 2. Tuma ombi kwa Gemini API na shika makosa ya API
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL_NAME,
                contents=prompt,
                config=config
            )
        except Exception as e:
            raise RuntimeError(f"Kosa limetokea wakati wa kuwasiliana na Gemini API: {str(e)}")

        # 3. Hakikisha kuwa response.text ipo
        if not response or not response.text:
            raise ValueError("Model haikurudisha majibu yoyote (huenda yamezuiwa na Safety Filters).")

        # 4. Handle JSON Parsing kwa usalama
        try:
            audit_res = json.loads(response.text)
        except json.JSONDecodeError:
            raise ValueError(f"Jibu kutoka kwa AI halikuwa kwenye muundo halali wa JSON: {response.text}")

        description_text = audit_res.get("technical_description", "")
        recommendation_text = audit_res.get("deployment_recommendation", "PENDING")

        # 5. Kuhifadhi kwenye Database kwa usalama (Transaction Handling)
        update_query = text("""
            UPDATE model_registry 
            SET agent_description = :desc,
                recommendation = :rec,
                updated_at = NOW()
            WHERE model_id = :m_id
        """)

        try:
            with engine.begin() as conn:
                result = conn.execute(update_query, {
                    "desc": description_text,
                    "rec": recommendation_text,
                    "m_id": model_id
                })
                
                # Hiari: Angalia kama model_id kweli ilipatikana na ku-update-wa
                if result.rowcount == 0:
                    raise ValueError(f"Model yenye ID {model_id} haikupatikana kwenye database.")
                    
        except SQLAlchemyError as e:
            raise RuntimeError(f"Kosa limetokea wakati wa kuhifadhi audit kwenye Database: {str(e)}")

        return {
            "success": True,
            "model_id": model_id,
            "saved_description": description_text,
            "saved_recommendation": recommendation_text,
            "audit_details": audit_res
        }
