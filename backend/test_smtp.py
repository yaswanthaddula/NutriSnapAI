import smtplib
import os
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

# SMTP Configuration
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = os.getenv("EMAIL_PORT", "587")
EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")

print(f"Testing connection to {EMAIL_HOST}:{EMAIL_PORT}...")
print(f"User: {EMAIL_USER}")
print(f"Password provided: {'Yes' if EMAIL_PASSWORD else 'No'}")

try:
    server = smtplib.SMTP(EMAIL_HOST, int(EMAIL_PORT))
    server.starttls()
    server.login(EMAIL_USER, EMAIL_PASSWORD)
    print("SUCCESS: SMTP Login successful!")
    
    # Send test email
    msg = MIMEText("This is a test email from NutriSnap AI.")
    msg['Subject'] = "SMTP Test"
    msg['From'] = EMAIL_USER
    msg['To'] = EMAIL_USER
    
    server.send_message(msg)
    print(f"SUCCESS: Test email sent to {EMAIL_USER}")
    server.quit()
except Exception as e:
    print(f"FAILURE: {str(e)}")
