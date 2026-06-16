"""
Email service for sending verification emails.
Uses Resend API (free tier: 3000 emails/month).
"""
import os
import httpx
from typing import Optional

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "noreply@burnerdesignpro.com")
RESEND_API_URL = "https://api.resend.com/emails"


async def send_verification_email(to_email: str, code: str) -> bool:
    """Send verification code email via Resend."""
    if not RESEND_API_KEY:
        print(f"[email] WARNING: RESEND_API_KEY not set. Verification code for {to_email}: {code}")
        return True  # In dev, log to console and pretend success

    subject = "Verify your email - Burner Design Pro"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to Burner Design Pro!</h2>
        <p>Thank you for signing up. Please verify your email address by entering the code below:</p>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #f39c12; letter-spacing: 4px;">{code}</span>
        </div>
        <p style="color: #7f8c8d; font-size: 14px;">This code will expire in 30 minutes.</p>
        <p style="color: #7f8c8d; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #95a5a6; font-size: 12px;">Burner Design Pro - Professional tools for burner engineers</p>
    </div>
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": f"Burner Design Pro <{RESEND_FROM_EMAIL}>",
                    "to": [to_email],
                    "subject": subject,
                    "html": html_body,
                },
                timeout=30.0,
            )
            if response.status_code == 200:
                print(f"[email] Verification email sent to {to_email}")
                return True
            else:
                print(f"[email] Failed to send email: {response.status_code} {response.text}")
                return False
    except Exception as e:
        print(f"[email] Error sending email: {e}")
        return False


def generate_verification_code() -> str:
    """Generate a 6-digit numeric verification code."""
    import random
    return "".join([str(random.randint(0, 9)) for _ in range(6)])
