from pydantic import BaseModel
from typing import Dict, Any, Optional

class PDFReportRequest(BaseModel):
    result: Dict[str, Any]
    original_image: str  # Base64 string of original MRI
    gradcam_heatmap: str  # Base64 string of the blended GradCAM map
    patient_name: Optional[str] = "N/A"
    ref_id: Optional[str] = "N/A"
    physician: Optional[str] = "N/A"
    notes: Optional[str] = ""
    signature: Optional[str] = ""

class BatchPDFCaseItem(BaseModel):
    result: Dict[str, Any]
    original_image: str
    gradcam_heatmap: str
    patient_name: Optional[str] = "N/A"
    ref_id: Optional[str] = "N/A"

class BatchPDFReportRequest(BaseModel):
    cases: list[BatchPDFCaseItem]
    physician: Optional[str] = "N/A"
    notes: Optional[str] = ""
    signature: Optional[str] = ""
