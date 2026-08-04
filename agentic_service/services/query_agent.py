import json
from google import genai
from google.genai import types
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from agentic_service.config import GEMINI_API_KEY, GEMINI_MODEL_NAME, DATABASE_URL
from agentic_service.prompts import FORENSIC_QUERY_SYSTEM_PROMPT

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
engine = create_engine(DATABASE_URL)


class QueryAgent:
    @classmethod
    def process_query(cls, user_prompt: str) -> dict:
        if not client:
            raise ValueError("GEMINI_API_KEY haijawekwa au haipatikani.")

        config = types.GenerateContentConfig(
            system_instruction=FORENSIC_QUERY_SYSTEM_PROMPT,
            response_mime_type="application/json"
        )

        response = client.models.generate_content(
            model=GEMINI_MODEL_NAME,
            contents=user_prompt,
            config=config
        )

        # 1. Hakikisha kuna response text
        if not response or not response.text:
            raise ValueError("Model haikurudisha majibu yoyote (yanaweza kuwa yameharibiwa au kuzuiwa).")

        # 2. Jaribu ku-parse JSON
        try:
            ai_data = json.loads(response.text)
        except json.JSONDecodeError:
            raise ValueError(f"Jibu la AI halipo kwenye muundo sahihi wa JSON. Raw text: {response.text}")

        sql = ai_data.get("sql_query", "").strip()

        if not sql:
            raise ValueError("AI haikuzalisha SQL query yoyote.")

        # 3. Uhakiki wa SQL (Kama kuna kosa, tunarudisha pamoja na SQL kwenye Swagger)
        cleaned_sql = sql.upper().strip()
        
        # Zuia semicolons nyingi kuzuia multi-statement execution
        if cleaned_sql.count(";") > 1 or (cleaned_sql.count(";") == 1 and not cleaned_sql.endswith(";")):
            raise ValueError(f"Query ina vyombo vingi vya SQL (Multiple statements). [SQL: {sql}]")

        # Hakikisha query haina maneno yanayobadilisha au kufuta data
        forbidden_keywords = ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "TRUNCATE", "CREATE", "GRANT"]
        if any(keyword in cleaned_sql for keyword in forbidden_keywords):
            raise ValueError(f"Query ina maneno yasiyoruhusiwa. Ruhusa ni ya kusoma tu (SELECT). [SQL: {sql}]")

        # 4. Tekeleza SQL kwa usalama na catch makosa ya Database
        try:
            items = []
            with engine.connect() as conn:
                result = conn.execute(text(sql))
                items = [dict(row._mapping) for row in result]
        except SQLAlchemyError as e:
            # Hapa tutarudisha PostgreSQL Error PAMOJA na SQL yenyewe kwenye Swagger
            raise RuntimeError(f"Kosa kwenye DB: {str(e)} | [SQL Generated: {sql}]")

        return {
            "success": True,
            "display_mode": ai_data.get("display_mode", "table"),
            "explanation": ai_data.get("explanation", ""),
            "generated_sql": sql,
            "total_found": len(items),
            "items": items
        }
