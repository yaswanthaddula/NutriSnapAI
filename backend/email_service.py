import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# SMTP Configuration
EMAIL_HOST = os.getenv("SMTP_HOST") or os.getenv("EMAIL_HOST") or "smtp.gmail.com"
EMAIL_PORT = int(os.getenv("SMTP_PORT") or os.getenv("EMAIL_PORT") or 587)
EMAIL_USER = os.getenv("SMTP_USERNAME") or os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("SMTP_PASSWORD") or os.getenv("EMAIL_PASSWORD")

SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "NutriSnap AI")

if SMTP_FROM_EMAIL:
    EMAIL_FROM = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
else:
    EMAIL_FROM = os.getenv("EMAIL_FROM") or f"NutriSnap AI <{EMAIL_USER}>"

def send_email(subject, recipient_email, html_content):
    print(f"--- DEBUG: Attempting to send email via {EMAIL_HOST}:{EMAIL_PORT} ---")
    print(f"--- DEBUG: Using User: {EMAIL_USER} ---")
    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("--- EMAIL ERROR: Credentials not configured in .env ---")
        return False

    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_FROM
        msg['To'] = recipient_email
        msg['Subject'] = subject

        msg.attach(MIMEText(html_content, 'html'))

        # Connect and send
        if EMAIL_PORT == 465:
            server = smtplib.SMTP_SSL(EMAIL_HOST, EMAIL_PORT, timeout=20)
            server.ehlo()
        else:
            server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=20)
            server.ehlo()
            server.starttls()
            server.ehlo()
            
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"--- EMAIL SENT TO {recipient_email}: {subject} ---")
        return True
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
