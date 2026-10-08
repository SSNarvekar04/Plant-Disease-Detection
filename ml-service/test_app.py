"""Tests for the ML service endpoints.

Runs against a live server:
    python app.py
    python test_app.py

Exits with code 1 when a check fails.
"""

from __future__ import annotations

import io
import sys

import httpx
from PIL import Image

BASE_URL = "http://127.0.0.1:8000"

passed = 0
failed = 0
failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        failures.append(f"{name}: {detail}")
        print(f"  FAIL  {name}\n        {detail}")


def make_image_bytes(size=(320, 320), colour=(60, 140, 60)) -> bytes:
    """Builds a valid in-memory PNG."""
    buffer = io.BytesIO()
    Image.new("RGB", size, colour).save(buffer, format="PNG")
    return buffer.getvalue()


def make_noise_png(size=(2000, 2000)) -> bytes:
    """Builds a large PNG of random pixels (comfortably above the 8 MB limit).

    A solid colour compresses to a few kilobytes, so a "large file" test needs
    real noise. `os.urandom` keeps generation fast despite the size.
    """
    import os

    pixels = os.urandom(size[0] * size[1] * 3)
    image = Image.frombytes("RGB", size, pixels)

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def section(title: str) -> None:
    print(f"\n{title}")


def run() -> int:
    client = httpx.Client(base_url=BASE_URL, timeout=30.0)

    try:
        print(f"\nTesting {BASE_URL}\n" + "=" * 60)

        section("Meta")
        check("GET / returns service info", client.get("/").status_code == 200)

        response = client.get("/health")
        check("GET /health responds", response.status_code == 200)
        payload = response.json()
        check("health reports the class count", payload.get("num_classes") == 29, str(payload))
        check(
            "health reports model availability as a boolean",
            isinstance(payload.get("model_available"), bool),
            str(payload),
        )

        response = client.get("/classes")
        check("GET /classes returns the class list", response.status_code == 200)
        classes = response.json().get("classes", [])
        check("classes list has 29 entries", len(classes) == 29, f"got {len(classes)}")
        check(
            "classes use the Plant___Disease format",
            all("___" in name for name in classes),
            "some class names are malformed",
        )
        check(
            "Tomato classes are present",
            any(name.startswith("Tomato___") for name in classes),
            "no Tomato classes found",
        )

        section("Prediction")
        image_bytes = make_image_bytes()

        response = client.post("/predict", files={"file": ("leaf.png", image_bytes, "image/png")})
        check("POST /predict accepts a PNG", response.status_code == 200, response.text[:200])
        if response.status_code == 200:
            result = response.json()
            for field in ("plant", "disease", "confidence", "class_index", "class_name", "source"):
                check(f"response contains '{field}'", field in result, str(result))
            check(
                "confidence is a percentage between 0 and 100",
                0 <= result.get("confidence", -1) <= 100,
                str(result.get("confidence")),
            )
            check(
                "class_index is within the class list",
                0 <= result.get("class_index", -1) < len(classes),
                str(result.get("class_index")),
            )
            check(
                "source is 'ml' or 'mock'",
                result.get("source") in {"ml", "mock"},
                str(result.get("source")),
            )
            check(
                "top_predictions has at least one entry",
                len(result.get("top_predictions", [])) >= 1,
                "empty top_predictions",
            )

        # Determinism: the same image must always produce the same answer.
        first = client.post("/predict", files={"file": ("leaf.png", image_bytes, "image/png")}).json()
        second = client.post("/predict", files={"file": ("leaf.png", image_bytes, "image/png")}).json()
        check(
            "the same image returns the same class",
            first.get("class_name") == second.get("class_name"),
            f"{first.get('class_name')} vs {second.get('class_name')}",
        )

        # A different image should be treated independently (not necessarily a
        # different class, but the pipeline must accept it).
        other = client.post(
            "/predict",
            files={"file": ("other.jpg", make_image_bytes(colour=(200, 40, 40)), "image/jpeg")},
        )
        check("POST /predict accepts a JPEG", other.status_code == 200, other.text[:200])

        section("Validation")
        check(
            "POST /predict rejects a non-image",
            client.post("/predict", files={"file": ("note.txt", b"hello", "text/plain")}).status_code == 400,
        )
        check(
            "POST /predict rejects a .txt extension",
            client.post("/predict", files={"file": ("note.txt", b"hello", "image/png")}).status_code == 400,
        )
        check(
            "POST /predict rejects a corrupted image",
            client.post(
                "/predict", files={"file": ("broken.png", b"\x89PNG\r\n\x1a\ngarbage", "image/png")}
            ).status_code
            == 400,
        )
        check(
            "POST /predict rejects an empty file",
            client.post("/predict", files={"file": ("empty.png", b"", "image/png")}).status_code == 400,
        )
        check("POST /predict rejects a missing file", client.post("/predict").status_code == 422)

        # -- Error handling -- should not crash on a huge payload.
        huge = make_noise_png()
        response = client.post("/predict", files={"file": ("huge.png", huge, "image/png")})
        check(
            "POST /predict rejects a file above the size limit",
            response.status_code in {400, 413},
            f"got {response.status_code} for {len(huge) / 1024 / 1024:.1f} MB",
        )

        print("\n" + "=" * 60)
        print(f"  passed: {passed}   failed: {failed}")
        if failed:
            print("\n  Failures:")
            for item in failures:
                print(f"   - {item}")
        print("=" * 60 + "\n")

        return 1 if failed else 0

    finally:
        client.close()


if __name__ == "__main__":
    try:
        sys.exit(run())
    except httpx.ConnectError:
        print(f"\nCannot reach {BASE_URL}. Start the service first:  python app.py\n")
        sys.exit(1)