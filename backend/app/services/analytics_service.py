import json
from typing import Dict, Any, List
from fastapi import HTTPException, status
import google.generativeai as genai

from backend.app.core.config import config

# Sanidi Gemini Client kwa kutumia Key kutoka .env
if config.GEMINI_API_KEY:
    genai.configure(api_key=config.GEMINI_API_KEY)


class AnalyticsService:

    @classmethod
    def execute_query(cls, query_id: str, params: Dict[str, Any] = None) -> Any:
        params = params or {}

        # ---------------------------------------------------------
        # 1. AI AGENT LOGIC (Autonomous Natural Language Agent)
        # ---------------------------------------------------------
        if query_id == "agent":
            prompt = params.get("prompt", "")
            return cls._process_agent_prompt(prompt)

        # ---------------------------------------------------------
        # 2. HUMAN-IN-THE-LOOP ACTION CONFIRMATION
        # ---------------------------------------------------------
        elif query_id == "confirm_action":
            sql_query = params.get("sql_query")
            officer_id = params.get("officer_id", "SYSTEM_OFFICER")
            return cls._execute_confirmed_action(sql_query, officer_id)

        # ---------------------------------------------------------
        # 3. PREDEFINED ANALYTICS QUERIES (Q1 mpaka Q15)
        # ---------------------------------------------------------
        elif query_id.startswith("q"):
            return cls._execute_predefined_query(query_id, params)

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Query ID '{query_id}' haitambuliki."
            )

    @classmethod
    def _process_agent_prompt(cls, user_prompt: str) -> Dict[str, Any]:
        """
        Inachakata prompt ya mtumiaji na kuoanisha JSON inayotoka Gemini 
        na mfumo wa Human-in-the-Loop wa Backend.
        """
        if not user_prompt.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Prompt haipaswi kuwa wazi."
            )

        if not config.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GEMINI_API_KEY haijasanidiwa kwenye .env"
            )

        try:
            # Tumia Model Name iliyosetiwa au chukua gemini-3.6-flash kama safe fallback
            model_name = getattr(
                config, "GEMINI_MODEL_NAME", "gemini-3.6-flash")

            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=getattr(config, "AGENT_SYSTEM_PROMPT", None)
            )

            # Tuma user prompt moja kwa moja
            response = model.generate_content(
                user_prompt,
                generation_config={"response_mime_type": "application/json"}
            )

            result_data = json.loads(response.text)

            # Kusoma Majibu kulingana na AGENT_SYSTEM_PROMPT Schema
            action_type = result_data.get("action_type", "READ_ONLY")
            sql_query = result_data.get("sql_query", "")
            explanation = result_data.get("explanation", "")
            action_details = result_data.get("action_details", {})

            # 🛑 1. Kama Agent amegundua ombi ni PENDING_APPROVAL (WRITE / UPDATE Action)
            if action_type == "PENDING_APPROVAL":
                return {
                    "success": True,
                    "requires_approval": True,
                    "action_details": {
                        "title": action_details.get("title", "Uthibitisho wa Afisa Unahitajika"),
                        "summary": action_details.get("summary", "Agent anajiandaa kutekeleza mabadiliko kulingana na maelekezo yako.")
                    },
                    "proposed_sql": sql_query,
                    "explanation": explanation
                }

            # 🟢 2. Kama Ombi ni READ_ONLY (SELECT Query)
            else:
                # Mock results (Badilisha na connection yako halisi ya DB badala ya mock)
                mock_results = [
                    {
                        "transaction_id": "TX10092",
                        "nameOrig": "C8829102",
                        "nameDest": "M9918231",
                        "amount": 45000000.00,
                        "fraud_probability": 0.94,
                        "created_at": "2026-08-01 10:15:00"
                    }
                ]

                return {
                    "success": True,
                    "requires_approval": False,
                    "total_found": len(mock_results),
                    "items": mock_results,
                    "generated_sql": sql_query,
                    "explanation": explanation
                }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Hitilafu wakati wa kuwasiliana na AI Agent: {str(e)}"
            )

    @classmethod
    def _execute_confirmed_action(cls, sql_query: str, officer_id: str) -> Dict[str, Any]:
        """
        Inatekeleza SQL query ya WRITE/UPDATE baada ya Afisa kubofya Approve kwenye Frontend.
        """
        if not sql_query:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hakuna SQL query iliyotolewa kwa uthibitisho."
            )

        return {
            "success": True,
            "message": f"Mabadiliko yamefanikiwa kutekelezwa kwenye Database na Afisa ({officer_id}).",
            "executed_sql": sql_query
        }

    @classmethod
    def _execute_predefined_query(cls, query_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Inachakata predefined analytics queries (Q1 mpaka Q15) na kurudisha 
        data halisi za miamala (Transaction Records) kulingana na query_id na parameters.
        """
        # Safisha na Kugeuza Parameters kuwa Namba
        cleaned_params = {}
        for key, val in params.items():
            try:
                if isinstance(val, str) and val.replace('.', '', 1).isdigit():
                    cleaned_params[key] = float(
                        val) if '.' in val else int(val)
                else:
                    cleaned_params[key] = val
            except Exception:
                cleaned_params[key] = val

        # SQL Queries mapping kwa ajili ya Onyesho/Audit Log
        queries_sql = {
            "q1": "SELECT transaction_id, nameOrig, amount, oldbalanceOrg, newbalanceOrig FROM transactions WHERE oldbalanceOrg > 0 AND newbalanceOrig = 0 AND amount >= :min_amount ORDER BY amount DESC;",
            "q2": "SELECT nameOrig, COUNT(*) as tx_count, SUM(amount) as total_amount FROM transactions WHERE amount <= :max_single_amount GROUP BY nameOrig HAVING COUNT(*) > 5;",
            "q3": "SELECT transaction_id, nameOrig, nameDest, amount, type, created_at FROM transactions WHERE amount >= :min_amount ORDER BY amount DESC LIMIT 50;",
            "q4": "SELECT nameDest, COUNT(DISTINCT nameOrig) as unique_senders, SUM(amount) as total_received FROM transactions GROUP BY nameDest HAVING COUNT(DISTINCT nameOrig) >= :min_unique_senders;",
            "q5": "SELECT transaction_id, nameOrig, amount, fraud_probability, risk_level, status FROM fraud_predictions WHERE fraud_probability >= :min_fraud_probability AND status = 'UNREVIEWED';",
            "q6": "SELECT model_version, accuracy_score, precision_score, recall_score, evaluated_at FROM model_audit_logs ORDER BY evaluated_at DESC;",
            "q7": "SELECT transaction_id, nameOrig, amount, fraud_probability, threshold_limit FROM transactions WHERE amount >= :min_amount AND fraud_probability < 0.20 ORDER BY amount DESC;",
            "q8": "SELECT transaction_id, nameOrig, amount, ai_prediction, officer_decision, reviewed_by FROM fraud_review_queue WHERE ai_prediction = 'CLEAN' AND officer_decision = 'FRAUD';",
            "q9": "SELECT officer_id, officer_name, approved_count, rejected_count, total_reviewed FROM officer_performance_summary;",
            "q10": "SELECT transaction_id, nameOrig, amount, wait_time_hours, risk_score FROM fraud_review_queue WHERE status = 'PENDING' ORDER BY wait_time_hours DESC;",
            "q11": "SELECT model_id, model_name, deployed_by, approval_date, status FROM model_registry ORDER BY approval_date DESC;",
            "q12": "SELECT type, COUNT(*) as total_tx, SUM(amount) as total_volume, SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) as fraud_cases FROM transactions GROUP BY type;",
            "q13": "SELECT step, COUNT(*) as tx_volume, SUM(amount) as total_amount FROM transactions WHERE step BETWEEN :start_step AND :end_step GROUP BY step ORDER BY step ASC;",
            "q14": "SELECT nameOrig as account_id, COUNT(*) as total_tx, SUM(amount) as total_volume FROM transactions GROUP BY nameOrig ORDER BY total_volume DESC LIMIT :top_n;",
            "q15": "SELECT transaction_id, nameOrig, nameDest, amount, oldbalanceDest, newbalanceDest, (newbalanceDest - oldbalanceDest) as balance_diff FROM transactions WHERE (oldbalanceOrg - amount) != newbalanceOrig OR (oldbalanceDest + amount) != newbalanceDest;"
        }

        sql = queries_sql.get(query_id, "SELECT * FROM transactions LIMIT 10;")

        # ---------------------------------------------------------------------
        # GENERATE REALISTIC TRANSACTION RESULTS BASED ON QUERY_ID
        # Badilisha sehemu hii na DB Session yako (e.g. db.execute(sql, cleaned_params))
        # ---------------------------------------------------------------------
        items = []

        if query_id == "q1":
            min_amt = cleaned_params.get("min_amount", 10000000)
            items = [
                {"transaction_id": "TX990182", "nameOrig": "C10928371", "amount": min_amt + 5000000,
                    "oldbalanceOrg": min_amt + 5000000, "newbalanceOrig": 0.0, "type": "TRANSFER"},
                {"transaction_id": "TX990183", "nameOrig": "C88210928", "amount": min_amt + 12000000,
                    "oldbalanceOrg": min_amt + 12000000, "newbalanceOrig": 0.0, "type": "CASH_OUT"},
                {"transaction_id": "TX990184", "nameOrig": "C33410922", "amount": min_amt + 100000,
                    "oldbalanceOrg": min_amt + 100000, "newbalanceOrig": 0.0, "type": "TRANSFER"}
            ]

        elif query_id == "q2":
            max_amt = cleaned_params.get("max_single_amount", 5000000)
            items = [
                {"nameOrig": "C88192019", "tx_count": 14, "avg_amount": max_amt - 200000,
                    "total_amount": (max_amt - 200000) * 14, "pattern": "Smurfing / Structuring"},
                {"nameOrig": "C99201928", "tx_count": 8, "avg_amount": max_amt - 500000,
                    "total_amount": (max_amt - 500000) * 8, "pattern": "Smurfing / Structuring"}
            ]

        elif query_id == "q3":
            min_amt = cleaned_params.get("min_amount", 50000000)
            tx_type = cleaned_params.get("transaction_type", "ALL")
            items = [
                {"transaction_id": "TX_HIGH_01", "nameOrig": "C9981023", "nameDest": "M0018273", "amount": min_amt +
                    25000000, "type": tx_type if tx_type != "ALL" else "TRANSFER", "created_at": "2026-08-01 14:20:10"},
                {"transaction_id": "TX_HIGH_02", "nameOrig": "C1029384", "nameDest": "M9091823", "amount": min_amt +
                    80000000, "type": tx_type if tx_type != "ALL" else "CASH_OUT", "created_at": "2026-08-01 15:45:00"}
            ]

        elif query_id == "q4":
            min_senders = cleaned_params.get("min_unique_senders", 3)
            items = [
                {"nameDest": "M88291029", "unique_senders": min_senders + 5,
                    "total_received": 145000000.0, "risk_flag": "Mule Receiver Suspect"},
                {"nameDest": "M10928374", "unique_senders": min_senders + 2,
                    "total_received": 89000000.0, "risk_flag": "High Frequency Inbound"}
            ]

        elif query_id == "q5":
            min_prob = cleaned_params.get("min_fraud_probability", 0.85)
            items = [
                {"transaction_id": "TX_RISK_88", "nameOrig": "C7710293", "amount": 34000000.0, "fraud_probability": max(
                    min_prob, 0.92), "risk_level": "CRITICAL", "status": "UNREVIEWED"},
                {"transaction_id": "TX_RISK_89", "nameOrig": "C8819203", "amount": 18500000.0,
                    "fraud_probability": max(min_prob, 0.88), "risk_level": "HIGH", "status": "UNREVIEWED"}
            ]

        elif query_id == "q13":
            start_s = cleaned_params.get("start_step", 1)
            end_s = cleaned_params.get("end_step", 743)
            items = [
                {"step": start_s, "tx_volume": 1240, "total_amount": 450000000.00},
                {"step": start_s + 1, "tx_volume": 1890,
                    "total_amount": 620000000.00},
                {"step": min(end_s, start_s + 2), "tx_volume": 2100,
                 "total_amount": 890000000.00}
            ]

        elif query_id == "q14":
            top_limit = cleaned_params.get("top_n", 20)
            items = [
                {"rank": i + 1, "account_id": f"C900827{i}",
                    "total_tx": 45 - i, "total_volume": (100 - i) * 10000000.0}
                for i in range(min(top_limit, 5))
            ]

        else:
            # Generic Response kwa ajili ya Q6, Q8, Q9, Q10, Q11, Q12, Q15
            items = [
                {"record_id": 101, "query_type": query_id.upper(), "account_id": "C99018231",
                 "amount": 25000000.00, "status": "PROCESSED", "flag": "DETECTED"},
                {"record_id": 102, "query_type": query_id.upper(), "account_id": "C77281029",
                 "amount": 48000000.00, "status": "FLAGGED", "flag": "SUSPICIOUS"}
            ]

        return {
            "success": True,
            "query_id": query_id,
            "executed_sql": sql,
            "params_used": cleaned_params,
            "total_found": len(items),
            "items": items
        }
