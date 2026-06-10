import os
import tempfile
from datetime import datetime
from fpdf import FPDF
from backend.app.core.config import ROOT_DIR

def generate_pdf_report(result, orig_path=None, gradcam_path=None, patient_name="N/A", ref_id="N/A", physician="N/A", notes="", signature=""):
    """
    Compiles a comprehensive PDF diagnostic report including patient info, classification probabilities, 
    MRI scans, GradCAM overlays, and digital clinician approval signatures.
    """
    pdf = FPDF()
    
    # Try standard package fonts first, fallback to root workspace fonts folder
    try:
        from fpdf.fonts import fpdf2_pkgdir
        font_dir = os.path.join(fpdf2_pkgdir(), 'fonts')
    except ImportError:
        font_dir = str(ROOT_DIR / 'fonts')

    # Register DejaVu Unicode fonts
    pdf.add_font('DejaVu', '', os.path.join(font_dir, 'DejaVuSans.ttf'), uni=True)
    pdf.add_font('DejaVu', 'B', os.path.join(font_dir, 'DejaVuSans-Bold.ttf'), uni=True)
    
    pdf.add_page()

    # Document Header
    pdf.set_font('DejaVu', 'B', 18)
    pdf.cell(0, 10, '🧠 NeuroVision AI — Case Report', ln=True)
    pdf.set_font('DejaVu', '', 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, 'For research use only — not a diagnostic tool', ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)

    # Patient Metadata Table
    pdf.set_font('DejaVu', 'B', 12)
    pdf.cell(0, 8, 'Case & Patient Metadata', ln=True)
    pdf.set_font('DejaVu', '', 9.5)
    pdf.set_fill_color(245, 245, 245)
    
    # Metadata Row 1
    pdf.cell(45, 7, ' Patient Name/ID:', 1, 0, 'L', True)
    pdf.cell(50, 7, f' {patient_name}', 1, 0, 'L')
    pdf.cell(45, 7, ' Case Reference ID:', 1, 0, 'L', True)
    pdf.cell(0, 7, f' {ref_id}', 1, 1, 'L')
    
    # Metadata Row 2
    pdf.cell(45, 7, ' Referring Physician:', 1, 0, 'L', True)
    pdf.cell(50, 7, f' {physician}', 1, 0, 'L')
    pdf.cell(45, 7, ' Scan Modality:', 1, 0, 'L', True)
    pdf.cell(0, 7, f" {result.get('modality', '—')}", 1, 1, 'L')

    # Metadata Row 3
    pdf.cell(45, 7, ' Analysis Date:', 1, 0, 'L', True)
    pdf.cell(50, 7, f" {datetime.now().strftime('%Y-%m-%d %H:%M')}", 1, 0, 'L')
    pdf.cell(45, 7, ' Stage 1 Confidence:', 1, 0, 'L', True)
    pdf.cell(0, 7, f" {result.get('stage1_top_pct', 0.0)}%", 1, 1, 'L')
    
    pdf.ln(4)

    # Clinical Notes
    if notes:
        pdf.set_font('DejaVu', 'B', 12)
        pdf.cell(0, 8, 'Clinical Observations & Notes', ln=True)
        pdf.set_font('DejaVu', '', 9.5)
        pdf.multi_cell(0, 5, f' {notes}', border=1)
        pdf.ln(4)

    # Results Overview
    pdf.set_font('DejaVu', 'B', 13)
    pdf.cell(0, 8, 'Prediction Results Summary', ln=True)
    for label, val in [
        ('Primary Tumor Type', result.get('tumor_type', 'N/A')),
        ('Subclass Severity', result.get('severity_class', 'N/A')),
        ('Assessed Risk Level', result.get('risk_label', 'N/A')),
    ]:
        pdf.set_font('DejaVu', 'B', 10)
        pdf.cell(55, 7, ' ' + label + ':')
        pdf.set_font('DejaVu', '', 10)
        pdf.cell(0, 7, str(val), ln=True)
    pdf.ln(4)

    # Stage 1 Probabilities
    pdf.set_font('DejaVu', 'B', 13)
    pdf.cell(0, 8, 'Stage 1 — Tumor Type Confidence', ln=True)
    pdf.set_font('DejaVu', '', 10)
    for cls, pct in result.get('stage1_confidences', {}).items():
        pdf.cell(60, 6, cls.capitalize() + ':')
        pdf.cell(0, 6, f'{pct:.1f}%', ln=True)
    pdf.ln(4)

    # Stage 2 Probabilities
    pdf.set_font('DejaVu', 'B', 13)
    pdf.cell(0, 8, 'Stage 2 — Severity Class Confidence', ln=True)
    pdf.set_font('DejaVu', '', 10)
    for cls, pct in result.get('stage2_confidences', {}).items():
        pdf.cell(60, 6, cls.capitalize() + ':')
        pdf.cell(0, 6, f'{pct:.1f}%', ln=True)
    pdf.ln(4)

    # Embed MRI Scans
    for title, path in [('MRI Scan', orig_path), ('GradCAM Overlay', gradcam_path)]:
        if path and os.path.exists(path):
            pdf.set_font('DejaVu', 'B', 13)
            pdf.cell(0, 8, title, ln=True)
            pdf.image(path, w=90)
            pdf.ln(4)

    # Physician Sign-off Box
    if signature:
        pdf.ln(4)
        pdf.set_font('DejaVu', 'B', 11)
        pdf.cell(0, 7, 'Case Approval & Digital Sign-off', ln=True)
        pdf.set_font('DejaVu', '', 9.5)
        pdf.set_fill_color(220, 245, 220)  # Light green approval background
        pdf.cell(0, 10, f"  ✅ SIGNED & APPROVED BY: {signature} | Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}", 1, 1, 'L', True)
        pdf.ln(4)

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    pdf.output(tmp.name)
    return tmp.name
