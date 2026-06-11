from pydantic import BaseModel
from typing import Dict, Optional

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
    original_image: str  # Base64 string
    gradcam_heatmap: str  # Base64 string (default colormap 'jet')
    heatmaps: Dict[str, str]  # Dictionary of all colormap overlays


class PredictErrorResponse(BaseModel):
    detail: str
