import os
import json
import logging
import traceback
from typing import Dict, Any, Optional

import google.generativeai as genai
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from agentic_service.analytics_engine import fetch_volume_data, fetch_fraud_data

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agentic_service")

# Gemini Setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")

app = FastAPI(
    title="Bank Fraud Platform - Agentic Microservice",
    version="3.0.0",
    description="Production-Ready Agentic AI Engine supporting Scoped Forensics, Real-time Dashboard Analytics, and Model Auditing."
)


# ==================================================
# REQUEST SCHEMAS (Pydantic Models)
# ==================================================

class ScopedQueryReq(BaseModel):
    prompt: str = Field(...,
                        example="Nionyeshe miamala iliyozidi TSH 10M mwezi uliopita")
    context: Optional[str] = Field(
        "business", example="fraud | volume | business")


class ModelAuditReq(BaseModel):
    model_id: int = Field(..., example=1)
    metrics: Dict[str, Any] = Field(..., example={
                                    "precision": 0.85, "recall": 0.78, "f1_score": 0.81, "roc_auc": 0.92})


# ==================================================
# API ENDPOINTS
# ==================================================

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "agentic_service", "version": "3.0.0"}


# 1. SCOPED FORENSIC ASSISTANT SEARCH
@app.post("/agent/query")
async def handle_scoped_query(req: ScopedQueryReq):
    try:
        logger.info(
            f"Processing Scoped Query | Context: {req.context} | Prompt: {req.prompt}")
        model = genai.GenerativeModel(model_name)
        prompt = f"Context: {req.context}\nUser Question: {req.prompt}"
        response = model.generate_content(prompt)
        return {"status": "success", "response": response.text}
    except Exception as e:
        logger.error(f"[QUERY AGENT ERROR]: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"QueryAgent Error: {str(e)}")


# 2. VOLUME ANALYTICS AGENT
@app.get("/agent/volume-analytics")
async def handle_volume_analytics(
    timeframe: str = Query("7DAYS", description="24HRS, 7DAYS, 4WEEKS, 1YEAR"),
    language: str = Query("sw", description="sw au en")
):
    try:
        logger.info(
            f"Generating Volume Analytics | Timeframe: {timeframe} | Lang: {language}")
        raw_data = fetch_volume_data(timeframe)

        lang_prompt = "Andika kwa Kiswahili rasmi cha kibenki." if language == "sw" else "Write in professional banking English."
        prompt = f"""
        Wewe ni Mtaalamu wa Uchumi Mkuu kutoka Benki Kuu ya Tanzania (BoT).
        Tathmini takwimu hizi za miamala kwa kipindi cha {timeframe}:
        {json.dumps(raw_data, indent=2)}

        Toa muhtasari mfupi (isizidi maneno 60) wa mzunguko wa fedha na tathmini ya kiuchumi.
        {lang_prompt}
        """

        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)

        return {
            "status": "success",
            "timeframe": timeframe,
            "metrics": raw_data,
            "ai_summary": response.text
        }
    except Exception as e:
        logger.error(f"[VOLUME AGENT ERROR]: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Volume Processing Error: {str(e)}")


# 3. FRAUD FORENSICS AGENT
@app.get("/agent/fraud-analytics")
async def handle_fraud_analytics(
    timeframe: str = Query("7DAYS", description="24HRS, 7DAYS, 4WEEKS, 1YEAR"),
    language: str = Query("sw", description="sw au en")
):
    try:
        logger.info(
            f"Generating Fraud Analytics | Timeframe: {timeframe} | Lang: {language}")
        raw_data = fetch_fraud_data(timeframe)

        lang_prompt = "Andika kwa Kiswahili cha kiusalama na kibenki." if language == "sw" else "Write in security banking English."
        prompt = f"""
        Wewe ni Mkuu wa Vitisho vya Utapeli na Mtandao (Cyber Fraud Specialist) Benki Kuu.
        Changanua takwimu za ulinzi wa miamala kwa kipindi cha {timeframe}:
        {json.dumps(raw_data, indent=2)}

        Toa tathmini ya hatari (Risk Assessment) na hatua za haraka za kuchukua kwa ufupi (maneno 60 max).
        {lang_prompt}
        """

        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)

        return {
            "status": "success",
            "timeframe": timeframe,
            "metrics": raw_data,
            "ai_summary": response.text
        }
    except Exception as e:
        logger.error(f"[FRAUD AGENT ERROR]: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Fraud Processing Error: {str(e)}")


# 4. MODEL AUDIT AGENT
@app.post("/agent/model-audit")
async def handle_model_audit(req: ModelAuditReq):
    try:
        logger.info(f"Auditing ML Model ID: {req.model_id}")
        model = genai.GenerativeModel(model_name)
        prompt = f"Audit Machine Learning Model #{req.model_id} with metrics: {json.dumps(req.metrics)}"
        response = model.generate_content(prompt)
        return {"status": "success", "audit_report": response.text}
    except Exception as e:
        logger.error(f"[MODEL AUDIT AGENT ERROR]: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Model Audit Error: {str(e)}")
