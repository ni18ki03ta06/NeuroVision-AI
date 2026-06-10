from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from PIL import Image
import io
from backend.app.schemas.predict import PredictionResponse
from backend.app.services.ml_pipeline import load_models, run_pipeline
from backend.app.services.gradcam import get_gradcam_map, overlay_heatmap, pil_to_base64

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)
async def predict_mri(
    file: UploadFile = File(...),
    modality: str = Form("Auto-detect")
):
    """
    Uploads an MRI scan, runs the 2-stage tumor classification, and pre-renders 
    GradCAM heatmaps for multiple colormaps returned as base64 URIs.
    """
    # Verify file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        # Read uploaded image bytes
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse image file: {str(e)}")

    # Load PyTorch models
    stage1_model, stage2_model, model_error = load_models()
    if model_error:
        raise HTTPException(status_code=500, detail=model_error)

    try:
        # Run classification pipeline
        result = run_pipeline(pil_image, stage1_model, stage2_model, modality)
        
        # Extract GradCAM activation heatmap
        raw_cam = get_gradcam_map(stage1_model, pil_image, result['pred_type_idx'])
        
        # Pre-render the resized original image (224x224) to base64
        resized_orig = pil_image.resize((224, 224))
        original_base64 = pil_to_base64(resized_orig, format="JPEG")
        
        # Pre-render pure colormapped heatmaps (opacity=1.0) for instant switching
        colormaps = ['jet', 'hot', 'viridis', 'plasma', 'inferno', 'magma']
        heatmap_base64_dict = {}
        for cm in colormaps:
            colored_heatmap = overlay_heatmap(pil_image, raw_cam, opacity=1.0, colormap_name=cm)
            heatmap_base64_dict[cm] = pil_to_base64(colored_heatmap, format="JPEG")

        # Return combined result
        return {
            'tumor_type': result['tumor_type'],
            'severity_class': result['severity_class'],
            'risk_level': result['risk_level'],
            'risk_label': result['risk_label'],
            'description': result['description'],
            'stage1_confidences': result['stage1_confidences'],
            'stage2_confidences': result['stage2_confidences'],
            'stage1_top_pct': result['stage1_top_pct'],
            'modality': result['modality'],
            'pred_type_idx': result['pred_type_idx'],
            'original_image': original_base64,
            # We map gradcam_heatmap to the default jet to conform to the schema, 
            # and we will return the dictionary in a custom schema or expand schema.
            # Let's return the default jet in gradcam_heatmap, and we can also add the full dict to the schema!
            # Wait, let's update the schema to include the full dict so the React client gets all colormaps.
            'gradcam_heatmap': heatmap_base64_dict['jet'],
            'heatmaps': heatmap_base64_dict  # Let's make sure our schema matches. We should update the schema to include heatmaps.
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference pipeline failed: {str(e)}")
