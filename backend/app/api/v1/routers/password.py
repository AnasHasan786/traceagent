import os
import random
import string
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status
from app.models.otp import OTPRecord
from app.models.user import User
from app.core.security import hash_password
from app.schemas.password import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
)

router = APIRouter(tags=["Password Reset"])

N8N_FORGOT_PASSWORD_WEBHOOK = os.getenv(
    "N8N_FORGOT_PASSWORD_WEBHOOK", "http://localhost:5678/webhook/forgot-password"
)

OTP_EXPIRE_MINUTES = 15


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


async def _trigger_n8n_forgot_password(email: str, name: str, otp: str) -> None:
    """Fire-and-forget n8n webhook — never block the API response."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                N8N_FORGOT_PASSWORD_WEBHOOK,
                json={"email": email, "name": name, "otp": otp},
            )
    except Exception as e:
        print(f"⚠️  [n8n] Forgot password webhook failed: {e}")


@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(payload: ForgotPasswordRequest):
    """
    Generates a 6-digit OTP and fires n8n webhook to send reset email.
    Always returns 200 even if email not found — prevents user enumeration.
    """
    user = await User.find_one(User.email == payload.email)

    if user:
        # Invalidate any existing OTPs for this email
        await OTPRecord.find(OTPRecord.email == payload.email).delete()

        otp = _generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)

        record = OTPRecord(
            email=payload.email,
            otp=otp,
            expires_at=expires_at,
        )
        await record.insert()

        await _trigger_n8n_forgot_password(
            email=user.email,
            name=user.name,
            otp=otp,
        )

    return ForgotPasswordResponse(
        message="If that email exists, a reset code has been sent."
    )


@router.post("/auth/verify-otp", response_model=VerifyOTPResponse)
async def verify_otp_and_reset(payload: VerifyOTPRequest):
    """Verifies the OTP and resets the user's password."""
    record = await OTPRecord.find_one(
        OTPRecord.email == payload.email,
        OTPRecord.used == False,
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code.",
        )

    if record.otp != payload.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect reset code.",
        )

    if datetime.utcnow() > record.expires_at:
        await record.delete()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired. Please request a new one.",
        )

    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters.",
        )

    # Update password
    user = await User.find_one(User.email == payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    user.password_hash = hash_password(payload.password)
    await user.save()

    # Mark OTP as used
    record.used = True
    await record.save()

    return VerifyOTPResponse(message="Password reset successfully.")
