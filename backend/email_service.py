import os
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────────────────────
# Resend HTTP API  (works on Render free tier — port 443)
# SMTP (ports 25/465/587) is blocked on Render free tier.
# ─────────────────────────────────────────────────────────────
RESEND_API_KEY    = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "NutriSnap AI <onboarding@resend.dev>")

# ─────────────────────────────────────────────────────────────
# Fallback: SMTP env vars (kept for reference, unused on Render)
# ─────────────────────────────────────────────────────────────
SMTP_HOST       = os.getenv("SMTP_HOST",     os.getenv("EMAIL_HOST",     "smtp.gmail.com"))
SMTP_PORT       = int(os.getenv("SMTP_PORT", os.getenv("EMAIL_PORT",     "587")))
SMTP_USERNAME   = os.getenv("SMTP_USERNAME", os.getenv("EMAIL_USER",     ""))
SMTP_PASSWORD   = os.getenv("SMTP_PASSWORD", os.getenv("EMAIL_PASSWORD", ""))
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", os.getenv("EMAIL_FROM",   ""))
SMTP_FROM_NAME  = os.getenv("SMTP_FROM_NAME", "NutriSnap AI")


def send_email(subject: str, recipient_email: str, html_content: str) -> bool:
    """
    Send an email using Resend HTTP API.
    Falls back to SMTP only if RESEND_API_KEY is not set AND SMTP credentials exist.
    Returns True on success, False on failure.
    """
    print(f"--- EMAIL: Attempting to send '{subject}' to {recipient_email} ---")

    # ── Primary: Resend HTTP API ──────────────────────────────
    if RESEND_API_KEY:
        return _send_via_resend(subject, recipient_email, html_content)

    # ── Secondary: SMTP (only works locally, blocked on Render) ─
    if SMTP_USERNAME and SMTP_PASSWORD:
        print("--- EMAIL WARNING: RESEND_API_KEY not set. Trying SMTP (may fail on Render) ---")
        return _send_via_smtp(subject, recipient_email, html_content)

    print("--- EMAIL ERROR: No email credentials configured (RESEND_API_KEY or SMTP_*) ---")
    return False


# ─────────────────────────────────────────────────────────────
def _send_via_resend(subject: str, recipient_email: str, html_content: str) -> bool:
    try:
        payload = json.dumps({
            "from": RESEND_FROM_EMAIL,
            "to":   [recipient_email],
            "subject": subject,
            "html": html_content,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type":  "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            resp_body = response.read().decode("utf-8")
            print(f"--- EMAIL SENT (Resend) to {recipient_email} | Response: {resp_body} ---")
            return True

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else str(e)
        print(f"--- EMAIL FAILED (Resend HTTP {e.code}): {error_body} ---")
        if "domain" in error_body.lower() or "not verified" in error_body.lower():
            print("--- RESEND NOTE: Verify a domain at resend.com to send to any email address ---")
        return False
    except Exception as e:
        print(f"--- EMAIL FAILED (Resend): {str(e)} ---")
        return False


# ─────────────────────────────────────────────────────────────
def _send_via_smtp(subject: str, recipient_email: str, html_content: str) -> bool:
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    from_addr = SMTP_FROM_EMAIL or f"{SMTP_FROM_NAME} <{SMTP_USERNAME}>"
    try:
        msg = MIMEMultipart()
        msg["From"]    = from_addr
        msg["To"]      = recipient_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_content, "html"))

        if SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"--- EMAIL SENT (SMTP) to {recipient_email} ---")
        return True
    except Exception as e:
        print(f"--- EMAIL FAILED (SMTP): {str(e)} ---")
        return False


# ─────────────────────────────────────────────────────────────
# Public helpers
# ─────────────────────────────────────────────────────────────
def send_verification_email(email: str, code: str) -> bool:
    subject = "Verify your NutriSnap AI Account"
    html = f"""
    <html>
      <body style="font-family: sans-serif; line-height: 1.6; background: #f9f9f9;">
        <div style="max-width:600px;margin:40px auto;background:#fff;padding:30px;
                    border-radius:12px;border:1px solid #eee;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <h2 style="color:#00C853;margin-top:0;">Welcome to NutriSnap AI! 🥗</h2>
          <p>Thank you for signing up. Use the code below to verify your email address:</p>
          <div style="background:#f4f4f4;padding:24px;text-align:center;border-radius:10px;
                      font-size:36px;font-weight:bold;letter-spacing:8px;color:#011627;
                      margin:20px 0;">
            {code}
          </div>
          <p style="color:#555;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#888;font-size:13px;">If you didn't create an account, you can safely ignore this email.</p>
          <hr style="border:0;border-top:1px solid #eee;margin:20px 0;">
          <p style="font-size:11px;color:#aaa;">&copy; 2026 NutriSnap AI. All rights reserved.</p>
        </div>
      </body>
    </html>
    """
    return send_email(subject, email, html)


def send_reset_password_email(email: str, code: str) -> bool:
    subject = "Reset your NutriSnap AI Password"
    html = f"""
    <html>
      <body style="font-family: sans-serif; line-height: 1.6; background: #f9f9f9;">
        <div style="max-width:600px;margin:40px auto;background:#fff;padding:30px;
                    border-radius:12px;border:1px solid #eee;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <h2 style="color:#00C853;margin-top:0;">Password Reset Request 🔐</h2>
          <p>We received a request to reset your NutriSnap AI password. Use the code below:</p>
          <div style="background:#f4f4f4;padding:24px;text-align:center;border-radius:10px;
                      font-size:36px;font-weight:bold;letter-spacing:8px;color:#011627;
                      margin:20px 0;">
            {code}
          </div>
          <p style="color:#555;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border:0;border-top:1px solid #eee;margin:20px 0;">
          <p style="font-size:11px;color:#aaa;">&copy; 2026 NutriSnap AI. All rights reserved.</p>
        </div>
      </body>
    </html>
    """
    return send_email(subject, email, html)
