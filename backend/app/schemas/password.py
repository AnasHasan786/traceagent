from pydantic import BaseModel, EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    message: str

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str
    password: str

class VerifyOTPResponse(BaseModel):
    message: str
    