import os
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

# Resend API Configuration (HTTP-based, works on Render free tier)
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
# From address - must be either:
# 1. onboarding@resend.dev (for testing, sends only to your registered Resend email)
# 2. A verified domain address (for production, sends to anyone)
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "NutriSnap AI <onboarding@resend.dev>")

def send_email(subject, recipient_email, html_content):
    """Send email via Resend HTTP API - works on Render free tier (no SMTP blocking)."""
    print(f"--- DEBUG: Attempting to send email via Resend API ---")
    print(f"--- DEBUG: To: {recipient_email}, Subject: {subject} ---")

    if not RESEND_API_KEY:
        print("--- EMAIL ERROR: RESEND_API_KEY not configured in environment variables ---")
        return False

    try:
        payload = json.dumps({
            "from": RESEND_FROM_EMAIL,
            "to": [recipient_email],
            "subject": subject,
            "html": html_content,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            resp_body = response.read().decode("utf-8")
            print(f"--- EMAIL SENT TO {recipient_email}: {subject} ---")
            print(f"--- Resend Response: {resp_body} ---")
            return True

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else str(e)
        print(f"--- EMAIL FAILED (HTTP {e.code}): {error_body} ---")
        # If the error is about domain restrictions (free plan), log it clearly
        if "not verified" in error_body.lower() or "domain" in error_body.lower():
            print("--- RESEND DOMAIN NOTE: You need a verified domain to send to external emails.")
            print("--- Until then, only emails to your Resend account email will be delivered. ---")
        return False
    except Exception as e:
        print(f"--- EMAIL FAILED: {str(e)} ---")
        return False


def send_verification_email(email, code):
    subject = "Verify your NutriSnap AI Account"
    html = f"""
    <html>
        <body style="font-family: sans-serif; line-height: 1.6;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #00C853;">Welcome to NutriSnap AI!</h2>
                <p>Thank you for signing up. Please use the following code to verify your email address:</p>
                <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">
                    {code}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't create an account, you can safely ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #777;">&copy; 2026 NutriSnap AI. All rights reserved.</p>
            </div>
        </body>
    </html>
    """
    return send_email(subject, email, html)


def send_reset_password_email(email, code):
    subject = "Reset your NutriSnap AI Password"
    html = f"""
    <html>
        <body style="font-family: sans-serif; line-height: 1.6;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #00C853;">Password Reset Request</h2>
                <p>We received a request to reset your password. Use the code below to complete the process:</p>
                <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">
                    {code}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request a password reset, please ignore this email or contact support.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #777;">&copy; 2026 NutriSnap AI. All rights reserved.</p>
            </div>
        </body>
    </html>
    """
    return send_email(subject, email, html)
