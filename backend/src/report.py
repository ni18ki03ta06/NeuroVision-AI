from fpdf import FPDF
from datetime import datetime
import tempfile, os

def generate_pdf_report(result, orig_path=None, gradcam_path=None, patient_name="N/A", ref_id="N/A", physician="N/A", notes="", signature=""):
    pdf = FPDF()
    
    # Add DejaVu unicode font (bundled with fpdf2) with a fallback to local project fonts
    try:
        from fpdf.fonts import fpdf2_pkgdir
        font_dir = os.path.join(fpdf2_pkgdir(), 'fonts')
    except ImportError:
        font_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fonts')

    pdf.add_font('DejaVu',  '',  os.path.join(font_dir, 'DejaVuSans.ttf'),        uni=True)
    pdf.add_font('DejaVu',  'B', os.path.join(font_dir, 'DejaVuSans-Bold.ttf'),   uni=True)
    
    pdf.add_page()

    # Header
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
    
    # Row 1
    pdf.cell(45, 7, ' Patient Name/ID:', 1, 0, 'L', True)
    pdf.cell(50, 7, f' {patient_name}', 1, 0, 'L')
    pdf.cell(45, 7, ' Case Reference ID:', 1, 0, 'L', True)
    pdf.cell(0, 7, f' {ref_id}', 1, 1, 'L')
    
    # Row 2
    pdf.cell(45, 7, ' Referring Physician:', 1, 0, 'L', True)
    pdf.cell(50, 7, f' {physician}', 1, 0, 'L')
    pdf.cell(45, 7, ' Scan Modality:', 1, 0, 'L', True)
    pdf.cell(0, 7, f" {result.get('modality', '—')}", 1, 1, 'L')

    # Row 3
    pdf.cell(45, 7, ' Analysis Date:', 1, 0, 'L', True)
    pdf.cell(50, 7, f" {datetime.now().strftime('%Y-%m-%d %H:%M')}", 1, 0, 'L')
    pdf.cell(45, 7, ' Stage 1 Confidence:', 1, 0, 'L', True)
    pdf.cell(0, 7, f" {result['stage1_top_pct']}%", 1, 1, 'L')
    
    pdf.ln(4)

    # Clinical Notes
    if notes:
        pdf.set_font('DejaVu', 'B', 12)
        pdf.cell(0, 8, 'Clinical Observations & Notes', ln=True)
        pdf.set_font('DejaVu', '', 9.5)
        pdf.multi_cell(0, 5, f' {notes}', border=1)
        pdf.ln(4)

    # Results
    pdf.set_font('DejaVu', 'B', 13)
    pdf.cell(0, 8, 'Prediction Results Summary', ln=True)
    pdf.set_font('DejaVu', '', 11)
    for label, val in [
        ('Primary Tumor Type', result['tumor_type']),
        ('Subclass Severity',  result['severity_class']),
        ('Assessed Risk Level', result['risk_label']),
    ]:
        pdf.set_font('DejaVu', 'B', 10)
        pdf.cell(55, 7, ' ' + label + ':')
        pdf.set_font('DejaVu', '', 10)
        pdf.cell(0, 7, str(val), ln=True)
    pdf.ln(4)

    # Stage 1
    pdf.set_font('DejaVu', 'B', 13)
    pdf.cell(0, 8, 'Stage 1 — Tumor Type Confidence', ln=True)
    pdf.set_font('DejaVu', '', 10)
    for cls, pct in result['stage1_confidences'].items():
        pdf.cell(60, 6, cls.capitalize() + ':')
        pdf.cell(0, 6, f'{pct:.1f}%', ln=True)
    pdf.ln(4)

    # Stage 2
    pdf.set_font('DejaVu', 'B', 13)
    pdf.cell(0, 8, 'Stage 2 — Severity Class Confidence', ln=True)
    pdf.set_font('DejaVu', '', 10)
    for cls, pct in result['stage2_confidences'].items():
        pdf.cell(60, 6, cls.capitalize() + ':')
        pdf.cell(0, 6, f'{pct:.1f}%', ln=True)
    pdf.ln(4)

    # Images
    for title, path in [('MRI Scan', orig_path),
                         ('GradCAM Overlay', gradcam_path)]:
        if path and os.path.exists(path):
            pdf.set_font('DejaVu', 'B', 13)
            pdf.cell(0, 8, title, ln=True)
            pdf.image(path, w=90)
            pdf.ln(4)

    # Physician Sign-off Block
    if signature:
        pdf.ln(4)
        pdf.set_font('DejaVu', 'B', 11)
        pdf.cell(0, 7, 'Case Approval & Digital Sign-off', ln=True)
        pdf.set_font('DejaVu', '', 9.5)
        pdf.set_fill_color(220, 245, 220)  # light green background
        pdf.cell(0, 10, f"  ✅ SIGNED & APPROVED BY: {signature} | Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}", 1, 1, 'L', True)
        pdf.ln(4)

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    pdf.output(tmp.name)
    return tmp.name
