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


async def send_cancel_subscription_email(to_email: str, expires_date: str) -> bool:
    """Send subscription cancellation confirmation email via Resend."""
    if not RESEND_API_KEY:
        print(f"[email] WARNING: RESEND_API_KEY not set. Cancel confirmation for {to_email}")
        return True

    subject = "Your subscription has been cancelled - Burner Design Pro"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Subscription Cancelled</h2>
        <p>We're sorry to see you go. Your subscription auto-renewal has been cancelled successfully.</p>
        <p style="margin: 20px 0;">Your Pro access will remain active until: <strong>{expires_date}</strong></p>
        <p>You can reactivate your subscription anytime by visiting your account page.</p>
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
                print(f"[email] Cancel subscription email sent to {to_email}")
                return True
            else:
                print(f"[email] Failed to send cancel email: {response.status_code} {response.text}")
                return False
    except Exception as e:
        print(f"[email] Error sending cancel email: {e}")
        return False


async def send_password_reset_email(to_email: str, reset_token: str, app_url: str) -> bool:
    """
    Send password reset email with a secure reset link.
    Link expires in 1 hour.
    """
    if not RESEND_API_KEY:
        print(f"[email] WARNING: RESEND_API_KEY not set. Password reset token for {to_email}: {reset_token}")
        return True

    reset_url = f"{app_url}/reset-password?token={reset_token}&email={to_email}"
    subject = "Reset your password - Burner Design Pro"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Reset Your Password</h2>
        <p>Hi there,</p>
        <p>We received a request to reset your password for your Burner Design Pro account.</p>
        <p style="color: #e74c3c;"><strong>If you didn't request this, you can safely ignore this email.</strong></p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}" style="background: #f39c12; color: white; padding: 14px 28px; 
               text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Reset Password
            </a>
        </div>
        
        <p style="color: #7f8c8d; font-size: 14px;">
            This link will expire in <strong>1 hour</strong> for security reasons.
        </p>
        
        <p style="color: #7f8c8d; font-size: 14px;">
            If the button above doesn't work, copy and paste this link into your browser:
        </p>
        <p style="color: #3498db; font-size: 12px; word-break: break-all;">
            {reset_url}
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #95a5a6; font-size: 12px;">
            Burner Design Pro - Professional tools for burner engineers
        </p>
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
                print(f"[email] Password reset email sent to {to_email}")
                return True
            else:
                print(f"[email] Failed to send reset email: {response.status_code} {response.text}")
                return False
    except Exception as e:
        print(f"[email] Error sending reset email: {e}")
        return False


async def send_password_changed_email(to_email: str) -> bool:
    """Send confirmation email when password is changed."""
    if not RESEND_API_KEY:
        print(f"[email] WARNING: RESEND_API_KEY not set. Password changed for {to_email}")
        return True

    subject = "Your password has been changed - Burner Design Pro"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Password Changed</h2>
        <p>Hi there,</p>
        <p>Your password has been changed successfully.</p>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;">
                <strong>✅</strong> If you made this change, you're all set.
            </p>
        </div>
        
        <p style="color: #e74c3c;">
            <strong>If you didn't change your password</strong>, please contact us immediately at 
            <a href="mailto:support@burnerdesignpro.com">support@burnerdesignpro.com</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #95a5a6; font-size: 12px;">
            Burner Design Pro - Professional tools for burner engineers
        </p>
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
                print(f"[email] Password changed email sent to {to_email}")
                return True
            else:
                print(f"[email] Failed to send changed email: {response.status_code} {response.text}")
                return False
    except Exception as e:
        print(f"[email] Error sending changed email: {e}")
        return False


def generate_verification_code() -> str:
    """Generate a 6-digit numeric verification code."""
    import random
    return "".join([str(random.randint(0, 9)) for _ in range(6)])
