"""Trains the leaf disease classification CNN.

Pipeline
    1. dataset preparation        (prepare_dataset.py -> dataset/train + validation)
    2. train / validation load    (class folders -> batched image datasets)
    3. data augmentation          (flips, rotations, zoom, contrast)
    4. CNN architecture           (a small custom CNN, or a pretrained backbone)
    5. training                   (Adam, early stopping, checkpoint on best epoch)
    6. evaluation                 (accuracy, per-class report, confusion matrix)
    7. model saving               (models/plant_disease_cnn.keras + labels.json)

Pixel normalisation lives inside the model, so training and inference feed raw
0-255 values through exactly the same path:
    * ``custom``       -> an explicit ``Rescaling(1/255)`` layer
    * ``efficientnet`` -> the Keras application's own ``Rescaling(1/255)``
    * ``resnet50``     -> ImageNet standardisation added explicitly, because that
                         application ships no normalisation layer of its own

Run with
    python train.py                       # full training run
    python train.py --epochs 5            # quick smoke test
    python train.py --model efficientnet  # different backbone

The trained model is picked up automatically by `app.py`, which looks for
``MODEL_PATH`` (default ``models/plant_disease_cnn.keras``).
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import numpy as np

from console import setup_console

BASE_DIR = Path(__file__).parent
DATASET_DIR = BASE_DIR / "dataset"
MODELS_DIR = BASE_DIR / "models"
IMAGE_SIZE = 224
BATCH_SIZE = 32
VALIDATION_SPLIT = 0.2

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")  # quieter TensorFlow logging


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------
def build_datasets(dataset_dir: Path, batch_size: int, validation_split: float, seed: int):
    """Loads train/validation image folders into two tf.data pipelines.

    :raises SystemExit: when the dataset folders are missing or empty
    """
    import tensorflow as tf

    train_dir = dataset_dir / "train"
    val_dir = dataset_dir / "validation"

    if not train_dir.is_dir():
        raise SystemExit(
            f"ERROR: training folder not found: {train_dir}\n"
            "Run  python prepare_dataset.py --source \"<your dataset folder>\"  first."
        )

    common = dict(
        batch_size=batch_size,
        image_size=(IMAGE_SIZE, IMAGE_SIZE),
        label_mode="categorical",
        class_names=sorted(entry.name for entry in train_dir.iterdir() if entry.is_dir()),
    )

    train_ds = tf.keras.utils.image_dataset_from_directory(train_dir, shuffle=True, seed=seed, **common)
    val_source = val_dir if val_dir.is_dir() else train_dir
    val_ds = tf.keras.utils.image_dataset_from_directory(val_source, shuffle=False, **common)

    train_ds = train_ds.cache()
    val_ds = val_ds.cache()

    train_ds = train_ds.prefetch(tf.data.AUTOTUNE)
    val_ds = val_ds.prefetch(tf.data.AUTOTUNE)

    return train_ds, val_ds, common["class_names"]


def augmentation_layers() -> "keras.Sequential":
    """Mild augmentation. Kept deliberately gentle: leaf colour is the signal,
    so aggressive colour jitter would destroy the most useful feature."""
    from tensorflow.keras import layers

    return layers.Sequential(
        [
            layers.RandomFlip("horizontal"),
            layers.RandomRotation(0.15),
            layers.RandomZoom(0.1),
            layers.RandomContrast(0.1),
        ],
        name="augmentation",
    )


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
def build_model(
    model_name: str,
    num_classes: int,
    use_augmentation: bool = True,
    freeze_backbone: bool = True,
):
    """Creates the CNN used for classification.

    ``custom`` is a small CNN that trains from scratch and is the default, so the
    project stays runnable on modest hardware. ``resnet50`` and ``efficientnet``
    reuse the pretrained ImageNet backbone (transfer learning).

    Normalisation is part of the graph in every case (see ``preprocess_for_backbone``),
    so the caller always passes raw 0-255 pixels. That keeps training and inference
    identical and makes the saved model self-contained.

    :param freeze_backbone: with transfer learning the backbone is frozen and only
        the new classification head is trained. Pass ``False`` (or use
        ``--unfreeze-backbone``) to fine-tune the whole network.
    """
    import tensorflow as tf
    from tensorflow.keras import layers, models

    inputs = layers.Input(shape=(IMAGE_SIZE, IMAGE_SIZE, 3))

    if model_name == "custom":
        x = layers.Rescaling(1.0 / 255.0)(inputs)
        if use_augmentation:
            x = augmentation_layers()(x)

        x = conv_block(x, 32, 3)
        x = conv_block(x, 64, 3, pool=True)
        x = conv_block(x, 128, 3, pool=True)
        x = conv_block(x, 256, 3, pool=True)
        x = layers.Dropout(0.3)(x)
        x = layers.GlobalAveragePooling2D()(x)
        outputs = layers.Dense(num_classes, activation="softmax")(x)
        model = models.Model(inputs, outputs, name="plant_disease_cnn")
    else:
        # Augmentation runs on the raw pixels because it is range independent, then
        # the backbone-specific normalisation is applied before the convolution
        # stack that expects it.
        x = augmentation_layers()(inputs) if use_augmentation else inputs
        x = preprocess_for_backbone(model_name)(x)
        x = build_transfer_backbone(model_name, input_tensor=x, freeze=freeze_backbone)
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(128, activation="relu")(x)
        outputs = layers.Dense(num_classes, activation="softmax")(x)
        model = models.Model(inputs, outputs, name=f"plant_disease_{model_name}")

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def preprocess_for_backbone(model_name: str):
    """Returns the layer that adapts raw 0-255 input to the backbone's convention.

    The two pretrained applications disagree, which is easy to get wrong:

    * ``EfficientNetV2B0`` contains ``Rescaling(1/255)`` as its own first layer,
      so it wants raw pixels and must **not** be scaled again here.
    * ``ResNet50`` has no normalisation layer; its ImageNet weights expect the
      standard preprocessed range, so scale to [0, 1] and standardise per channel.

    :param model_name: ``resnet50`` or ``efficientnet``
    """
    from tensorflow.keras import layers

    if model_name == "resnet50":
        return layers.Sequential(
            [
                layers.Rescaling(1.0 / 255.0),
                layers.Normalization(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
            ],
            name="resnet50_normalisation",
        )

    return layers.Identity(name="efficientnet_input")


def conv_block(x, filters: int, kernel: int = 3, pool: bool = False):
    """Conv -> ReLU -> Conv -> ReLU (optionally MaxPool)."""
    from tensorflow.keras import layers

    x = layers.Conv2D(filters, kernel, padding="same", activation="relu")(x)
    x = layers.Conv2D(filters, kernel, padding="same", activation="relu")(x)
    if pool:
        x = layers.MaxPooling2D()(x)
    return x


def build_transfer_backbone(model_name: str, input_tensor, freeze: bool = True):
    """Pretrained ImageNet backbone, wired onto an existing input tensor.

    :param model_name: ``resnet50`` or ``efficientnet``
    :param input_tensor: the (already normalised) Keras tensor to consume
    :param freeze: keep the pretrained weights fixed and train only the new head
    """
    from tensorflow.keras.applications import EfficientNetV2B0, ResNet50

    weights = "imagenet"  # downloads ~20-100 MB on first use

    if model_name == "resnet50":
        base = ResNet50(include_top=False, weights=weights, input_tensor=input_tensor)
    else:
        base = EfficientNetV2B0(include_top=False, weights=weights, input_tensor=input_tensor)

    base.trainable = not freeze

    return base.output


# ---------------------------------------------------------------------------
# Training + evaluation
# ---------------------------------------------------------------------------
def train(args) -> dict:
    import tensorflow as tf

    train_ds, val_ds, class_names = build_datasets(
        Path(args.dataset_dir), args.batch_size, args.validation_split, args.seed
    )
    num_classes = len(class_names)

    print(f"\n{'=' * 62}")
    print(f"  Classes       : {num_classes}")
    print(f"  Architecture  : {args.model}")
    if args.model != "custom":
        print(f"  Backbone      : {'fine-tuned' if args.unfreeze_backbone else 'frozen (head only)'}")
    print(f"  Image size    : {IMAGE_SIZE}x{IMAGE_SIZE}")
    print(f"  Batch size    : {args.batch_size}")
    print(f"  Max epochs    : {args.epochs}")
    print(f"{'=' * 62}\n")

    model = build_model(
        args.model,
        num_classes,
        use_augmentation=not args.no_augmentation,
        freeze_backbone=not args.unfreeze_backbone,
    )
    model.summary(print_fn=print)

    checkpoints_dir = MODELS_DIR / "checkpoints"
    checkpoints_dir.mkdir(parents=True, exist_ok=True)

    callbacks = [
        # Stop when validation accuracy has not improved for 4 epochs.
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=args.patience,
            restore_best_weights=True,
            verbose=1,
            mode="max",
        ),
        # Always keep the best weights, so the saved model is the best one.
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(checkpoints_dir / "best.weights.h5"),
            monitor="val_accuracy",
            save_best_only=True,
            save_weights_only=True,
            verbose=1,
            mode="max",
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6, verbose=1
        ),
    ]

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        callbacks=callbacks,
    )

    evaluation = evaluate(model, val_ds, class_names)
    model_path = save_model(model, class_names)

    plot_history(history, args.plot)

    return {"history": history.history, "evaluation": evaluation, "model_path": str(model_path)}


def evaluate(model, val_ds, class_names) -> dict:
    """Validation loss/accuracy plus a per-class breakdown."""
    from sklearn.metrics import classification_report, confusion_matrix

    print("\nEvaluation on the validation set\n")
    loss, accuracy = model.evaluate(val_ds, verbose=0)
    print(f"  validation loss     : {loss:.4f}")
    print(f"  validation accuracy : {accuracy * 100:.2f}%")

    # The dataset yields (images, labels); only the labels are needed for scoring.
    y_true = np.concatenate([labels.numpy() for _images, labels in val_ds], axis=0)
    # Probabilities from the model, not the input pixels: `predict` returns one
    # row of class probabilities per image.
    y_pred = model.predict(val_ds, verbose=0)

    y_true_labels = np.argmax(y_true, axis=1)
    y_pred_labels = np.argmax(y_pred, axis=1)

    # Only the classes actually present in the validation split can be labelled,
    # otherwise scikit-learn warns about missing targets.
    present = sorted(set(y_true_labels.tolist()) | set(y_pred_labels.tolist()))
    target_names = [class_names[index] for index in present]

    report = classification_report(
        y_true_labels,
        y_pred_labels,
        labels=present,
        target_names=target_names,
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(y_true_labels, y_pred_labels, labels=present)

    per_class = [
        {
            "class_name": name,
            "accuracy": round(float(report.get(name, {}).get("recall", 0.0)) * 100, 2),
            "support": int(report.get(name, {}).get("support", 0)),
        }
        for name in target_names
        if name in report
    ]
    # Highlight the classes that need more attention.
    weakest = sorted(per_class, key=lambda item: item["accuracy"])[:5]

    print("\n  Weakest classes (lowest recall):")
    for item in weakest:
        print(f"    {item['class_name']:<55} {item['accuracy']:>6.2f}%  ({item['support']} images)")

    return {
        "validation_loss": round(float(loss), 4),
        "validation_accuracy": round(float(accuracy) * 100, 2),
        "per_class": per_class,
        "confusion_matrix": matrix.tolist(),
    }


def save_model(model, class_names) -> Path:
    """Saves the model and a sidecar JSON with its class list."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODELS_DIR / "plant_disease_cnn.keras"

    model.save(model_path)
    print(f"\nModel saved to {model_path}")

    labels_path = MODELS_DIR / "labels.json"
    labels_path.write_text(json.dumps(class_names, indent=2), encoding="utf-8")
    print(f"Class labels saved to {labels_path}")

    return model_path


def plot_history(history, output_path: Path) -> None:
    """Writes the accuracy/loss curves to a PNG (skipped if matplotlib is absent)."""
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib is not installed, skipping the training chart (pip install matplotlib)")
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)
    metrics = history.history

    figure, axes = plt.subplots(1, 2, figsize=(13, 5))
    axes[0].plot(metrics["accuracy"], label="train")
    axes[0].plot(metrics["val_accuracy"], label="validation")
    axes[0].set_title("Accuracy")
    axes[0].set_xlabel("epoch")
    axes[0].legend()

    axes[1].plot(metrics["loss"], label="train")
    axes[1].plot(metrics["val_loss"], label="validation")
    axes[1].set_title("Loss")
    axes[1].set_xlabel("epoch")
    axes[1].legend()

    figure.tight_layout()
    figure.savefig(output_path, dpi=120)
    plt.close(figure)
    print(f"Training chart saved to {output_path}")


# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(description="Train the plant disease classification CNN.")
    parser.add_argument("--dataset-dir", default=str(DATASET_DIR), help="Dataset folder (default: ./dataset).")
    parser.add_argument("--model", choices=["custom", "resnet50", "efficientnet"], default="custom")
    parser.add_argument("--epochs", type=int, default=25)
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    parser.add_argument("--patience", type=int, default=4, help="Early-stopping patience in epochs.")
    parser.add_argument("--validation-split", type=float, default=VALIDATION_SPLIT)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--no-augmentation", action="store_true", help="Disable data augmentation.")
    parser.add_argument(
        "--unfreeze-backbone",
        action="store_true",
        help="Fine-tune the whole pretrained network instead of training only the new head.",
    )
    parser.add_argument("--plot", default=str(MODELS_DIR / "training_history.png"), help="Chart output path.")
    args = parser.parse_args()

    train(args)

    print("\nTraining finished. Start the ML service with:  python app.py\n")


if __name__ == "__main__":
    setup_console()
    main()