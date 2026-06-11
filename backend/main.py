import io
import base64
import os
import tempfile
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional

# Ensure that the flat backend directory is prioritized on the python system path
sys.path.insert(0, str(Path(__file__).resolve().parent))

# ── Import local configurations ─────────────────────────────
# Loads local environment configurations from config.py and .env
import config

# ── Pydantic Schemas ──────────────────────────────────────────
class PredictionResponse(BaseModel):
    id: Optional[int] = None
    tumor_type: str
    severity_class: str
    risk_level: str
    risk_label: str
    description: str
    stage1_confidences: Dict[str, float]
    stage2_confidences: Dict[str, float]
    stage1_top_pct: float
    modality: str
    pred_type_idx: int
    original_image: str       # Base64 string
    gradcam_heatmap: str      # Base64 string
    heatmaps: Dict[str, str]  # Colormap dictionary

class PDFReportRequest(BaseModel):
    result: Dict
    original_image: str
    gradcam_heatmap: str
    patient_name: str
    ref_id: str
    physician: str
    notes: str
    signature: str

class BatchPDFCaseItem(BaseModel):
    result: Dict
    original_image: str
    gradcam_heatmap: str
    patient_name: str
    ref_id: str

class BatchPDFReportRequest(BaseModel):
    cases: List[BatchPDFCaseItem]
    physician: str
    notes: str
    signature: str

# ── Lifespan Context ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load PyTorch models into cache memory on startup
    print("Initializing NeuroVision PyTorch models from local backend weights...")
    try:
        from src.pipeline import load_models
        s1, s2, err = load_models()
        if err:
            print(f"Error pre-loading models: {err}")
        else:
            print("NeuroVision models loaded successfully and cached.")
    except Exception as e:
        print(f"Failed to pre-load models during startup: {str(e)}")
    
    # Initialize SQLite database
    print("Initializing SQLite database...")
    try:
        import database
        database.init_db()
        print("SQLite database initialized successfully.")
    except Exception as e:
        print(f"Failed to initialize SQLite database: {str(e)}")
        
    yield
    print("Shutting down NeuroVision API...")

# Initialize FastAPI app
app = FastAPI(
    title="NeuroVision AI — Flat Backend API",
    description="Flat FastAPI structure importing from original PyTorch codebase.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configurations
allowed_origins_str = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173')
CORS_ORIGINS = [origin.strip() for origin in allowed_origins_str.split(',') if origin.strip()]
for fallback in ["http://localhost:5173", "http://127.0.0.1:5173", "*"]:
    if fallback not in CORS_ORIGINS:
        CORS_ORIGINS.append(fallback)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function for PDF background cleanup
def cleanup_files(paths: List[str]):
    for path in paths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                print(f"Error deleting temporary file {path}: {str(e)}")

# ── API Routes ────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "service": "NeuroVision AI Flat Backend Service",
        "device": str(config.DEVICE)
    }

@app.get("/api/models/info")
async def model_info():
    return {
        "architecture": "EfficientNet-B2 (Two-Stage Classifier Pipeline)",
        "input_shape": [3, config.IMAGE_SIZE, config.IMAGE_SIZE],
        "classes": {
            "stage1": config.TUMOR_CLASSES,
            "stage2": list(config.SEVERITY_FOLDERS.keys())
        },
        "stage1_parameters": 9225844,
        "stage2_parameters": 9225844
    }

@app.get("/api/performance-metrics")
async def performance_metrics():
    # Return verification telemetry mockup for the results console charts
    return {
        "overall": {
            "accuracy": 0.965,
            "precision": 0.952,
            "recall": 0.948,
            "f1_score": 0.950
        },
        "model_info": {
            "architecture": "EfficientNet-B2 Classifier",
            "total_params": 9225844,
            "train_dataset_size": 2500,
            "test_dataset_size": 625,
            "training_time": "3h 42m",
            "hardware": "NVIDIA RTX 3080 GPU"
        },
        "labels": ["Glioma", "Meningioma", "No Tumor", "Pituitary"],
        "confusion_matrix": [
            [142, 5, 3, 0],
            [6, 131, 8, 2],
            [1, 4, 155, 0],
            [0, 2, 1, 165]
        ],
        "class_wise": [
            {"name": "Glioma", "precision": 0.953, "recall": 0.947, "f1": 0.950, "accuracy": 0.947, "samples": 150},
            {"name": "Meningioma", "precision": 0.923, "recall": 0.891, "f1": 0.907, "accuracy": 0.891, "samples": 147},
            {"name": "No Tumor", "precision": 0.928, "recall": 0.969, "f1": 0.948, "accuracy": 0.969, "samples": 160},
            {"name": "Pituitary", "precision": 0.988, "recall": 0.982, "f1": 0.985, "accuracy": 0.982, "samples": 168}
        ],
        "training_history": [
            {"epoch": 1, "loss": 1.25, "val_loss": 1.10, "acc": 0.62, "val_acc": 0.68},
            {"epoch": 3, "loss": 0.85, "val_loss": 0.72, "acc": 0.76, "val_acc": 0.81},
            {"epoch": 5, "loss": 0.52, "val_loss": 0.44, "acc": 0.85, "val_acc": 0.88},
            {"epoch": 7, "loss": 0.31, "val_loss": 0.28, "acc": 0.91, "val_acc": 0.92},
            {"epoch": 9, "loss": 0.20, "val_loss": 0.19, "acc": 0.94, "val_acc": 0.94},
            {"epoch": 11, "loss": 0.14, "val_loss": 0.15, "acc": 0.96, "val_acc": 0.95},
            {"epoch": 13, "loss": 0.10, "val_loss": 0.12, "acc": 0.97, "val_acc": 0.96},
            {"epoch": 15, "loss": 0.08, "val_loss": 0.11, "acc": 0.98, "val_acc": 0.965}
        ],
        "roc_curves": [
            {"fpr": 0.0, "glioma": 0.0, "meningioma": 0.0, "notumor": 0.0, "pituitary": 0.0},
            {"fpr": 0.05, "glioma": 0.75, "meningioma": 0.68, "notumor": 0.92, "pituitary": 0.88},
            {"fpr": 0.1, "glioma": 0.88, "meningioma": 0.82, "notumor": 0.97, "pituitary": 0.95},
            {"fpr": 0.2, "glioma": 0.94, "meningioma": 0.91, "notumor": 0.99, "pituitary": 0.98},
            {"fpr": 0.5, "glioma": 0.98, "meningioma": 0.97, "notumor": 1.0, "pituitary": 1.0},
            {"fpr": 1.0, "glioma": 1.0, "meningioma": 1.0, "notumor": 1.0, "pituitary": 1.0}
        ],
        "data_distribution": [
            {"name": "Glioma", "value": 600},
            {"name": "Meningioma", "value": 580},
            {"name": "No Tumor", "value": 650},
            {"name": "Pituitary", "value": 670}
        ],
        "confidence_histogram": [
            {"range": "0-10%", "count": 2},
            {"range": "10-20%", "count": 5},
            {"range": "20-30%", "count": 12},
            {"range": "30-40%", "count": 15},
            {"range": "40-50%", "count": 24},
            {"range": "50-60%", "count": 38},
            {"range": "60-70%", "count": 62},
            {"range": "70-80%", "count": 112},
            {"range": "80-90%", "count": 185},
            {"range": "90-100%", "count": 170}
        ]
    }

@app.post("/api/predict", response_model=PredictionResponse)
async def predict_mri(
    file: UploadFile = File(...),
    modality: str = Form("Auto-detect")
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse image file: {str(e)}")

    # Lazy-load/fetch cached models from pipeline
    from src.pipeline import load_models, run_pipeline
    s1, s2, err = load_models()
    if err:
        raise HTTPException(status_code=500, detail=f"Classifier models loading failure: {err}")

    try:
        # Run inference pipeline
        result = run_pipeline(pil_image, s1, s2, modality)
        
        # Generate GradCAM heatmap activations
        from src.gradcam import get_gradcam_map, overlay_heatmap
        pred_type_idx = result['pred_type_idx']
        raw_cam = get_gradcam_map(s1, pil_image, pred_type_idx)
        
        # Resized original slice to base64
        resized_orig = pil_image.resize((config.IMAGE_SIZE, config.IMAGE_SIZE))
        buffered = io.BytesIO()
        resized_orig.save(buffered, format="JPEG")
        original_base64 = "data:image/jpeg;base64," + base64.b64encode(buffered.getvalue()).decode()
        
        # Pre-render colormap activations (opacity=1.0)
        colormaps = ['jet', 'hot', 'viridis', 'plasma', 'inferno', 'magma']
        heatmap_base64_dict = {}
        for cm in colormaps:
            colored_heatmap = overlay_heatmap(pil_image, raw_cam, opacity=1.0, colormap_name=cm)
            buffered_cm = io.BytesIO()
            colored_heatmap.save(buffered_cm, format="JPEG")
            heatmap_base64_dict[cm] = "data:image/jpeg;base64," + base64.b64encode(buffered_cm.getvalue()).decode()

        # Prepare database record payload
        pred_record = {
            'patient_name': "Pending / Anonymous",
            'ref_id': f"REF-{os.urandom(4).hex().upper()}",
            'modality': result['modality'],
            'tumor_type': result['tumor_type'],
            'severity_class': result['severity_class'],
            'risk_level': result['risk_level'],
            'risk_label': result['risk_label'],
            'description': result['description'],
            'stage1_top_pct': result['stage1_top_pct'],
            'original_image': original_base64,
            'gradcam_heatmap': heatmap_base64_dict['jet'],
            'stage1_confidences': result['stage1_confidences'],
            'stage2_confidences': result['stage2_confidences']
        }
        
        db_id = None
        try:
            import database
            db_id = database.save_prediction(pred_record)
        except Exception as db_err:
            print(f"Warning: Failed to save prediction to SQLite database: {str(db_err)}")

        return {
            'id': db_id,
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
            'gradcam_heatmap': heatmap_base64_dict['jet'],
            'heatmaps': heatmap_base64_dict
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference pipeline execution error: {str(e)}")

@app.post("/api/predict/batch", response_model=List[PredictionResponse])
async def predict_mri_batch(
    files: List[UploadFile] = File(...),
    modality: str = Form("Auto-detect")
):
    """Processes multiple MRI image scans sequentially for 2-stage classification and GradCAM overlays."""
    results = []
    for file in files:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a valid image.")

        try:
            contents = await file.read()
            pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse image file {file.filename}: {str(e)}")

        # Lazy-load/fetch cached models from pipeline
        from src.pipeline import load_models, run_pipeline
        s1, s2, err = load_models()
        if err:
            raise HTTPException(status_code=500, detail=f"Classifier models loading failure: {err}")

        try:
            # Run inference pipeline
            result = run_pipeline(pil_image, s1, s2, modality)
            
            # Generate GradCAM heatmap activations
            from src.gradcam import get_gradcam_map, overlay_heatmap
            pred_type_idx = result['pred_type_idx']
            raw_cam = get_gradcam_map(s1, pil_image, pred_type_idx)
            
            # Resized original slice to base64
            resized_orig = pil_image.resize((config.IMAGE_SIZE, config.IMAGE_SIZE))
            buffered = io.BytesIO()
            resized_orig.save(buffered, format="JPEG")
            original_base64 = "data:image/jpeg;base64," + base64.b64encode(buffered.getvalue()).decode()
            
            # Pre-render colormap activations (opacity=1.0)
            colormaps = ['jet', 'hot', 'viridis', 'plasma', 'inferno', 'magma']
            heatmap_base64_dict = {}
            for cm in colormaps:
                colored_heatmap = overlay_heatmap(pil_image, raw_cam, opacity=1.0, colormap_name=cm)
                buffered_cm = io.BytesIO()
                colored_heatmap.save(buffered_cm, format="JPEG")
                heatmap_base64_dict[cm] = "data:image/jpeg;base64," + base64.b64encode(buffered_cm.getvalue()).decode()

            # Prepare database record payload
            pred_record = {
                'patient_name': f"Batch Scan: {file.filename}",
                'ref_id': f"REF-{os.urandom(4).hex().upper()}",
                'modality': result['modality'],
                'tumor_type': result['tumor_type'],
                'severity_class': result['severity_class'],
                'risk_level': result['risk_level'],
                'risk_label': result['risk_label'],
                'description': result['description'],
                'stage1_top_pct': result['stage1_top_pct'],
                'original_image': original_base64,
                'gradcam_heatmap': heatmap_base64_dict['jet'],
                'stage1_confidences': result['stage1_confidences'],
                'stage2_confidences': result['stage2_confidences']
            }
            
            db_id = None
            try:
                import database
                db_id = database.save_prediction(pred_record)
            except Exception as db_err:
                print(f"Warning: Failed to save batch prediction to SQLite: {str(db_err)}")

            results.append({
                'id': db_id,
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
                'gradcam_heatmap': heatmap_base64_dict['jet'],
                'heatmaps': heatmap_base64_dict
            })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Inference error on {file.filename}: {str(e)}")

    return results

@app.get("/api/history")
async def get_history():
    """Retrieves list of all past MRI scan predictions."""
    try:
        import database
        return database.get_predictions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")

@app.delete("/api/history/{id}")
async def delete_history_item(id: int):
    """Deletes a specific past MRI scan prediction from history."""
    try:
        import database
        success = database.delete_prediction(id)
        if not success:
            raise HTTPException(status_code=404, detail="Prediction record not found.")
        return {"status": "success", "message": f"Record {id} deleted successfully."}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete record: {str(e)}")


@app.post("/api/generate-pdf")
async def generate_pdf(
    request: PDFReportRequest,
    background_tasks: BackgroundTasks
):
    try:
        # Decode original image
        orig_data = request.original_image.split(",")[1] if "," in request.original_image else request.original_image
        orig_bytes = base64.b64decode(orig_data)
        orig_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        orig_file.write(orig_bytes)
        orig_file.close()

        # Decode heatmap image
        heat_data = request.gradcam_heatmap.split(",")[1] if "," in request.gradcam_heatmap else request.gradcam_heatmap
        heat_bytes = base64.b64decode(heat_data)
        heat_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        heat_file.write(heat_bytes)
        heat_file.close()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to base64 decode report image assets: {str(e)}")

    try:
        # Run pdf generator
        from src.report import generate_pdf_report
        pdf_path = generate_pdf_report(
            result=request.result,
            orig_path=orig_file.name,
            gradcam_path=heat_file.name,
            patient_name=request.patient_name,
            ref_id=request.ref_id,
            physician=request.physician,
            notes=request.notes,
            signature=request.signature
        )

        # Enqueue background cleanups
        background_tasks.add_task(cleanup_files, [orig_file.name, heat_file.name, pdf_path])

        return FileResponse(
            pdf_path, 
            media_type="application/pdf", 
            filename=f"neurovision_report_{request.ref_id}.pdf"
        )
    except Exception as e:
        cleanup_files([orig_file.name, heat_file.name])
        raise HTTPException(status_code=500, detail=f"PDF compilation failed: {str(e)}")

@app.post("/api/generate-pdf/batch")
async def generate_pdf_batch(
    request: BatchPDFReportRequest,
    background_tasks: BackgroundTasks
):
    """Compiles multiple MRI scans and predictions into a single multi-page PDF report."""
    temp_files = []
    cases_payloads = []
    
    try:
        # Loop and decode all case images
        for case in request.cases:
            # Decode original image
            orig_data = case.original_image.split(",")[1] if "," in case.original_image else case.original_image
            orig_bytes = base64.b64decode(orig_data)
            orig_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            orig_file.write(orig_bytes)
            orig_file.close()
            temp_files.append(orig_file.name)

            # Decode heatmap image
            heat_data = case.gradcam_heatmap.split(",")[1] if "," in case.gradcam_heatmap else case.gradcam_heatmap
            heat_bytes = base64.b64decode(heat_data)
            heat_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            heat_file.write(heat_bytes)
            heat_file.close()
            temp_files.append(heat_file.name)

            cases_payloads.append({
                'result': case.result,
                'patient_name': case.patient_name,
                'ref_id': case.ref_id,
                'orig_path': orig_file.name,
                'gradcam_path': heat_file.name
            })
    except Exception as e:
        cleanup_files(temp_files)
        raise HTTPException(status_code=400, detail=f"Failed to decode batch report image assets: {str(e)}")

    try:
        # Run batch PDF generator
        from src.report import generate_batch_pdf_report
        pdf_path = generate_batch_pdf_report(
            cases=cases_payloads,
            physician=request.physician,
            notes=request.notes,
            signature=request.signature
        )

        # Enqueue background cleanups
        background_tasks.add_task(cleanup_files, temp_files + [pdf_path])

        return FileResponse(
            pdf_path, 
            media_type="application/pdf", 
            filename="neurovision_batch_report.pdf"
        )
    except Exception as e:
        cleanup_files(temp_files)
        raise HTTPException(status_code=500, detail=f"Batch PDF compilation failed: {str(e)}")
