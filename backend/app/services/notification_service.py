import os
import logging
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from backend.app.database.connection import get_connection

logger = logging.getLogger(__name__)

# Cấu hình ya SMTP inayosoma kutoka kwenye environment variables zako (.env)
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "your-email@bot.go.tz"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "your-app-password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "your-email@bot.go.tz"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


def notify_officers(transaction_id: int, probability: float):
    logger.warning(
        f"CRITICAL FRAUD ALERT -> Transaction {transaction_id} flagged with risk: {probability}")
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT email FROM officers WHERE is_active = TRUE AND role = 'OFFICER'")
        emails = [r[0] for r in cursor.fetchall() if r[0]]
        if not emails:
            return True
        # Hapa unaweza kuacha log au ukatumia FastMail kutuma email halisi ya dharura
        logger.info(f"Email alert would be sent to: {emails}")
        return True
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")
        return False
    finally:
        cursor.close()
        conn.close()


async def send_reset_password_email(email: str, token: str):
    """Inatuma link ya kuweka nenosiri jipya kwa afisa husika"""
    # URL ya frontend itakayopokea token
    reset_link = f"http://localhost:5173/reset-password?token={token}"

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #333; border-radius: 15px; padding: 30px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.1);">
                <h2 style="color: #D4AF37; text-align: center; border-bottom: 1px solid #333; padding-bottom: 15px;">🛡️ BOT FRAUD DETECTION PORTAL</h2>
                <p>Habari,</p>
                <p>Umeomba kuweka upya nenosiri lako la kuingia kwenye mfumo wa usimamizi wa utapeli wa miamala wa Bank of Tanzania (BoT).</p>
                <p>Tafadhali bonyeza kitufe hapa chini ili kukamilisha mabadiliko haya:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #D4AF37; color: #000000; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Weka Nenosiri Jipya</a>
                </div>
                <p style="color: #a0a0a0; font-size: 12px;">Kiungo hiki kitafanya kazi kwa muda wa <b>dakika 15</b> tu.</p>
                <p style="color: #a0a0a0; font-size: 12px; border-top: 1px solid #333; padding-top: 15px; margin-top: 30px;">Kama hukuomba mabadiliko haya, tafadhali puuza barua pepe hii salama.</p>
            </div>
        </body>
    </html>
    """

    message = MessageSchema(
        subject="BoT Portal - Ombi la Kuweka Nya Nenosiri",
        recipients=[email],
        body=html_content,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def send_airflow_alert_email(email: str, dag_id: str, task_id: str, status: str, log_url: str, error_msg: str = None):
    """Inatuma taarifa ya matokeo ya Airflow Pipeline kwenda kwa timu ya Data Science/Engineers"""
    is_success = status.upper() == "SUCCESS"
    color = "#22c55e" if is_success else "#ef4444"
    icon = "🏆" if is_success else "🚨"

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #333; border-radius: 15px; padding: 30px;">
                <h2 style="color: {color}; text-align: center; border-bottom: 1px solid #333; padding-bottom: 15px;">
                    {icon} AIRFLOW MONITORING ALERT
                </h2>
                <p><b>DAG ID:</b> {dag_id}</p>
                <p><b>Task ID:</b> {task_id}</p>
                <p><b>Hali ya Kazi (Status):</b> <span style="color: {color}; font-weight: bold;">{status.upper()}</span></p>
                
                {f'<p style="color: #ef4444;"><b>Hitilafu iliyotokea:</b><br/><code style="background-color: #000; padding: 5px; display: block; border-radius: 5px;">{error_msg}</code></p>' if error_msg else ''}
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{log_url}" style="background-color: #333; color: #ffffff; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px; border: 1px solid #444; display: inline-block;">Kagua Logs za Airflow ↗️</a>
                </div>
            </div>
        </body>
    </html>
    """

    message = MessageSchema(
        subject=f"{icon} Airflow Pipeline: {dag_id} - {status.upper()}",
        recipients=[email],
        body=html_content,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)
