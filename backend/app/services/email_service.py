"""
The EmailSender interface (docs/04-technical-architecture.md §12).
If SMTP is not configured, falls back to printing the email — so you can
develop everything else without needing real SMTP credentials yet.
"""

import asyncio
from email.message import EmailMessage

import aiosmtplib

from app.config import get_settings

settings = get_settings()


def send_email(to: str, subject: str, body: str) -> None:
    if not (settings.smtp_host and settings.smtp_username and settings.smtp_password):
        print(f"[STUB EMAIL] To: {to}\nSubject: {subject}\n\n{body}\n")
        return

    asyncio.run(_send_via_smtp(to, subject, body))


async def _send_via_smtp(to: str, subject: str, body: str) -> None:
    message = EmailMessage()
    message["From"] = settings.smtp_from or settings.smtp_username
    message["To"] = to
    message["Subject"] = subject

    message.set_content("Please view this email in an HTML-compatible email client.")
    message.add_alternative(f"<p>{body}</p>", subtype="html")

    await aiosmtplib.send(
        message,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        start_tls=True,
        username=settings.smtp_username,
        password=settings.smtp_password,
    )
