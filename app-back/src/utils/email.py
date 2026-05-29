# src/utils/email.py

import os
from pathlib import Path
from dotenv import load_dotenv

from fastapi_mail import (
    FastMail,
    MessageSchema,
    ConnectionConfig,
    MessageType
)

# =========================
# LOAD ENV
# =========================

env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# =========================
# SMTP CONFIG
# =========================

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("EMAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("EMAIL_PASSWORD"),
    MAIL_FROM=os.getenv("EMAIL_FROM"),
    MAIL_PORT=int(os.getenv("EMAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("EMAIL_SERVER"),
    MAIL_FROM_NAME=os.getenv("EMAIL_FROM_NAME", "EnviroSense"),

    MAIL_STARTTLS=os.getenv("EMAIL_STARTTLS", "True") == "True",
    MAIL_SSL_TLS=os.getenv("EMAIL_SSL_TLS", "False") == "True",

    USE_CREDENTIALS=os.getenv("EMAIL_USE_CREDENTIALS", "True") == "True",
    VALIDATE_CERTS=False  # plus stable en dev + serveurs étudiants
)

fm = FastMail(conf)

# =========================
# AUTH EMAILS
# =========================

async def send_auth_email(email_to: str, code: str, mode: str = "verification") -> bool:

    try:
        if mode == "verification":
            subject = "Activation compte - EnviroSense"
            body = f"Code de vérification: {code}"

        elif mode == "reset":
            subject = "Reset password - EnviroSense"
            body = f"Code reset: {code}"

        else:
            return False

        message = MessageSchema(
            subject=subject,
            recipients=[email_to],
            body=body,
            subtype=MessageType.plain
        )

        await fm.send_message(message)

        print(f"✅ Auth email envoyé -> {email_to}")
        return True

    except Exception as e:
        print(f"❌ SMTP auth error: {e}")
        return False


# =========================
# REPORT EMAIL (FIXED)
# =========================

async def send_report_email(
    recipients: list,
    report_type: str,
    period: str,
    pdf_path: str
) -> bool:

    try:

        # =========================
        # VALIDATION
        # =========================

        if not recipients:
            print("❌ Aucun destinataire")
            return False

        if not os.path.exists(pdf_path):
            print(f"❌ PDF introuvable: {pdf_path}")
            return False

        # =========================
        # SUBJECT
        # =========================

        label = "Rapport Quotidien" if report_type == "daily" else "Rapport Hebdomadaire"

        subject = f"{label} - EnviroSense"

        body = f"""
Bonjour,

Veuillez trouver ci-joint votre {label.lower()}.

Période:
{period}

EnviroSense System
"""

        # =========================
        # FIX IMPORTANT: attachment format
        # =========================

        attachments = [
            {
                "file": pdf_path,
                "headers": {
                    "Content-Disposition": f'attachment; filename="{os.path.basename(pdf_path)}"'
                }
            }
        ]

        message = MessageSchema(
            subject=subject,
            recipients=[str(r) for r in recipients],
            body=body,
            subtype=MessageType.plain,
            attachments=attachments
        )

        await fm.send_message(message)

        print(f"✅ Report email sent -> {recipients}")
        return True

    except Exception as e:
        print(f"❌ Report email error: {e}")
        return False