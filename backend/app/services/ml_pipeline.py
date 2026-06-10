import torch
from torchvision import transforms
from PIL import Image
from backend.app.core.config import (
    IMAGE_SIZE, TUMOR_CLASSES, SEVERITY_MAP,
    TUMOR_CLASSIFIER_PATH, SEVERITY_CLASSIFIER_PATH
)
from backend.app.models.classifier import build_tumor_classifier

# Global cache to hold loaded models
_loaded_models = {
    "stage1": None,
    "stage2": None
}

def load_models():
    """
    Loads PyTorch models once and caches them in memory.
    """
    global _loaded_models
    if _loaded_models["stage1"] is not None and _loaded_models["stage2"] is not None:
        return _loaded_models["stage1"], _loaded_models["stage2"], None

    s1 = build_tumor_classifier(num_classes=4, pretrained=False)
    s2 = build_tumor_classifier(num_classes=6, pretrained=False)

    if not TUMOR_CLASSIFIER_PATH.exists():
        return None, None, f"Model file not found at {TUMOR_CLASSIFIER_PATH}."
    if not SEVERITY_CLASSIFIER_PATH.exists():
        return s1, None, f"Model file not found at {SEVERITY_CLASSIFIER_PATH}."

    s1.load_state_dict(torch.load(TUMOR_CLASSIFIER_PATH, map_location='cpu')['model_state'])
    s2.load_state_dict(torch.load(SEVERITY_CLASSIFIER_PATH, map_location='cpu')['model_state'])
    
    s1.eval()
    s2.eval()
    
    _loaded_models["stage1"] = s1
    _loaded_models["stage2"] = s2
    return s1, s2, None

def get_tta_transforms(image_size=IMAGE_SIZE):
    """Generates 8 augmented views of the same image for Test Time Augmentation."""
    base = [
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ]
    return [
        transforms.Compose(base),  # original
        transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(p=1.0),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.RandomVerticalFlip(p=1.0),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.RandomRotation(degrees=(10, 10)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.RandomRotation(degrees=(-10, -10)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ColorJitter(brightness=0.2),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ColorJitter(contrast=0.2),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        transforms.Compose([
            transforms.Resize((int(image_size * 1.1), int(image_size * 1.1))),
            transforms.CenterCrop(image_size),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    ]

def predict_with_tta(model, pil_image, image_size=IMAGE_SIZE):
    """Run TTA and return averaged softmax probabilities."""
    tta_transforms = get_tta_transforms(image_size)
    all_probs = []
    device = next(model.parameters()).device
    
    with torch.no_grad():
        for t in tta_transforms:
            tensor = t(pil_image).unsqueeze(0).to(device)
            probs = torch.softmax(model(tensor), dim=1)[0]
            all_probs.append(probs.cpu())
            
    # Average all predictions
    return torch.stack(all_probs).mean(dim=0)

def run_pipeline(pil_image, stage1_model, stage2_model, modality='Auto-detect'):
    """Runs the 2-stage classification pipeline on an input MRI."""
    s1_probs = predict_with_tta(stage1_model, pil_image, IMAGE_SIZE)

    s1_conf = {cls: round(float(s1_probs[i]) * 100, 1)
               for i, cls in enumerate(TUMOR_CLASSES)}
    pred_type = TUMOR_CLASSES[s1_probs.argmax().item()]
    s1_pct = round(float(s1_probs.max().item()) * 100, 1)

    if pred_type == 'notumor':
        return {
            'tumor_type': 'No Tumor',
            'severity_class': 'Normal',
            'risk_level': 'none',
            'risk_label': 'No tumor detected',
            'description': 'No significant anomaly found. Scan appears within normal range.',
            'stage1_confidences': s1_conf,
            'stage2_confidences': {k: 0.0 for k in SEVERITY_MAP},
            'stage1_top_pct': s1_pct,
            'modality': modality,
            'pred_type_idx': int(s1_probs.argmax().item()),
        }

    s2_probs = predict_with_tta(stage2_model, pil_image, IMAGE_SIZE)

    sev_classes = list(SEVERITY_MAP.keys())
    s2_conf = {cls: round(float(s2_probs[i]) * 100, 1)
               for i, cls in enumerate(sev_classes)}
    pred_sev = sev_classes[s2_probs.argmax().item()]
    sev_info = SEVERITY_MAP[pred_sev]
    risk_str = sev_info['risk']

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
        'risk_label': risk_str,
        'description': (f"Scan features match {sev_info['label']} "
                        f"characteristics with {s1_pct}% Stage 1 confidence. "
                        f"{risk_str}"),
        'stage1_confidences': s1_conf,
        'stage2_confidences': s2_conf,
        'stage1_top_pct': s1_pct,
        'modality': modality,
        'pred_type_idx': int(s1_probs.argmax().item()),
    }
