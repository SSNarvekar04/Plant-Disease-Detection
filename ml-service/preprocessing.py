"""Image preprocessing helpers.

Kept separate from the model so that training and inference provably use the
exact same pipeline (resize + colour handling). A mismatch between the two
silently destroys accuracy, so both `train.py` and `predictor.py` import
`preprocess_image` from here.

Important: pixel normalisation is **not** done here. The saved Keras model
contains its own ``Rescaling(1/255)`` layer, so the network always receives raw
0-255 values no matter who calls it. Scaling the pixels here as well would apply
the division twice and quietly wreck every prediction, which is exactly the kind
of bug that is invisible in a demo and obvious in production.
"""

import numpy as np
from PIL import Image, ImageOps

#: Square input size expected by the CNN.
IMAGE_SIZE = 224

#: Maximum value of a raw 8-bit RGB channel, i.e. the range the model expects.
PIXEL_MAX = 255.0


def preprocess_image(image: Image.Image, size: int = IMAGE_SIZE) -> np.ndarray:
    """Converts a PIL image into a batched ``(1, size, size, 3)`` float array.

    Steps
      1. convert to RGB (drops transparency and palette modes)
      2. apply EXIF orientation so phone photos are not rotated
      3. resize to ``size x size`` with a high quality filter
      4. cast to float32 while keeping the original 0-255 range

    The returned array is fed straight to ``model.predict``; the ``Rescaling``
    layer inside the model performs the [0, 1] conversion.

    :param image: any ``PIL.Image.Image``
    :param size: target edge length in pixels
    :return: float32 array of shape ``(1, size, size, 3)`` with values in [0, 255]
    """
    rgb = image.convert("RGB")
    rgb = ImageOps.exif_transpose(rgb) or rgb
    rgb = rgb.resize((size, size), Image.Resampling.LANCZOS)

    array = np.asarray(rgb, dtype=np.float32)
    # The model uses a channels-last layout (NHWC).
    return np.expand_dims(array, axis=0).astype("float32")


def add_batch_dimension(array: np.ndarray) -> np.ndarray:
    """Turns a ``(h, w, c)`` array into the ``(1, h, w, c)`` batch the model wants."""
    if array.ndim == 4:
        return array
    return np.expand_dims(array, axis=0).astype("float32")


def describe_range(array: np.ndarray) -> str:
    """Human readable value range -- handy when debugging a preprocessing bug."""
    return f"min={float(np.min(array)):.3f} max={float(np.max(array)):.3f}"
