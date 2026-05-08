import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from dotenv import load_dotenv

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_FROM"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

async def send_reset_email(email_to: str, code: str):
    message = MessageSchema(
        subject="Réinitialisation de votre mot de passe",
        recipients=[email_to],
        body=f"Votre code de vérification est : {code}. Il expire dans 10 minutes.",
        subtype=MessageType.plain
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        return True
    except Exception as e:
        print(f"Erreur d'envoi SMTP : {e}")
        return False
