"""Class names used by the model.

The order of this list is the output index order of the network, so it must stay
identical to `backend/services/mlService.js` (`MODEL_CLASSES`) and to the
`mlLabels` values stored in MongoDB by `backend/seed.js`.

These are the standard PlantVillage class names ("Plant___Disease"), which is
what a model trained on the PlantVillage dataset produces.
"""

CLASS_NAMES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Corn___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn___Common_rust",
    "Corn___Northern_Leaf_Blight",
    "Corn___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

NUM_CLASSES = len(CLASS_NAMES)

#: Human friendly split of the class name, e.g. "Tomato___Early_blight".
#: {"plant": "Tomato", "disease": "Early blight"}
def split_class_name(class_name: str) -> dict:
    parts = str(class_name).split("___")
    plant = parts[0] if parts and parts[0] else "Unknown"
    raw_label = parts[1] if len(parts) > 1 and parts[1] else "Unknown"
    disease = " ".join(raw_label.replace("_", " ").split())
    return {"plant": plant, "disease": disease, "class_name": class_name}


#: True when the class name describes a healthy leaf.
def is_healthy_class(class_name: str) -> bool:
    return "healthy" in str(class_name).lower()


#: Pre-computed metadata, indexed the same way as CLASS_NAMES.
CLASS_INFO = [split_class_name(name) for name in CLASS_NAMES]


def class_metadata(class_index: int) -> dict:
    """Safe lookup that never raises for an out-of-range index."""
    if 0 <= class_index < NUM_CLASSES:
        return dict(CLASS_INFO[class_index])
    return {"plant": "Unknown", "disease": "Unknown", "class_name": "Unknown"}