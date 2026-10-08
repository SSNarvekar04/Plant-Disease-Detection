"""Plant Disease Detection ML service.

A small FastAPI application that wraps the TensorFlow/Keras disease classifier
and exposes it over HTTP so the Node backend can call it.

Endpoints
    GET  /health   liveness + whether a trained model is loaded
    GET  /classes  the class list the model predicts
    POST /predict  analyse an uploaded leaf image
    GET  /         service description

Run with
    pip install -r requirements.txt
    python app.py
"""

from __future__ import annotations

import io
import os
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from classes import CLASS_NAMES
from console import setup_console
from predictor import (
    LeafDiseasePredictor,
    ModelNotAvailable,
    mock_predict,
    result_to_dict,
)

# Load ml-service/.env if it exists, then read the configuration.
load_dotenv(Path(__file__).parent / ".env")

ML_PORT = int(os.getenv("ML_PORT", "8000"))
MODEL_PATH = os.getenv("MODEL_PATH", str(Path(__file__).parent / "models" / "plant_disease_cnn.keras"))
MAX_FILE_SIZE_BYTES = int(os.getenv("ML_MAX_FILE_SIZE_MB", "8")) * 1024 * 1024
#: When "true" and no model is loaded, /predict uses the deterministic mock classifier.
ALLOW_MOCK = os.getenv("ML_ALLOW_MOCK", "true").lower() == "true"

app = FastAPI(
    title="Plant Disease ML Service",
    description="TensorFlow/Keras leaf disease classifier used by the Plant Disease Detection system.",
    version="1.0.0",
)

# The Node backend is the only client, but the Vite dev server may call this
# directly during debugging, so localhost is allowed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

predictor = LeafDiseasePredictor(model_path=MODEL_PATH)


@app.get("/", tags=["meta"])
def root() -> dict:
    """Human readable description of the service."""
    return {
        "service": "plant-disease-ml-service",
        "framework": "tensorflow/keras",
        "num_classes": len(CLASS_NAMES),
        "endpoints": {
            "health": "GET /health",
            "classes": "GET /classes",
            "predict": "POST /predict (multipart field name: 'file')",
        },
    }


@app.get("/health", tags=["meta"])
def health() -> dict:
    """Liveness probe.

    The Node backend uses this to show "ML service connected / offline" on the
    admin dashboard, and to decide whether a prediction is real or a fallback.
    """
    status = predictor.status()
    return {
        "status": "ok",
        # `model_loaded` means "real inference can run": the file exists *and*
        # TensorFlow is importable. `model_available` stays the weaker
        # file-on-disk check so a caller can tell the two apart.
        "model_loaded": status["model_loadable"],
        "mock_fallback_enabled": ALLOW_MOCK,
        **status,
    }


@app.get("/classes", tags=["meta"])
def classes() -> dict:
    """The class names the model predicts, in output-index order."""
    return {"count": len(CLASS_NAMES), "classes": CLASS_NAMES}


@app.post("/predict", tags=["prediction"])
async def predict(file: UploadFile = File(...)) -> dict:
    """Classifies an uploaded plant leaf image.

    Form field: ``file``. Accepted formats: JPG, JPEG, PNG.

    Response
    -------
    200
        {
          "plant": "Tomato",
          "disease": "Early blight",
          "confidence": 94.5,
          "class_index": 21,
          "class_name": "Tomato___Early_blight",
          "model_name": "plant_disease_cnn",
          "is_healthy": false,
          "source": "ml",
          "top_predictions": [...]
        }

    ``source`` is "ml" when the trained model produced the answer and "mock"
    when the deterministic fallback was used, so the caller can label it.

    Errors
    ------
    400  no file, wrong file type, or unreadable image data
    413  file larger than ``ML_MAX_FILE_SIZE_MB``
    503  no model available and mock fallback disabled
    """
    started_at = time.perf_counter()

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No image file was uploaded. Use the 'file' form field.")

    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in {".jpg", ".jpeg", ".png"}:
        raise HTTPException(status_code=400, detail="Only JPG, JPEG and PNG images are supported.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        limit_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"Image is too large. Maximum allowed size is {limit_mb} MB.")

    # Decode + validate the image before it reaches the model.
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()  # detects truncated / corrupted files
        image = Image.open(io.BytesIO(image_bytes))  # reopen: verify() invalidates the object
        image.load()
    except (UnidentifiedImageError, OSError, ValueError) as error:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid JPG or PNG image.") from error

    # --- Real model, or the deterministic fallback -------------------------
    used_mock = False
    try:
        result = predictor.predict_pil(image)
    except ModelNotAvailable as error:
        if not ALLOW_MOCK:
            raise HTTPException(
                status_code=503,
                detail=(
                    "The trained model is not available. Place the trained model file at "
                    f"'{MODEL_PATH}' or run 'python train.py'."
                ),
            ) from error
        result = mock_predict(image_bytes)
        used_mock = True

    payload = result_to_dict(result)
    payload["processing_ms"] = round((time.perf_counter() - started_at) * 1000, 1)
    payload["filename"] = file.filename
    payload["used_mock_fallback"] = used_mock
    return payload


def main() -> None:
    """Starts the service.

    Uses uvicorn directly (instead of `uvicorn.run` with reload) so `python
    app.py` works as the documented start command on every platform.
    """
    try:
        import uvicorn
    except ImportError as error:  # pragma: no cover - depends on environment
        raise SystemExit("uvicorn is not installed. Run: pip install -r requirements.txt") from error

    setup_console()
    status = predictor.status()
    print("")
    print("  \U0001f33f  Plant Disease ML Service")
    print(f"      URL          : http://127.0.0.1:{ML_PORT}")
    print(f"      Docs         : http://127.0.0.1:{ML_PORT}/docs")
    print(f"      Model path   : {MODEL_PATH}")
    print(f"      Model status : {'found' if status['model_available'] else 'NOT FOUND (mock fallback in use)'}")
    print(f"      Classes      : {len(CLASS_NAMES)}")
    print("")

    uvicorn.run(app, host="0.0.0.0", port=ML_PORT)


if __name__ == "__main__":
    main()