from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (kept – template requirement)
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image-preview"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


class RegenerateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    image_base64: str = Field(..., description="Original receipt PNG/JPEG as base64 (no data URI prefix)")
    target_date: str = Field(..., description="New date string to render, e.g. 'Jun 8, 2026'")
    target_time: str = Field(..., description="New time string to render, e.g. '3:52 pm'")


class RegenerateResponse(BaseModel):
    image_base64: str
    mime_type: str


@api_router.get("/")
async def root():
    return {"message": "Receipt Pack API"}


@api_router.post("/regenerate-receipt", response_model=RegenerateResponse)
async def regenerate_receipt(payload: RegenerateRequest):
    """
    Sends the uploaded receipt to Gemini Nano Banana and asks it to regenerate
    the exact same receipt with only the date + time updated.
    """
    prompt = (
        "You are an image editor. You will receive a screenshot of a digital "
        "receipt. Reproduce this receipt EXACTLY pixel-for-pixel — same layout, "
        "same fonts, same colors, same logos, same icons, same spacing, same "
        "background, same status bar — with ONLY two changes:\n"
        f"1. Every visible date in the receipt must read: {payload.target_date}\n"
        f"2. Every visible time in the receipt must read: {payload.target_time}\n"
        "Do not change any other text, amount, name, payment method, or layout. "
        "Output a single image of the modified receipt at the same resolution "
        "and aspect ratio as the input."
    )

    session_id = f"receipt-regen-{uuid.uuid4()}"
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message="You are an expert image editor that reproduces receipts pixel-for-pixel with only the requested text changes.",
    )
    chat.with_model("gemini", GEMINI_IMAGE_MODEL).with_params(modalities=["image", "text"])

    msg = UserMessage(
        text=prompt,
        file_contents=[ImageContent(payload.image_base64)],
    )

    try:
        _text, images = await chat.send_message_multimodal_response(msg)
    except Exception as exc:
        logger.exception("Nano Banana edit failed")
        raise HTTPException(status_code=502, detail=f"Image generation failed: {exc}") from exc

    if not images:
        raise HTTPException(status_code=502, detail="Model returned no image")

    img = images[0]
    return RegenerateResponse(
        image_base64=img["data"],
        mime_type=img.get("mime_type", "image/png"),
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
