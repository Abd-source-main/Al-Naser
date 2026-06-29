"""
Very simple OTP server using FastAPI + Resend.

Endpoints:
  POST /send-otp     {"email": "user@example.com"}        -> emails a 6-digit code
  POST /verify-otp   {"email": "...", "code": "123456"}   -> checks the code

Run:
  cd server
  ../.venv/Scripts/python.exe -m uvicorn app:app --reload --port 8000
"""

import os
import random
import time

import resend
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

load_dotenv()

resend.api_key = os.environ["RESEND_API_KEY"]
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@alnaser-company.com")

OTP_TTL_SECONDS = 5 * 60      # code is valid for 5 minutes
MAX_ATTEMPTS = 5             # wrong-guess limit per code
RESEND_COOLDOWN = 30        # min seconds between sends to one email

# In-memory store: { email: {"code", "expires", "attempts", "last_sent"} }
# Fine for a single process / learning. Use Redis or a DB in production.
otp_store: dict[str, dict] = {}

app = FastAPI(title="Al-Naser OTP")

# Allow the static site to call this from the browser. Lock this down in prod.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class SendRequest(BaseModel):
    email: EmailStr


class VerifyRequest(BaseModel):
    email: EmailStr
    code: str


@app.post("/send-otp")
def send_otp(req: SendRequest):
    email = req.email.lower()
    now = time.time()

    existing = otp_store.get(email)
    if existing and now - existing["last_sent"] < RESEND_COOLDOWN:
        wait = int(RESEND_COOLDOWN - (now - existing["last_sent"]))
        raise HTTPException(429, f"Please wait {wait}s before requesting a new code.")

    code = f"{random.randint(0, 999999):06d}"
    otp_store[email] = {
        "code": code,
        "expires": now + OTP_TTL_SECONDS,
        "attempts": 0,
        "last_sent": now,
    }

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": email,
            "subject": "Your verification code",
            "html": (
                f"<div style='font-family:sans-serif'>"
                f"<h2>Your code is {code}</h2>"
                f"<p>It expires in 5 minutes. Do not share it with anyone.</p>"
                f"</div>"
            ),
        })
    except Exception as e:
        otp_store.pop(email, None)
        raise HTTPException(502, f"Failed to send email: {e}")

    return {"ok": True, "message": "OTP sent"}


@app.post("/verify-otp")
def verify_otp(req: VerifyRequest):
    email = req.email.lower()
    entry = otp_store.get(email)

    if not entry:
        raise HTTPException(400, "No code requested for this email.")
    if time.time() > entry["expires"]:
        otp_store.pop(email, None)
        raise HTTPException(400, "Code expired. Request a new one.")
    if entry["attempts"] >= MAX_ATTEMPTS:
        otp_store.pop(email, None)
        raise HTTPException(429, "Too many attempts. Request a new code.")

    entry["attempts"] += 1
    if req.code != entry["code"]:
        raise HTTPException(400, "Incorrect code.")

    otp_store.pop(email, None)  # one-time use
    return {"ok": True, "verified": True}
