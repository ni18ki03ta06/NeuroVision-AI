import os
import torch
from PIL import Image
from typing import Dict, Any, Tuple
from fastapi import HTTPException

from backend.app.core.config import (
    IMAGE_SIZE, TUMOR_CLASSES, SEVERITY_MAP,
    TUMOR_CLASSIFIER_PATH, SEVERITY_CLASSIFIER_PATH, DEVICE
)
from backend.app.models.classifier import build_tumor_classifier
from backend.app.services.ml_pipeline import predict_with_tta
from backend.app.services.gradcam import get_gradcam_map, overlay_heatmap, pil_to_base64

# Global cache variables for models
_stage1_model = None
_stage2_model = None

def load_cached_models() -> Tuple[Any, Any]:
    """
    Loads both Stage 1 and Stage 2 models once and caches them in memory.
    Raises HTTPException (500) if model checkpoint files are missing.
    """
    global _stage1_model, _stage2_model

    if _stage1_model is not None and _stage2_model is not None:
        return _stage1_model, _stage2_model

    # Validate checkpoint paths
    if not TUMOR_CLASSIFIER_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Stage 1 model file missing at: {TUMOR_CLASSIFIER_PATH}. Ensure weights are in place."
        )
    if not SEVERITY_CLASSIFIER_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Stage 2 model file missing at: {SEVERITY_CLASSIFIER_PATH}. Ensure weights are in place."
        )

    try:
        # Build model architectures
        s1 = build_tumor_classifier(num_classes=4, pretrained=False)
        s2 = build_tumor_classifier(num_classes=6, pretrained=False)

        # Load weights
        s1.load_state_dict(torch.load(TUMOR_CLASSIFIER_PATH, map_location=DEVICE)['model_state'])
        s2.load_state_dict(torch.load(SEVERITY_CLASSIFIER_PATH, map_location=DEVICE)['model_state'])
        
        s1.eval()
        s2.eval()

        _stage1_model = s1
        _stage2_model = s2
        return _stage1_model, _stage2_model

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize PyTorch models or load weights: {str(e)}"
        )

def predict(pil_image: Image.Image, modality: str = "Auto-detect") -> Dict[str, Any]:
    """
    Runs the 2-stage classification pipeline on a PIL Image.
    Returns a dictionary of prediction details matching the API schema requirements.
    """
    # Ensure models are loaded and available
    s1_model, s2_model = load_cached_models()

    try:
        # Step 1: Run Stage 1 Classifier (TTA-augmented)
        s1_probs = predict_with_tta(s1_model, pil_image, IMAGE_SIZE)
        s1_conf = {cls: round(float(s1_probs[i]) * 100, 1) for i, cls in enumerate(TUMOR_CLASSES)}
        pred_type = TUMOR_CLASSES[s1_probs.argmax().item()]
        s1_pct = round(float(s1_probs.max().item()) * 100, 1)

        # Early exit if no tumor is classified
        if pred_type == 'notumor':
            return {
                'tumor_type': 'No Tumor',
                'severity_class': 'Normal',
                'risk_level': 'none',
                'stage1_confidences': s1_conf,
                'stage2_confidences': {k: 0.0 for k in SEVERITY_MAP},
                'stage1_top_pct': s1_pct,
                'description': 'No significant anomaly found. Scan appears within normal range.',
                'modality': modality,
                'pred_type_idx': int(s1_probs.argmax().item())
            }

        # Step 2: Run Stage 2 Classifier (TTA-augmented)
        s2_probs = predict_with_tta(s2_model, pil_image, IMAGE_SIZE)
        sev_classes = list(SEVERITY_MAP.keys())
        s2_conf = {cls: round(float(s2_probs[i]) * 100, 1) for i, cls in enumerate(sev_classes)}
        pred_sev = sev_classes[s2_probs.argmax().item()]
        
        # Extract metadata mappings
        sev_info = SEVERITY_MAP[pred_sev]
        risk_str = sev_info['risk']

        # Determine risk levels
        if '🔴' in risk_str:
            risk_level = 'high'
        elif '🟠' in risk_str:
            risk_level = 'medium'
        elif '🟡' in risk_str:
            risk_level = 'medium'
        else:
            risk_level = 'low'

        return {
            'tumor_type': pred_type.capitalize(),
            'severity_class': sev_info['label'],
            'risk_level': risk_level,
            'stage1_confidences': s1_conf,
            'stage2_confidences': s2_conf,
            'stage1_top_pct': s1_pct,
            'description': f"Scan features match {sev_info['label']} characteristics with {s1_pct}% Stage 1 confidence. {risk_str}",
            'modality': modality,
            'pred_type_idx': int(s1_probs.argmax().item())
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running model prediction pipeline: {str(e)}"
        )

def get_gradcam_base64(
    model: torch.nn.Module, 
    pil_image: Image.Image, 
    class_idx: int, 
    colormap_name: str = 'jet', 
    opacity: float = 1.0
) -> str:
    """
    Computes the GradCAM activation map for a specific class index on an input image,
    applies the chosen colormap, overlays it on the image, and returns the result as a Base64 string.
    """
    try:
        # Generate raw 2D activation matrix
        raw_cam = get_gradcam_map(model, pil_image, class_idx, IMAGE_SIZE)
        
        # Apply colormap overlay
        blended_img = overlay_heatmap(pil_image, raw_cam, opacity=opacity, colormap_name=colormap_name, image_size=IMAGE_SIZE)
        
        # Convert PIL to base64 data URI
        return pil_to_base64(blended_img, format="JPEG")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate GradCAM overlay: {str(e)}"
        )
