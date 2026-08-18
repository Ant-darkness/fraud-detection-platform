import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


class EconomicAgenticService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def analyze_volume(self, timeframe: str, metrics: dict) -> str:
        prompt = f"""
        Wewe ni Mchambuzi wa Miamala na Uchumi Mkuu kutoka Benki Kuu ya Tanzania (BoT).
        Fanya uchambuzi wa kiuchumi kwa kifupi sana (Isizidi maneno 70) kulingana na takwimu hizi za miamala:
        
        - Kipindi: {timeframe}
        - Jumla ya Miamala: {metrics.get('total_transactions')}
        - Thamani ya Miamala (TZS): {metrics.get('total_volume_tzs'):,.2f}
        - Wastani wa Muamala: {metrics.get('avg_transaction_amount'):,.2f}
        
        Toa tathmini ya mzunguko wa fedha na ushauri wa kisera/kiuchumi kwa ufupi.
        """
        response = self.model.generate_content(prompt)
        return response.text

    def analyze_fraud(self, timeframe: str, metrics: dict) -> str:
        prompt = f"""
        Wewe ni Afisa Mwandamizi wa Usimamizi wa Hatari za Kibenki (Cybersecurity & Fraud Specialist).
        Fanya tathmini ya usalama wa miamala na hatari za kiuchumi kulingana na takwimu hizi:
        
        - Kipindi: {timeframe}
        - Miamala Iliyokaguliwa: {metrics.get('total_evaluated_transactions')}
        - Miamala Salama: {metrics.get('total_safe_transactions')}
        - Utapeli Uliothibitishwa (Fraud): {metrics.get('total_confirmed_fraud')}
        - Inayosubiri Ukaguzi (Pending): {metrics.get('total_pending_review')}
        - Wastani wa Risk Score ya Miamala Shukiwa: {metrics.get('avg_flagged_risk_score'):.2f}
        
        Toa muhtasari wa kiwango cha hatari (Risk Level) na hatua za kuchukua kulinda mfumo wa fedha.
        """
        response = self.model.generate_content(prompt)
        return response.text
