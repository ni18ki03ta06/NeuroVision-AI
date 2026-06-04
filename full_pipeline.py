import torch
from PIL import Image
from pathlib import Path
from src.dataset import get_transforms
from src.model import build_tumor_classifier
from config import *

def preprocess(image_input):
    """
    Preprocess image from file path or PIL Image object.
    """
    if isinstance(image_input, (str, Path)):
        img = Image.open(image_input).convert('RGB')
    elif isinstance(image_input, Image.Image):
        img = image_input.convert('RGB')
    else:
        # Fallback if it is a numpy array (e.g., from gradio interface)
        img = Image.fromarray(image_input).convert('RGB')
        
    transform = get_transforms('val')
    # Returns (1, 3, H, W) tensor
    return transform(img).unsqueeze(0).to(DEVICE)

def load_models():
    """
    Load stage 1 and stage 2 classifiers.
    """
    # Stage 1: Tumor classifier (NUM_CLASSES classes)
    stage1 = build_tumor_classifier(num_classes=NUM_CLASSES, pretrained=False)
    ckpt1 = torch.load(MODELS_DIR / 'tumor_classifier.pth', map_location=DEVICE)
    stage1.load_state_dict(ckpt1['model_state'])
    stage1.eval()

    # Stage 2: Severity classifier (6 classes)
    stage2 = build_tumor_classifier(num_classes=6, pretrained=False)
    ckpt2 = torch.load(MODELS_DIR / 'severity_classifier.pth', map_location=DEVICE)
    stage2.load_state_dict(ckpt2['model_state'])
    stage2.eval()

    return stage1, stage2

def full_pipeline(image_input, stage1_model, stage2_model):
    """
    Run full 2-stage inference on the input image.
    """
    img_tensor = preprocess(image_input)
    
    with torch.no_grad():
        # Stage 1 prediction
        type_outputs = stage1_model(img_tensor)
        type_pred = type_outputs.argmax(dim=1).item()
        tumor_type = TUMOR_CLASSES[type_pred]
        
        # If no tumor detected, exit early
        if tumor_type == 'notumor':
            return {
                'type': 'No Tumor',
                'severity': '—',
                'risk': '✅ No tumor detected'
            }
            
        # Stage 2 prediction
        severity_outputs = stage2_model(img_tensor)
        severity_pred = severity_outputs.argmax(dim=1).item()
        
        # Map indices to severity labels
        # Severity folders are glioma, meningioma, neurocitoma, normal, outros, schwannoma
        severity_classes = ['glioma', 'meningioma', 'neurocitoma', 'normal', 'outros', 'schwannoma']
        severity_cls = severity_classes[severity_pred]
        
        return {
            'type': tumor_type.capitalize(),
            'severity': SEVERITY_MAP[severity_cls]['label'],
            'risk': SEVERITY_MAP[severity_cls]['risk'],
        }
