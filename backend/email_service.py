import os
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────────────────────────
# Brevo (formerly Sendinblue) HTTP API
#   - Free tier: 300 emails/day
#   - No domain verification needed — sends to ANY email address
#   - Uses HTTPS (port 443) — NOT blocked by Render free tier
# ─────────────────────────────────────────────────────────────────
BREVO_API_KEY    = os.getenv("BREVO_API_KEY")
BREVO_FROM_EMAIL = os.getenv("BREVO_FROM_EMAIL", "ayaswanthreddy123@gmail.com")
BREVO_FROM_NAME  = os.getenv("BREVO_FROM_NAME",  "NutriSnap AI")


def send_email(subject: str, recipient_email: str, html_content: str) -> bool:
    """
    Send email via Brevo HTTP API.
    Works on Render free tier. Sends to ANY email address without domain verification.
    Returns True on success, False on failure.
    """
    print(f"--- EMAIL: Sending '{subject}' to {recipient_email} ---")

    if not BREVO_API_KEY:
        print("--- EMAIL WARNING: BREVO_API_KEY not set, using local/testing mockup ---")
        return True

    try:
        payload = json.dumps({
            "sender": {
                "name":  BREVO_FROM_NAME,
                "email": BREVO_FROM_EMAIL
            },
            "to": [{"email": recipient_email}],
            "subject": subject,
            "htmlContent": html_content,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=payload,
            headers={
                "api-key":      BREVO_API_KEY,
                "Content-Type": "application/json",
                "Accept":       "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            resp_body = response.read().decode("utf-8")
            print(f"--- EMAIL SENT (Brevo) to {recipient_email} | Response: {resp_body} ---")
            return True

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else str(e)
        print(f"--- EMAIL FAILED (Brevo HTTP {e.code}): {error_body} ---")
        return False
    except Exception as e:
        print(f"--- EMAIL FAILED (Brevo): {str(e)} ---")
        return False


def send_verification_email(email: str, code: str) -> bool:
    subject = "Your NutriSnap AI Verification Code"
    html = f"""
    <html>
      <body style="font-family: sans-serif; line-height: 1.6; background: #f9f9f9; margin:0; padding:0;">
        <div style="max-width:600px; margin:40px auto; background:#fff; padding:32px;
                    border-radius:12px; border:1px solid #eee; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <h2 style="color:#00C853; margin-top:0;">Welcome to NutriSnap AI! 🥗</h2>
          <p style="color:#333;">Thank you for signing up. Use the code below to verify your email:</p>
          <div style="background:#f4f4f4; padding:24px; text-align:center; border-radius:10px;
                      font-size:40px; font-weight:bold; letter-spacing:10px; color:#011627; margin:20px 0;">
            {code}
          </div>
          <p style="color:#555;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#888; font-size:13px;">If you didn't create an account, you can safely ignore this email.</p>
          <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
          <p style="font-size:11px; color:#aaa;">&copy; 2026 NutriSnap AI. All rights reserved.</p>
        </div>
      </body>
    </html>
    """
    return send_email(subject, email, html)


def send_reset_password_email(email: str, code: str) -> bool:
    subject = "Reset Your NutriSnap AI Password"
    html = f"""
    <html>
      <body style="font-family: sans-serif; line-height: 1.6; background: #f9f9f9; margin:0; padding:0;">
        <div style="max-width:600px; margin:40px auto; background:#fff; padding:32px;
                    border-radius:12px; border:1px solid #eee; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <h2 style="color:#00C853; margin-top:0;">Password Reset Request 🔐</h2>
          <p style="color:#333;">Use the code below to reset your NutriSnap AI password:</p>
          <div style="background:#f4f4f4; padding:24px; text-align:center; border-radius:10px;
                      font-size:40px; font-weight:bold; letter-spacing:10px; color:#011627; margin:20px 0;">
            {code}
          </div>
          <p style="color:#555;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#888; font-size:13px;">If you didn't request this, please ignore this email.</p>
          <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
          <p style="font-size:11px; color:#aaa;">&copy; 2026 NutriSnap AI. All rights reserved.</p>
        </div>
      </body>
    </html>
    """
    return send_email(subject, email, html)
