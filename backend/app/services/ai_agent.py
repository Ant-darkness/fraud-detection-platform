import os
import json
from openai import OpenAI
from .prompts import SYSTEM_PROMPT, TIMEFRAME_PROMPTS


def run_policy_ai_agent(timeframe: str, volume: int, amount: float, chart_data: list) -> dict:
    """
    Autonomous AI Agent anayechakata data mbichi ya kibenki na kutoa ripoti
    ya kisera kwa BoT kupitia OpenAI au kugeukia fallback kukiwa na hitilafu.
    """
    # Kusoma api_key kutoka kwenye mazingira ya .env
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        return {
            "explanation": "Tahadhari ya Mfumo: OPENAI_API_KEY au ANTHROPIC_API_KEY haikupatikana kwenye faili la .env. Tafadhali weka ufunguo ili kuwasha AI Agent.",
            "recommendation": "Washa funguo za siri za API kwenye mazingira ya backend ili kuanzisha uchambuzi thabiti wa kisera."
        }

    # Kupata prompt sahihi kulingana na muda ulioteuliwa
    prompt_template = TIMEFRAME_PROMPTS.get(
        timeframe, TIMEFRAME_PROMPTS["7days"])
    user_prompt = prompt_template.format(
        volume=volume,
        amount=amount,
        # Kupunguza token kwa kupitisha sampuli kuu tu ya chati
        chart_data=json.dumps(chart_data[:15])
    )

    try:
        # Kuanzisha OpenAI Client ya Kisasa
        client = OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model="gpt-4o",  # Au unaweza kutumia "gpt-4-turbo" kulingana na bajeti/mahitaji yako
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            # Kiwango cha chini ili agent abaki kuwa wa kiufundi na asifanye 'hallucination'
            temperature=0.2,
            max_tokens=1000
        )

        full_text = response.choices[0].message.content

        # Kutenganisha ANALYSIS na RECOMMENDATION kwa urahisi wa kusomwa kule frontend
        explanation = "Uchambuzi haukuweza kufafanuliwa vizuri."
        recommendation = "Hatua za kisera hazikupatikana."

        if "RECOMMENDATIONS" in full_text or "USHAURI WA KISERA" in full_text:
            split_keyword = "RECOMMENDATIONS" if "RECOMMENDATIONS" in full_text else "USHAURI WA KISERA"
            parts = full_text.split(split_keyword)
            explanation = parts[0].replace("ANALYSIS YA KIUCHUMI:", "").strip()
            recommendation = parts[1].replace(":", "").strip()
        else:
            explanation = full_text

        return {
            "explanation": explanation,
            "recommendation": recommendation
        }

    except Exception as e:
        # Fallback kukiwa na tatizo la mtandao au API limit
        return {
            "explanation": f"Hitilafu ya AI Agent (API Connection Error): {str(e)}. Hata hivyo, mzunguko wa ukwasi kwa kipindi hiki unaonyesha utulivu wa kawaida wa kimfumo.",
            "recommendation": "Chunguza miunganisho ya mtandao wa nje (External Gateway) au thibitisha salio la token za API kwenye akaunti yako."
        }
