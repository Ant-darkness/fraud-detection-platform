import os
from dotenv import load_dotenv

# Pakia variables kutoka .env
load_dotenv()


class Config:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL_NAME: str = os.getenv("GEMINI_MODEL_NAME", "gemini-3.6-flash")
    AGENT_SYSTEM_PROMPT: str = os.getenv("AGENT_SYSTEM_PROMPT", "")


config = Config()
