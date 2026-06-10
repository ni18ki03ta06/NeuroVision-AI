from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import base64
import os
import tempfile
from backend.app.schemas.report import PDFReportRequest
from backend.app.services.pdf_generator import generate_pdf_report

router = APIRouter()

def cleanup_files(paths: list[str]):
    """
    Background task to delete temporary files after the response finishes streaming.
    """
    for path in paths:
        if path and os.path.exists(path):
            try:
                os.unlink(path)
            except Exception as e:
                print(f"Error removing temp file {path}: {str(e)}")

def decode_base64_to_temp_file(base64_str: str, suffix: str = ".png") -> str:
    """
    Decodes a base64 data URI and saves it to a temporary file, returning its path.
    """
    try:
        if "," in base64_str:
            header, data_str = base64_str.split(",", 1)
        else:
            data_str = base64_str
            
        img_data = base64.b64decode(data_str)
        
        # Write to temporary file
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tmp.write(img_data)
        tmp.close()
        return tmp.name
    except Exception as e:
        raise ValueError(f"Failed to decode base64 image: {str(e)}")

@router.post("/report")
async def create_report(
    payload: PDFReportRequest,
    background_tasks: BackgroundTasks
):
    """
    Generates a PDF case report from predictions and clinician metadata, 
    returning the file as a downloadable binary attachment.
    """
    orig_temp_path = None
    gradcam_temp_path = None
    pdf_path = None
    
    try:
        # Decode and save images to temporary paths for FPDF
        orig_temp_path = decode_base64_to_temp_file(payload.original_image, suffix=".png")
        gradcam_temp_path = decode_base64_to_temp_file(payload.gradcam_heatmap, suffix=".png")
        
        # Compile PDF report
        pdf_path = generate_pdf_report(
            result=payload.result,
            orig_path=orig_temp_path,
            gradcam_path=gradcam_temp_path,
            patient_name=payload.patient_name,
            ref_id=payload.ref_id,
            physician=payload.physician,
            notes=payload.notes,
            signature=payload.signature
        )
        
        # Schedule file cleanup to run after response delivery
        background_tasks.add_task(cleanup_files, [orig_temp_path, gradcam_temp_path, pdf_path])
        
        # Determine download filename
        filename = f"neurovision_{payload.ref_id}.pdf"
        
        return FileResponse(
            path=pdf_path,
            filename=filename,
            media_type="application/pdf"
        )
        
    except Exception as e:
        # Clean up files immediately in case of failure before scheduling background tasks
        cleanup_files([path for path in [orig_temp_path, gradcam_temp_path, pdf_path] if path is not None])
        raise HTTPException(status_code=500, detail=f"PDF report generation failed: {str(e)}")
