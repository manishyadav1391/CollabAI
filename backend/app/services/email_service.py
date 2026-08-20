"""
The EmailSender interface (docs/04-technical-architecture.md §12).
If EMAIL_API_KEY is blank, falls back to printing the email — so you can
develop everything else without needing a real provider account yet.
"""

from app.config import get_settings

settings = get_settings()


def send_email(to: str, subject: str, body: str) -> None:
    if not settings.email_api_key:
        print(f"[STUB EMAIL] To: {to}\nSubject: {subject}\n\n{body}\n")
        return

    if settings.email_provider == "resend":
        _send_via_resend(to, subject, body)
    else:
        print(f"[NO PROVIDER CONFIGURED — stub] To: {to}\nSubject: {subject}\n\n{body}\n")


def _send_via_resend(to: str, subject: str, body: str) -> None:
    import resend

    resend.api_key = settings.email_api_key
    resend.Emails.send({
        "from": settings.email_from_address or "onboarding@resend.dev",
        "to": [to],
        "subject": subject,
        "html": f"<p>{body}</p>",
    })