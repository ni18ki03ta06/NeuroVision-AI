from fpdf import FPDF
from datetime import datetime
import tempfile, os
import re

def sanitize_text(text):
    if not isinstance(text, str):
        return text
    # Remove emoji and dingbats/pictographs ranges
    pattern = re.compile(
        r'[\u2600-\u27BF]|[\u2000-\u3300]|[\u1F300-\u1F6FF]|[\u1F900-\u1F9FF]|[\u1FA70-\u1FAFF]',
        re.UNICODE
    )
    text = pattern.sub('', text)
    # Filter out characters outside the Basic Multilingual Plane (BMP)
    text = "".join(c for c in text if ord(c) <= 0xFFFF)
    # Replace non-standard characters with ASCII equivalent if needed
    text = text.replace("—", "-").replace("–", "-")
    return text.strip()

def get_clinical_guidelines(tumor_type, risk_level):
    tumor_type_lower = tumor_type.lower()
    
    if 'no tumor' in tumor_type_lower or 'notumor' in tumor_type_lower:
        interpretation = "No significant abnormal signal intensities, structural shifts, or mass effects typical of neoplastic processes were detected. The scanned cerebral structures and ventricles appear within normal limits."
        risk_explanation = "Low/None Risk: The AI classification indicates no detected tumor. Standard preventive screening and routine clinical protocols apply."
        recommendations = [
            "Clinical correlation with presenting symptoms by the referring primary care provider.",
            "Routine screening as per standard age, family history, and risk guidelines.",
            "No immediate neurosurgical, oncological, or radiotherapeutic intervention is indicated."
        ]
    elif 'glioma' in tumor_type_lower:
        interpretation = "The neural network detected features consistent with a glial lineage lesion (glioma). Spatial activation mapping (GradCAM) highlights localized focal hyperintensities within the parenchyma, pointing to potential high-density cellular proliferation zones."
        risk_explanation = "High Risk: Gliomas can range from low-grade to highly aggressive Glioblastoma (WHO Grade IV). Immediate intervention, histological grading, and staging are crucial to mitigate rapid progression."
        recommendations = [
            "Urgent neurosurgical consultation for surgical resection or biopsy planning.",
            "Contrast-enhanced MRI brain protocol (T1 + C, FLAIR, and DWI) to define margins, vascularity, and oedema.",
            "Full baseline neurological deficit assessment and functional mapping."
        ]
    elif 'meningioma' in tumor_type_lower:
        interpretation = "Classified features indicate an extra-axial lesion of meningeal origin. Spatial localization focus is concentrated along the dural interfaces, typical of meningioma scan signatures."
        risk_explanation = "Low-to-High Risk: Typically slow-growing benign WHO Grade I lesions, but require monitoring as atypical (Grade II) or anaplastic (Grade III) variants can present with local invasion."
        recommendations = [
            "Referral to neuro-oncology or neurosurgery for symptom and mass-effect evaluation.",
            "Baseline visual acuity, visual field, and cranial nerve examinations if the lesion is skull-base adjacent.",
            "Follow-up MRI in 3 to 6 months to assess growth kinetics if the patient is currently asymptomatic."
        ]
    elif 'pituitary' in tumor_type_lower:
        interpretation = "Scan signatures match characteristics of a pituitary fossa mass (e.g., Pituitary Adenoma). Localized attention maps cluster around the sella turcica, indicating potential sellar extension."
        risk_explanation = "Low-to-Medium Risk: Pituitary tumors are predominantly benign adenomas, but can cause mass-effect optic chiasm compression (leading to bitemporal hemianopsia) or endocrinological dysfunction."
        recommendations = [
            "Comprehensive endocrinological endocrine profile testing (prolactin, GH, ACTH, cortisol, thyroid panel).",
            "Goldmann visual field perimetry testing to rule out optic chiasm compression.",
            "Endocrine or neurosurgical review to determine conservative watch-and-wait tracking vs transsphenoidal resection."
        ]
    else:
        interpretation = "The classification suggests the presence of a localized signal abnormality or atypical lesion. GradCAM attention maps point to focal signal alterations."
        risk_explanation = "Medium Risk: Non-specific anomaly detected. Requires clinical correlation to differentiate between infectious, demyelinating, vascular, or early neoplastic causes."
        recommendations = [
            "Neurological evaluation and correlation with patient symptoms and clinical history.",
            "Consider advanced imaging characterization (e.g., MR Spectroscopy, perfusion MRI, or spinal cord imaging).",
            "Consider laboratory workup (lumbar puncture for CSF analysis, serum inflammatory markers) to rule out inflammatory etiology."
        ]
        
    return interpretation, risk_explanation, recommendations

def generate_pdf_report(result, orig_path=None, gradcam_path=None, patient_name="N/A", ref_id="N/A", physician="N/A", notes="", signature=""):
    # Sanitize inputs
    patient_name = sanitize_text(patient_name)
    ref_id = sanitize_text(ref_id)
    physician = sanitize_text(physician)
    notes = sanitize_text(notes)
    signature = sanitize_text(signature)
    if isinstance(result, dict):
        result = {k: (sanitize_text(v) if isinstance(v, str) else v) for k, v in result.items()}

    pdf = FPDF()
    pdf.set_margin(12)
    
    # Font path loading
    try:
        from fpdf.fonts import fpdf2_pkgdir
        font_dir = os.path.join(fpdf2_pkgdir(), 'fonts')
    except ImportError:
        font_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'fonts')
        if not os.path.exists(os.path.join(font_dir, 'DejaVuSans.ttf')):
            font_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fonts')

    pdf.add_font('DejaVu',  '',  os.path.join(font_dir, 'DejaVuSans.ttf'))
    pdf.add_font('DejaVu',  'B', os.path.join(font_dir, 'DejaVuSans-Bold.ttf'))
    
    pdf.add_page()

    # Document Header
    pdf.set_font('DejaVu', 'B', 18)
    pdf.cell(0, 10, 'NeuroVision AI - Case Report', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('DejaVu', '', 9.5)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, 'For research use only - not a diagnostic tool', new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)

    # 1. Patient/Scan Metadata Section
    pdf.set_font('DejaVu', 'B', 12)
    pdf.cell(0, 8, '1. Patient & Scan Metadata', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('DejaVu', '', 9)
    pdf.set_fill_color(245, 245, 245)
    
    # Metadata grid
    pdf.cell(45, 6.5, ' Patient Name/ID:', 1, 0, 'L', True)
    pdf.cell(50, 6.5, f' {patient_name}', 1, 0, 'L')
    pdf.cell(45, 6.5, ' Case Reference ID:', 1, 0, 'L', True)
    pdf.cell(0, 6.5, f' {ref_id}', 1, 1, 'L')
    
    pdf.cell(45, 6.5, ' Referring Physician:', 1, 0, 'L', True)
    pdf.cell(50, 6.5, f' {physician}', 1, 0, 'L')
    pdf.cell(45, 6.5, ' Scan Modality:', 1, 0, 'L', True)
    pdf.cell(0, 6.5, f" {result.get('modality', '-')}", 1, 1, 'L')

    pdf.cell(45, 6.5, ' Analysis Date:', 1, 0, 'L', True)
    pdf.cell(50, 6.5, f" {datetime.now().strftime('%Y-%m-%d %H:%M')}", 1, 0, 'L')
    pdf.cell(45, 6.5, ' Stage 1 Top Score:', 1, 0, 'L', True)
    pdf.cell(0, 6.5, f" {result.get('stage1_top_pct', 0.0)}%", 1, 1, 'L')
    pdf.ln(5)

    # 2. Prediction results summary
    pdf.set_font('DejaVu', 'B', 12)
    pdf.cell(0, 8, '2. Classification Results Summary', new_x="LMARGIN", new_y="NEXT")
    for label, val in [
        ('Primary Tumor Type', result.get('tumor_type', 'N/A')),
        ('Subclass Severity',  result.get('severity_class', 'N/A')),
        ('Assessed Risk Level', result.get('risk_label', 'N/A')),
    ]:
        pdf.set_font('DejaVu', 'B', 9.5)
        pdf.cell(55, 6, ' ' + label + ':')
        pdf.set_font('DejaVu', '', 9.5)
        pdf.cell(0, 6, str(val), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # 3. Confidence score breakdown
    pdf.set_font('DejaVu', 'B', 12)
    pdf.cell(0, 8, '3. Neural Network Confidence Breakdown', new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font('DejaVu', 'B', 9.5)
    pdf.cell(93, 6, 'Stage 1 - Tumor Type Probabilities', 0, 0)
    pdf.cell(93, 6, 'Stage 2 - Severity Class Probabilities', 0, 1)
    
    pdf.set_font('DejaVu', '', 9)
    s1_items = list(result.get('stage1_confidences', {}).items())
    s2_items = list(result.get('stage2_confidences', {}).items())
    max_len = max(len(s1_items), len(s2_items))
    
    for i in range(max_len):
        if i < len(s1_items):
            cls, pct = s1_items[i]
            pdf.cell(55, 5, f' {cls.capitalize()}:')
            pdf.cell(38, 5, f'{pct:.1f}%')
        else:
            pdf.cell(93, 5, '')
            
        if i < len(s2_items):
            cls, pct = s2_items[i]
            pdf.cell(55, 5, f' {cls.capitalize()}:')
            pdf.cell(38, 5, f'{pct:.1f}%')
        else:
            pdf.cell(93, 5, '')
        pdf.ln(5)
    pdf.ln(4)

    # 4. Clinical notes (if provided)
    if notes:
        pdf.set_font('DejaVu', 'B', 12)
        pdf.cell(0, 8, '4. Clinical Observations & Notes', new_x="LMARGIN", new_y="NEXT")
        pdf.set_font('DejaVu', '', 9)
        pdf.multi_cell(0, 4.5, f' {notes}', border=1)
        pdf.ln(4)

    # 5. Physician Sign-off Box
    if signature:
        pdf.set_font('DejaVu', 'B', 11)
        pdf.cell(0, 7, 'Case Approval & Digital Sign-off', new_x="LMARGIN", new_y="NEXT")
        pdf.set_font('DejaVu', '', 9)
        pdf.set_fill_color(220, 245, 220)  # light green background
        pdf.cell(0, 9, f"  [APPROVED] SIGNED & APPROVED BY: {signature} | Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}", 1, 1, 'L', True)
        pdf.ln(4)

    # Page 2: Spatial Interpretability and Medical Insights
    pdf.add_page()
    
    # Title
    pdf.set_font('DejaVu', 'B', 14)
    pdf.cell(0, 10, 'NeuroVision AI - Interpretability & Guidelines', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    # 6. GradCAM visualization embedded side-by-side
    pdf.set_font('DejaVu', 'B', 12)
    pdf.cell(0, 8, '5. Spatial Interpretability Mapping (GradCAM)', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    
    y_pos = pdf.get_y()
    if orig_path and os.path.exists(orig_path):
        pdf.image(orig_path, x=12, y=y_pos, w=85)
        pdf.set_font('DejaVu', '', 8.5)
        pdf.set_xy(12, y_pos + 86)
        pdf.cell(85, 5, 'Figure 1: Original MRI Scan Slice', 0, 0, 'C')
        
    if gradcam_path and os.path.exists(gradcam_path):
        pdf.image(gradcam_path, x=113, y=y_pos, w=85)
        pdf.set_font('DejaVu', '', 8.5)
        pdf.set_xy(113, y_pos + 86)
        pdf.cell(85, 5, 'Figure 2: GradCAM Attention Heatmap', 0, 0, 'C')

    pdf.set_xy(12, y_pos + 94)
    pdf.ln(4)

    # Retrieve guidelines
    interpretation, risk_explanation, recommendations = get_clinical_guidelines(
        result.get('tumor_type', 'No Tumor'), 
        result.get('risk_level', 'none')
    )

    # 7. Medical interpretation
    pdf.set_font('DejaVu', 'B', 12)
    pdf.cell(0, 8, '6. Medical Interpretation', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('DejaVu', '', 9.5)
    pdf.multi_cell(0, 4.5, interpretation)
    pdf.ln(4)

    # 8. Risk stratification explanation
    pdf.set_font('DejaVu', 'B', 12)
    pdf.cell(0, 8, '7. Risk Stratification Explanation', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('DejaVu', '', 9.5)
    pdf.multi_cell(0, 4.5, risk_explanation)
    pdf.ln(4)

    # 9. Recommendations for follow-up
    pdf.set_font('DejaVu', 'B', 12)
    pdf.cell(0, 8, '8. Follow-up Recommendations', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('DejaVu', '', 9.5)
    for idx, rec in enumerate(recommendations):
        pdf.cell(6, 5, f'{idx+1}.')
        pdf.multi_cell(pdf.epw - 6, 5, rec)
    
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    pdf.output(tmp.name)
    return tmp.name

def generate_batch_pdf_report(cases, physician="N/A", notes="", signature=""):
    """
    Compiles multiple cases into a single multi-page PDF report.
    Each case gets its own page containing patient details, MRI, heatmap, and predictions.
    """
    physician = sanitize_text(physician)
    notes = sanitize_text(notes)
    signature = sanitize_text(signature)

    pdf = FPDF()
    pdf.set_margin(12)
    
    try:
        from fpdf.fonts import fpdf2_pkgdir
        font_dir = os.path.join(fpdf2_pkgdir(), 'fonts')
    except ImportError:
        font_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'fonts')
        if not os.path.exists(os.path.join(font_dir, 'DejaVuSans.ttf')):
            font_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fonts')

    pdf.add_font('DejaVu', '', os.path.join(font_dir, 'DejaVuSans.ttf'))
    pdf.add_font('DejaVu', 'B', os.path.join(font_dir, 'DejaVuSans-Bold.ttf'))
    
    for idx, case in enumerate(cases):
        pdf.add_page()
        
        result = case.get('result', {})
        patient_name = sanitize_text(case.get('patient_name', 'N/A'))
        ref_id = sanitize_text(case.get('ref_id', 'N/A'))
        orig_path = case.get('orig_path', None)
        gradcam_path = case.get('gradcam_path', None)
        
        if isinstance(result, dict):
            result = {k: (sanitize_text(v) if isinstance(v, str) else v) for k, v in result.items()}

        # Header
        pdf.set_font('DejaVu', 'B', 16)
        pdf.cell(0, 10, f'NeuroVision AI - Batch Report | Case {idx + 1}', new_x="LMARGIN", new_y="NEXT")
        pdf.set_font('DejaVu', '', 9)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 6, 'For research use only - not a diagnostic tool', new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(0, 0, 0)
        pdf.ln(3)

        # 1. Patient Metadata Table
        pdf.set_font('DejaVu', 'B', 11)
        pdf.cell(0, 8, '1. Patient & Scan Metadata', new_x="LMARGIN", new_y="NEXT")
        pdf.set_font('DejaVu', '', 8.5)
        pdf.set_fill_color(245, 245, 245)
        
        # Row 1
        pdf.cell(45, 6, ' Patient Name/ID:', 1, 0, 'L', True)
        pdf.cell(50, 6, f' {patient_name}', 1, 0, 'L')
        pdf.cell(45, 6, ' Case Reference ID:', 1, 0, 'L', True)
        pdf.cell(0, 6, f' {ref_id}', 1, 1, 'L')
        
        # Row 2
        pdf.cell(45, 6, ' Referring Physician:', 1, 0, 'L', True)
        pdf.cell(50, 6, f' {physician}', 1, 0, 'L')
        pdf.cell(45, 6, ' Scan Modality:', 1, 0, 'L', True)
        pdf.cell(0, 6, f" {result.get('modality', '-')}", 1, 1, 'L')

        # Row 3
        pdf.cell(45, 6, ' Analysis Date:', 1, 0, 'L', True)
        pdf.cell(50, 6, f" {datetime.now().strftime('%Y-%m-%d %H:%M')}", 1, 0, 'L')
        pdf.cell(45, 6, ' Top Confidence Score:', 1, 0, 'L', True)
        pdf.cell(0, 6, f" {result.get('stage1_top_pct', 0.0)}%", 1, 1, 'L')
        
        pdf.ln(3)

        # 2. Results Summary
        pdf.set_font('DejaVu', 'B', 11)
        pdf.cell(0, 7, '2. Prediction Results Summary', new_x="LMARGIN", new_y="NEXT")
        pdf.set_font('DejaVu', '', 8.5)
        for label, val in [
            ('Primary Tumor Type', result.get('tumor_type', 'N/A')),
            ('Subclass Severity', result.get('severity_class', 'N/A')),
            ('Assessed Risk Level', result.get('risk_label', 'N/A')),
        ]:
            pdf.set_font('DejaVu', 'B', 8.5)
            pdf.cell(50, 5, ' ' + label + ':')
            pdf.set_font('DejaVu', '', 8.5)
            pdf.cell(0, 5, str(val), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)

        # Retrieve guidelines
        interpretation, risk_explanation, recommendations = get_clinical_guidelines(
            result.get('tumor_type', 'N/A'), 
            result.get('risk_level', 'none')
        )

        # 3. Medical Interpretation & Recommendations
        pdf.set_font('DejaVu', 'B', 11)
        pdf.cell(0, 7, '3. Clinical Insights & Recommendations', new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font('DejaVu', 'B', 8.5)
        pdf.cell(0, 5, 'Medical Interpretation:', new_x="LMARGIN", new_y="NEXT")
        pdf.set_font('DejaVu', '', 8.5)
        pdf.multi_cell(0, 4, interpretation)
        pdf.ln(1)
        
        pdf.set_font('DejaVu', 'B', 8.5)
        pdf.cell(0, 5, 'Follow-up Recommendations:', new_x="LMARGIN", new_y="NEXT")
        pdf.set_font('DejaVu', '', 8.5)
        for idx_rec, rec in enumerate(recommendations):
            pdf.cell(5, 4.5, f'{idx_rec+1}.')
            pdf.multi_cell(pdf.epw - 5, 4.5, rec)
        pdf.ln(3)

        # 4. Embed Images Side-by-Side
        if orig_path and os.path.exists(orig_path):
            pdf.set_font('DejaVu', 'B', 11)
            pdf.cell(93, 6, 'Figure 1: MRI Scan Slice', 0, 0)
            if gradcam_path and os.path.exists(gradcam_path):
                pdf.cell(0, 6, 'Figure 2: GradCAM Attention Heatmap', 0, 1)
                
                # Image 1 (MRI)
                y_pos = pdf.get_y()
                pdf.image(orig_path, x=12, y=y_pos, w=85)
                # Image 2 (GradCAM)
                pdf.image(gradcam_path, x=113, y=y_pos, w=85)
                pdf.set_y(y_pos + 85) # Skip past images height
            else:
                pdf.ln(1)
                pdf.image(orig_path, w=85)
                pdf.ln(3)
        
        pdf.ln(3)

    # Approvals signature on the last page
    if signature:
        pdf.ln(2)
        pdf.set_font('DejaVu', 'B', 11)
        pdf.cell(0, 6, 'Batch Approvals & Digital Sign-off', new_x="LMARGIN", new_y="NEXT")
        pdf.set_fill_color(220, 245, 220)
        pdf.cell(0, 9, f"  [APPROVED] BATCH SIGNED & APPROVED BY: {signature} | Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}", 1, 1, 'L', True)

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    pdf.output(tmp.name)
    return tmp.name

