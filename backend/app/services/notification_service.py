import os
import logging
import asyncio
from dotenv import load_dotenv
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from backend.app.database.connection import get_connection

load_dotenv()

logger = logging.getLogger(__name__)

# Config ya SMTP
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT",587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


def notify_officers(transaction_id: str, probability: float):
    """Inatuma email ya dharura kwa Maofisa pale Fraud inapobainika"""
    logger.warning(
        f"CRITICAL FRAUD ALERT -> Transaction {transaction_id} flagged with risk: {probability:.4f}")

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT email FROM officers")
        emails = [r[0] for r in cursor.fetchall() if r[0]]

        if not emails:
            logger.warning(
                "⚠️ Hakuna email za Maofisa zilizopatikana kwenye Database.")
            return False

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #ef4444; border-radius: 15px; padding: 30px;">
                    <h2 style="color: #ef4444; text-align: center; border-bottom: 1px solid #333; padding-bottom: 15px;">
                        🚨 BOOSTER FRAUD ALERT
                    </h2>
                    <p>Mfumo umebaini muamala wenye viashiria vya utapeli:</p>
                    <p><b>Transaction ID:</b> <code style="color: #D4AF37;">{transaction_id}</code></p>
                    <p><b>Kiwango cha Hatari (Fraud Risk):</b> <b style="color: #ef4444;">{probability * 100:.2f}%</b></p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:3000/dashboard" style="background-color: #ef4444; color: #ffffff; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Kagua Muamala Hapa</a>
                    </div>
                </div>
            </body>
        </html>
        """

        message = MessageSchema(
            subject=f"🚨 TAARIFA YA UTAPELI: TX {transaction_id}",
            recipients=emails,
            body=html_content,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        asyncio.run(fm.send_message(message))
        logger.info(f"✅ Email ya dharura imetumwa kwa Maofisa: {emails}")
        return True

    except Exception as e:
        logger.error(f"❌ Imeshindikana kutuma email ya Fraud Alert: {e}")
        return False
    finally:
        cursor.close()
        conn.close()


async def send_reset_password_email(email: str, token: str):
    """Inatuma Token maalum ya usalama ya kuweka nenosiri jipya kwa afisa husika"""
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #333; border-radius: 15px; padding: 30px;">
                <h2 style="color: #D4AF37; text-align: center; border-bottom: 1px solid #333; padding-bottom: 15px;">🛡️ BOT FRAUD DETECTION PORTAL</h2>
                <p>Habari Afisa,</p>
                <p>Umeomba kuweka upya nenosiri lako la kuingia kwenye mfumo wa BoT Fraud Detection Portal.</p>
                <p>Tumia Token hii ya usalama ili kukamilisha mchakato:</p>
                <div style="text-align: center; margin: 25px 0;">
                    <span style="background-color: #0d0d0d; border: 2px dashed #D4AF37; color: #D4AF37; padding: 15px 30px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 10px; display: inline-block;">
                        {token}
                    </span>
                </div>
                <p style="color: #a0a0a0; font-size: 12px; text-align: center;">Token hii itakwisha muda wake ndani ya <b>dakika 15</b>.</p>
            </div>
        </body>
    </html>
    """

    message = MessageSchema(
        subject="BoT Portal - Token ya Kuweka Upya Nenosiri",
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
