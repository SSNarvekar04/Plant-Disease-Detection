"""Loads the trained Keras model and turns leaf images into predictions.

Responsibilities
  * load ``plant_disease_cnn.keras`` (or any Keras/H5 model) lazily, once
  * decode + preprocess an uploaded image
  * run inference and return the top-k classes with their confidence
  * degrade gracefully when no model file is present, so the whole application
    can still be demonstrated (the returned ``source`` field makes the
    difference explicit and is never silently mixed with real predictions)
"""

from __future__ import annotations

import hashlib
import importlib.util
import os
from dataclasses import dataclass, field
from typing import List

import numpy as np
from PIL import Image

from classes import CLASS_INFO, CLASS_NAMES, NUM_CLASSES, class_metadata, is_healthy_class
from preprocessing import IMAGE_SIZE, preprocess_image

#: How many alternatives are returned alongside the top-1 class.
TOP_K = 3


@dataclass
class PredictionResult:
    """Single prediction, in the shape the Node backend expects."""

    plant: str
    disease: str
    confidence: float
    class_index: int
    class_name: str
    model_name: str
    is_healthy: bool
    source: str
    top_predictions: List[dict] = field(default_factory=list)


class ModelNotAvailable(RuntimeError):
    """Raised when inference is required but no trained model could be loaded."""


def _tensorflow_installed() -> bool:
    """True when TensorFlow can be imported in this environment.

    Uses ``find_spec`` so the answer is cheap and never imports the (very slow)
    TensorFlow module just to answer a health check.
    """
    try:
        return importlib.util.find_spec("tensorflow") is not None
    except (ImportError, ValueError):  # pragma: no cover - broken install
        return False


class LeafDiseasePredictor:
    """Wraps the Keras model together with its class list.

    The model is loaded on the first prediction and cached afterwards, because
    loading weights off disk is by far the slowest part of the request.
    """

    def __init__(self, model_path: str, image_size: int = IMAGE_SIZE, top_k: int = TOP_K) -> None:
        self.model_path = model_path
        self.image_size = image_size
        self.top_k = min(top_k, NUM_CLASSES)
        self._model = None
        self._model_error: str | None = None

    # ------------------------------------------------------------- loading
    @property
    def is_available(self) -> bool:
        """True when a model file exists on disk."""
        return bool(self.model_path) and os.path.isfile(self.model_path)

    @property
    def model_name(self) -> str:
        if not self.is_available:
            return "unavailable"
        return os.path.splitext(os.path.basename(self.model_path))[0]

    def load(self):
        """Imports Keras and loads the weights once, caching the result."""
        if self._model is not None:
            return self._model

        if not self.is_available:
            self._model_error = (
                f"No trained model found at '{self.model_path}'. "
                "Run 'python train.py' after placing the dataset in ml-service/dataset."
            )
            raise ModelNotAvailable(self._model_error)

        try:
            import tensorflow as tf
        except ImportError as error:  # pragma: no cover - depends on environment
            self._model_error = "TensorFlow is not installed in this Python environment."
            raise ModelNotAvailable(self._model_error) from error

        # .keras / SavedModel directories load with `load_model`; plain .h5 works too.
        self._model = tf.keras.models.load_model(self.model_path)
        self._model_error = None
        return self._model

    def status(self) -> dict:
        """Health information reported by ``GET /health``.

        A model file on disk is not the same as a usable model: TensorFlow also
        has to be importable. Both facts are reported separately so neither the
        admin dashboard nor an operator is ever told a model is live when it
        could not actually be loaded.
        """
        available = self.is_available
        tensor_flow = _tensorflow_installed()
        loadable = available and tensor_flow

        if loadable:
            note = "Trained model available - /predict runs real Keras inference"
        elif available:
            note = (
                "A model file exists but TensorFlow is not installed in this "
                "Python environment - /predict falls back to the mock classifier"
            )
        else:
            note = "No trained model file yet - /predict falls back to the deterministic mock classifier"

        return {
            "model_available": available,
            "model_loadable": loadable,
            "tensorflow_installed": tensor_flow,
            "model_path": self.model_path,
            "model_name": self.model_name,
            "num_classes": NUM_CLASSES,
            "image_size": self.image_size,
            "framework": "tensorflow/keras" if tensor_flow else "unavailable",
            "note": note,
        }

    # --------------------------------------------------------- inference
    def predict_pil(self, image: Image.Image) -> PredictionResult:
        """Runs inference on an already opened PIL image."""
        model = self.load()
        batch = preprocess_image(image, self.image_size)
        probabilities = self._probability_vector(model, batch)

        order = np.argsort(probabilities)[::-1]
        top_index = int(order[0])
        metadata = class_metadata(top_index)

        top_predictions = []
        for rank, index in enumerate(order[: self.top_k], start=1):
            info = CLASS_INFO[int(index)]
            top_predictions.append(
                {
                    "rank": rank,
                    "class_index": int(index),
                    "class_name": info["class_name"],
                    "plant": info["plant"],
                    "disease": info["disease"],
                    "confidence": round(float(probabilities[int(index)]) * 100, 2),
                }
            )

        return PredictionResult(
            plant=metadata["plant"],
            disease=metadata["disease"],
            confidence=round(float(probabilities[top_index]) * 100, 2),
            class_index=top_index,
            class_name=metadata["class_name"],
            model_name=self.model_name,
            is_healthy=is_healthy_class(metadata["class_name"]),
            source="ml",
            top_predictions=top_predictions,
        )

    def _probability_vector(self, model, batch: np.ndarray) -> np.ndarray:
        """Runs the model and returns a 1-D probability vector."""
        raw = model.predict(batch, verbose=0)

        # Some models return [batch, classes], others [classes] or a tuple.
        if isinstance(raw, (list, tuple)):
            raw = raw[0]
        probabilities = np.asarray(raw, dtype="float64").reshape(-1)

        if probabilities.shape[0] != NUM_CLASSES:
            raise ModelNotAvailable(
                f"The model outputs {probabilities.shape[0]} classes but "
                f"{NUM_CLASSES} are declared in classes.py."
            )

        total = probabilities.sum()
        # A model trained with a softmax already sums to 1; guard anyway so the
        # confidence value is always a percentage.
        if total <= 0:
            return np.full_like(probabilities, 100.0 / NUM_CLASSES)
        return probabilities / total


# ---------------------------------------------------------------------------
# Deterministic mock classifier
# ---------------------------------------------------------------------------
def mock_predict(image_bytes: bytes) -> PredictionResult:
    """Predicts without a trained model, using the image checksum.

    This exists so the complete application can be tested and demonstrated on a
    machine without a trained model file. It is *not* a classifier: it derives a
    stable pseudo-random class from the image bytes, which means the same image
    always yields the same answer and demos stay reproducible.

    The result is always tagged ``source="mock"``, and the Node backend stores
    that on the prediction record and surfaces it in the UI, so a mock result can
    never be mistaken for a real ML prediction.
    """
    digest = hashlib.sha256(image_bytes).digest()

    class_index = digest[0] % NUM_CLASSES
    metadata = class_metadata(class_index)

    # 62 % - 96 %, deterministic per image.
    confidence = round(62 + (digest[1] / 255) * 34, 2)

    top_predictions = []
    for rank, offset in enumerate((1, 2, 3), start=1):
        index = (class_index + offset) % NUM_CLASSES
        info = CLASS_INFO[index]
        top_predictions.append(
            {
                "rank": rank,
                "class_index": index,
                "class_name": info["class_name"],
                "plant": info["plant"],
                "disease": info["disease"],
                "confidence": round(confidence * (0.5 - 0.08 * offset) + (digest[offset] % 7) * 0.3, 2),
            }
        )

    return PredictionResult(
        plant=metadata["plant"],
        disease=metadata["disease"],
        confidence=confidence,
        class_index=class_index,
        class_name=metadata["class_name"],
        model_name="mock-classifier",
        is_healthy=is_healthy_class(metadata["class_name"]),
        source="mock",
        top_predictions=top_predictions,
    )


def result_to_dict(result: PredictionResult) -> dict:
    """Converts the dataclass into the JSON body returned by ``POST /predict``."""
    return {
        "plant": result.plant,
        "disease": result.disease,
        "confidence": result.confidence,
        "class_index": result.class_index,
        "class_name": result.class_name,
        "model_name": result.model_name,
        "is_healthy": result.is_healthy,
        "source": result.source,
        "top_predictions": result.top_predictions,
    }


def class_list() -> List[str]:
    """The class names the model predicts (used by ``GET /classes``)."""
    return list(CLASS_NAMES)