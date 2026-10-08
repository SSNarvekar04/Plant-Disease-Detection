"""Prepares the image dataset before training.

Turns a flat folder of images into the ``dataset/train`` and ``dataset/validation``
tree that Keras expects::

    dataset/
      train/
        Apple___Apple_scab/*.jpg
        Apple___healthy/*.jpg
        ...
      validation/
        Apple___Apple_scab/*.jpg
        ...

Every sub-folder name must be one of the class names in ``classes.py``; folders
that do not match are reported and skipped so a mis-named download cannot
silently poison the label mapping.

Run with
    python prepare_dataset.py --source "C:/path/to/PlantVillage" --val-split 0.2
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from classes import CLASS_NAMES
from console import setup_console

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp"}
DEFAULT_DATASET_DIR = Path(__file__).parent / "dataset"


def collect_class_folders(source: Path) -> dict:
    """Maps each known class to the list of images found for it.

    Handles both layouts produced by the common PlantVillage downloads:

      * one flat folder containing the class folders  (source/Apple___Apple_scab/*.jpg)
      * a ``color``/``grayscale`` split                (source/color/Apple___Apple_scab/*.jpg)

    :raises SystemExit: when a known class folder is missing entirely
    """
    # Search one level deep as well, so `source/color/...` is found automatically.
    search_roots = [source] + [child for child in source.iterdir() if child.is_dir()] if source.is_dir() else []

    folders: dict = {}
    missing: list = []

    for class_name in CLASS_NAMES:
        matches = [
            root / class_name
            for root in search_roots
            if (root / class_name).is_dir()
        ]
        if not matches:
            missing.append(class_name)
            continue

        images: list = []
        for folder in matches:
            images.extend(sorted(p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXTENSIONS))
        folders[class_name] = images

    if missing:
        print(f"ERROR: {len(missing)} of {len(CLASS_NAMES)} class folders were not found under '{source}':")
        for name in missing:
            print(f"  - {name}")
        print("\nDownload the PlantVillage dataset (for example 'New Plant Diseases Dataset (Augmented)')")
        print("and pass the folder that contains the class folders, e.g.")
        print('  python prepare_dataset.py --source "C:/datasets/plantvillage/color"')
        raise SystemExit(1)

    return folders


def copy_file(path: Path, destination_dir: Path) -> None:
    """Copies one image, creating the destination folder when needed."""
    destination_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, destination_dir / path.name)


def main() -> None:
    parser = argparse.ArgumentParser(description="Split a flat image folder into train/validation folders.")
    parser.add_argument("--source", required=True, help="Folder containing one sub-folder per class.")
    parser.add_argument("--dataset-dir", default=str(DEFAULT_DATASET_DIR), help="Output folder (default: ./dataset).")
    parser.add_argument("--val-split", type=float, default=0.2, help="Validation share, 0.0 - 0.5 (default: 0.2).")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for the split (default: 42).")
    parser.add_argument("--clean", action="store_true", help="Delete an existing train/validation split first.")
    args = parser.parse_args()

    source = Path(args.source).expanduser()
    dataset_dir = Path(args.dataset_dir).expanduser()

    if not source.is_dir():
        raise SystemExit(f"ERROR: source folder not found: {source}")
    if not 0 < args.val_split < 0.5:
        raise SystemExit("ERROR: --val-split must be between 0 and 0.5")

    train_dir = dataset_dir / "train"
    val_dir = dataset_dir / "validation"

    if args.clean:
        for folder in (train_dir, val_dir):
            if folder.exists():
                shutil.rmtree(folder)
                print(f"removed {folder}")

    import random

    random.seed(args.seed)

    folders = collect_class_folders(source)
    total_images = sum(len(images) for images in folders.values())
    total_train = total_val = 0

    print(f"\nFound {total_images} images across {len(folders)} classes in '{source}'\n")

    for class_name, images in folders.items():
        # Shuffle once, then take the first `val_count` for validation.
        shuffled = list(images)
        random.shuffle(shuffled)

        val_count = int(len(shuffled) * args.val_split)
        # Always keep at least one validation and one training image per class.
        if len(shuffled) >= 2:
            val_count = max(1, min(val_count, len(shuffled) - 1))

        val_images = shuffled[:val_count]
        train_images = shuffled[val_count:]

        for image in train_images:
            copy_file(image, train_dir / class_name)
        for image in val_images:
            copy_file(image, val_dir / class_name)

        total_train += len(train_images)
        total_val += len(val_images)
        print(f"  {class_name:<55} train {len(train_images):>5}   val {len(val_images):>5}")

    print(f"\n  train      : {total_train} images -> {train_dir}")
    print(f"  validation : {total_val} images -> {val_dir}")
    print("\nDone. Next step:  python train.py\n")


if __name__ == "__main__":
    setup_console()
    sys.exit(main())