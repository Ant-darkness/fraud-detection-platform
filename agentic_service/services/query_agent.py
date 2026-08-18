import json
import re
from typing import Any, Dict
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from google import genai
from google.genai import types

from agentic_service.config import GEMINI_API_KEY, GEMINI_MODEL_NAME, DATABASE_URL
from agentic_service.prompts import FORENSIC_QUERY_SYSTEM_PROMPT

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Database Connection Pool yenye Strict Timeouts kwa Bank
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args={"connect_timeout": 5}  # Fail fast ikichelewa sekunde 5
)


class QueryAgent:
    FORBIDDEN_KEYWORDS = [
        "DROP", "DELETE", "INSERT", "UPDATE", "ALTER",
        "TRUNCATE", "CREATE", "GRANT", "REVOKE", "EXEC",
        "EXECUTE", "VACUUM", "COPY", "SET", "INFORMATION_SCHEMA", "PG_TABLES"
    ]

    MAX_PROMPT_LENGTH = 1000  # Character Limit kuzuia Prompt Injection

    DOMAIN_ALLOWED_TABLES = {
        "fraud": ["transactions", "fraud_predictions", "fraud_review_queue", "officers"],
        "volume": ["transactions"],
        "business": ["transactions", "fraud_predictions", "fraud_review_queue", "officers", "model_registry", "metric_registry"]
    }

    @classmethod
    def _validate_sql(cls, sql: str) -> None:
        cleaned_sql = sql.strip()
        sql_upper = cleaned_sql.upper()

        if not (sql_upper.startswith("SELECT") or sql_upper.startswith("WITH")):
            raise ValueError(
                "Ruhusa ni ya kusoma tu. Query lazima ianzie na SELECT au WITH.")

        if sql_upper.count(";") > 1 or (sql_upper.count(";") == 1 and not sql_upper.endswith(";")):
            raise ValueError(f"Query ina amri nyingi za SQL. [SQL: {sql}]")

        for keyword in cls.FORBIDDEN_KEYWORDS:
            pattern = rf"\b{keyword}\b"
            if re.search(pattern, sql_upper):
                raise ValueError(
                    f"Query ina neno lililopigwa marufuku ({keyword}). [SQL: {sql}]"
                )

    @classmethod
    def process_query(cls, user_prompt: str, context: str = "business") -> Dict[str, Any]:
        if not client:
            raise ValueError("GEMINI_API_KEY haijawekwa au haipatikani.")

        # 1. Scope Context Validation
        domain = context.lower().strip() if context else "business"
        if domain not in cls.DOMAIN_ALLOWED_TABLES:
            domain = "business"  # Fallback

        allowed_tables = cls.DOMAIN_ALLOWED_TABLES[domain]

        # 2. Guardrail: Input Length Check
        if len(user_prompt) > cls.MAX_PROMPT_LENGTH:
            raise ValueError(
                f"Swali ni refu sana. Isizidi herufi {cls.MAX_PROMPT_LENGTH}.")

        # 3. Inject Context dynamically into User Prompt
        scoped_prompt = f"""
        ACTIVE DOMAIN CONTEXT: {domain.upper()}
        PERMITTED TABLES FOR THIS REQUEST: {json.dumps(allowed_tables)}

        USER QUESTION: {user_prompt}
        """

        # 4. Config yenye strict Token Limits na Zero Temperature
        config = types.GenerateContentConfig(
            system_instruction=FORENSIC_QUERY_SYSTEM_PROMPT,
            response_mime_type="application/json",
            # Zero determinism (Hakuna hallucination kwenye SQL)
            temperature=0.0,
            max_output_tokens=1000
        )

        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL_NAME,
                contents=scoped_prompt,
                config=config
            )
        except Exception as e:
            raise RuntimeError(
                f"Kosa wakati wa mawasiliano na Gemini API: {str(e)}")

        if not response or not response.text:
            raise ValueError("Model haikurudisha majibu yoyote.")

        try:
            ai_data = json.loads(response.text)
        except json.JSONDecodeError:
            raise ValueError(f"Jibu la AI si JSON halali: {response.text}")

        sql = ai_data.get("sql_query", "").strip()

        if not sql:
            raise ValueError("AI haikuzalisha SQL query yoyote.")

        # 5. Uhakiki wa SQL
        cls._validate_sql(sql)

        # 6. DB Execution yenye Read-Only Guard & Statement Timeout
        try:
            with engine.connect().execution_options(
                read_only=True,
                options="-c statement_timeout=10000"  # Kill queries over 10 sec
            ) as conn:
                result = conn.execute(text(sql))
                items = [dict(row._mapping) for row in result]

        except SQLAlchemyError as e:
            error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
            raise RuntimeError(
                f"Kosa kwenye DB: {error_msg} | [SQL Generated: {sql}]")

        return {
            "success": True,
            "domain_context": domain,
            "display_mode": ai_data.get("display_mode", "table"),
            "explanation": ai_data.get("explanation", ""),
            "generated_sql": sql,
            "total_found": len(items),
            "items": items
        }
