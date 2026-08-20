import json
import logging
import re
from typing import Any, Dict

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
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
from agentic_service.prompts import FORENSIC_QUERY_SYSTEM_PROMPT

logger = logging.getLogger("agentic_service")

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args={"connect_timeout": 5}
)


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


class QueryAgent:

    FORBIDDEN_KEYWORDS = [
        "DROP", "DELETE", "INSERT", "UPDATE", "ALTER",
        "TRUNCATE", "CREATE", "GRANT", "REVOKE", "EXEC",
        "EXECUTE", "VACUUM", "COPY", "SET", "INFORMATION_SCHEMA", "PG_TABLES"
    ]

    MAX_PROMPT_LENGTH = 1000

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
            raise ValueError("Ruhusa ni ya kusoma tu. Query lazima ianzie na SELECT au WITH.")

        if sql_upper.count(";") > 1 or (sql_upper.count(";") == 1 and not sql_upper.endswith(";")):
            raise ValueError(f"Query ina amri nyingi za SQL. [SQL: {sql}]")

        for keyword in cls.FORBIDDEN_KEYWORDS:
            pattern = rf"\b{keyword}\b"
            if re.search(pattern, sql_upper):
                raise ValueError(f"Query ina neno lililopigwa marufuku ({keyword}). [SQL: {sql}]")

    @classmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=3, max=12),
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
    def process_query(cls, user_prompt: str, context: str = "business") -> Dict[str, Any]:
        if not client:
            raise ValueError("GEMINI_API_KEY haijawekwa au haipatikani.")

        domain = context.lower().strip() if context else "business"
        if domain not in cls.DOMAIN_ALLOWED_TABLES:
            domain = "business"

        allowed_tables = cls.DOMAIN_ALLOWED_TABLES[domain]

        if len(user_prompt) > cls.MAX_PROMPT_LENGTH:
            raise ValueError(f"Swali ni refu sana. Isizidi herufi {cls.MAX_PROMPT_LENGTH}.")

        scoped_prompt = f"""
        ACTIVE DOMAIN CONTEXT: {domain.upper()}
        PERMITTED TABLES FOR THIS REQUEST: {json.dumps(allowed_tables)}

        USER QUESTION: {user_prompt}
        """

        config = types.GenerateContentConfig(
            system_instruction=FORENSIC_QUERY_SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.0,
            max_output_tokens=2048  # Kuongeza nafasi ili kuzuia JSON kukatika katikati
        )

        try:
            response = cls._call_gemini_with_retry(scoped_prompt, config)
            ai_data = safe_parse_json(response.text)

        except APIError as api_err:
            logger.error(f"[GEMINI API ERROR]: {str(api_err)}")
            if "429" in str(api_err) or "RESOURCE_EXHAUSTED" in str(api_err):
                return {
                    "success": False,
                    "domain_context": domain,
                    "display_mode": "text",
                    "explanation": "Mfumo umefikia kikomo cha maombi kwa muda (Rate Limit). Tafadhali subiri sekunde chache kabla ya kuuliza tena.",
                    "generated_sql": "",
                    "total_found": 0,
                    "items": []
                }
            raise RuntimeError(f"Kosa la Gemini API: {str(api_err)}")

        except Exception as e:
            logger.error(f"Gemini API Query execution error: {str(e)}")
            raise RuntimeError(f"Kosa wakati wa mawasiliano na Gemini API: {str(e)}")

        sql = ai_data.get("sql_query", "").strip()
        if not sql:
            raise ValueError("AI haikuzalisha SQL query yoyote.")

        cls._validate_sql(sql)

        try:
            with engine.connect().execution_options(
                read_only=True,
                options="-c statement_timeout=10000"
            ) as conn:
                result = conn.execute(text(sql))
                items = [dict(row._mapping) for row in result]
        except SQLAlchemyError as e:
            error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
            raise RuntimeError(f"Kosa kwenye DB: {error_msg} | [SQL Generated: {sql}]")

        return {
            "success": True,
            "domain_context": domain,
            "display_mode": ai_data.get("display_mode", "table"),
            "explanation": ai_data.get("explanation", ""),
            "generated_sql": sql,
            "total_found": len(items),
            "items": items
        }
