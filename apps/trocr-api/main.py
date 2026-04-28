from contextlib import asynccontextmanager
from io import BytesIO
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from transformers import TrOCRProcessor, VisionEncoderDecoderModel

MODEL_NAME = "microsoft/trocr-base-handwritten"
DEVICE = os.getenv("TROCR_DEVICE", "cpu")

processor: TrOCRProcessor | None = None
model: VisionEncoderDecoderModel | None = None
app: FastAPI | None = None


class OCRResponse(BaseModel):
    text: str


@asynccontextmanager
async def lifespan(api: FastAPI):
    global processor, model
    processor = TrOCRProcessor.from_pretrained(MODEL_NAME)
    model = VisionEncoderDecoderModel.from_pretrained(MODEL_NAME)
    model.to(DEVICE)
    model.eval()
    yield


app = FastAPI(title="TrOCR OCR Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ocr", response_model=OCRResponse)
async def ocr(image: UploadFile = File(...)) -> OCRResponse:
    if processor is None or model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image upload")

    try:
        pil_image = Image.open(BytesIO(contents)).convert("RGB")
        pixel_values = processor(images=pil_image, return_tensors="pt").pixel_values
        generated_ids = model.generate(pixel_values)
        text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()
        return OCRResponse(text=text)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {error}") from error
