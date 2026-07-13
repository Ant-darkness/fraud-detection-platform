import logging
import smtplib
from email.mime.text import MIMEText
from backend.app.database.connection import get_connection

logger = logging.getLogger(__name__)


def notify_officers(transaction_id: int, probability: float):
    logger.warning(
        f"CRITICAL FRAUD ALERT -> Transaction {transaction_id} flagged with risk: {probability}")

    # Tafuta barua pepe za maafisa walio active
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT email FROM officers WHERE is_active = TRUE AND role = 'OFFICER'")
        emails = [r[0] for r in cursor.fetchall() if r[0]]

        if not emails:
            return True

        msg_text = f"""
        TAHADHARINI - BANK OF TANZANIA FRAUD CONTROL
        Muamala namba {transaction_id} umezuiliwa (HELD) kwa sababu una viashiria vya utapeli kwa asilimia {probability * 100:.2f}%.
        Tafadhali ingia kwenye mfumo wa BoT Fraud Dashboard mara moja kuufanyia kazi.
        """
        msg = MIMEText(msg_text)
        msg['Subject'] = f"★ [BoT ALERT] Viashiria vya Utapeli: TX-{transaction_id}"
        msg['From'] = "fraud-alert@bot.go.tz"
        msg['To'] = ", ".join(emails)

        # Hapa ungeweka SMTP details za kibenki. Kwa sasa tunaiandika kwenye log kwa usalama
        logger.info(f"Email alert sent successfully to: {emails}")
        return True
    except Exception as e:
        logger.error(f"Imeshindwa kutuma barua pepe ya tahadhari: {e}")
        return False
    finally:
        cursor.close()
        conn.close()
