from fpdf import FPDF
from datetime import datetime
import tempfile, os

def generate_pdf_report(result, orig_path=None, gradcam_path=None):
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
    pdf.cell(0, 10, 'NeuroVision AI — Analysis Report', ln=True)
    pdf.set_font('DejaVu', '', 10)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 6, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)
    pdf.cell(0, 6, 'For research use only — not a diagnostic tool', ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(5)

    # Results
    pdf.set_font('DejaVu', 'B', 13)
    pdf.cell(0, 8, 'Prediction Results', ln=True)
    pdf.set_font('DejaVu', '', 11)
    for label, val in [
        ('Tumor type',     result['tumor_type']),
        ('Severity class', result['severity_class']),
        ('Risk level',     result['risk_label']),
        ('MRI modality',   result.get('modality','—')),
        ('Stage 1 conf.',  f"{result['stage1_top_pct']}%"),
    ]:
        pdf.set_font('DejaVu', 'B', 10)
        pdf.cell(55, 7, label + ':')
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

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    pdf.output(tmp.name)
    return tmp.name
