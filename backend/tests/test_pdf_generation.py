import pytest
import base64

def test_generate_pdf_endpoint(client, sample_image_bytes):
    """
    Tests compiling a diagnostic case report through POST /api/generate-pdf 
    by sending Base64 images and metadata fields. Checks that a PDF stream is returned.
    """
    # Encode mock image to Base64
    img_b64 = "data:image/jpeg;base64," + base64.b64encode(sample_image_bytes).decode()
    
    payload = {
        "result": {
            "tumor_type": "Glioma",
            "severity_class": "Glioma",
            "risk_level": "high",
            "risk_label": "High - Glioblastoma",
            "stage1_top_pct": 92.5,
            "modality": "Auto-detect",
            "stage1_confidences": {"glioma": 92.5, "meningioma": 4.1, "notumor": 2.1, "pituitary": 1.3},
            "stage2_confidences": {"glioma": 89.2, "meningioma": 2.5, "neurocitoma": 1.1, "normal": 2.1, "outros": 3.8, "schwannoma": 1.3}
        },
        "original_image": img_b64,
        "gradcam_heatmap": img_b64,
        "patient_name": "P-1042",
        "ref_id": "CASE-7482",
        "physician": "Dr. Sarah Jenkins",
        "notes": "Test clinical observations.",
        "signature": "Dr. Sarah Jenkins"
    }
    
    response = client.post("/api/generate-pdf", json=payload)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0


def test_generate_pdf_batch_endpoint(client, sample_image_bytes):
    """
    Tests compiling multiple diagnostic case reports through POST /api/generate-pdf/batch.
    Checks that a PDF stream is returned.
    """
    img_b64 = "data:image/jpeg;base64," + base64.b64encode(sample_image_bytes).decode()
    
    payload = {
        "cases": [
            {
                "result": {
                    "tumor_type": "Glioma",
                    "severity_class": "Glioma",
                    "risk_level": "high",
                    "risk_label": "High Risk — Glioblastoma",
                    "stage1_top_pct": 92.5,
                    "modality": "Auto-detect",
                    "stage1_confidences": {"glioma": 92.5, "meningioma": 4.1, "notumor": 2.1, "pituitary": 1.3},
                    "stage2_confidences": {"glioma": 89.2, "meningioma": 2.5, "neurocitoma": 1.1, "normal": 2.1, "outros": 3.8, "schwannoma": 1.3}
                },
                "original_image": img_b64,
                "gradcam_heatmap": img_b64,
                "patient_name": "P-1042",
                "ref_id": "CASE-7482"
            },
            {
                "result": {
                    "tumor_type": "Meningioma",
                    "severity_class": "Meningioma",
                    "risk_level": "medium",
                    "risk_label": "Medium Risk — Meningioma",
                    "stage1_top_pct": 85.0,
                    "modality": "Auto-detect",
                    "stage1_confidences": {"glioma": 5.0, "meningioma": 85.0, "notumor": 6.0, "pituitary": 4.0},
                    "stage2_confidences": {"glioma": 3.0, "meningioma": 81.0, "neurocitoma": 2.0, "normal": 8.0, "outros": 4.0, "schwannoma": 2.0}
                },
                "original_image": img_b64,
                "gradcam_heatmap": img_b64,
                "patient_name": "P-2055",
                "ref_id": "CASE-9912"
            }
        ],
        "physician": "Dr. Sarah Jenkins",
        "notes": "Test batch observations.",
        "signature": "Dr. Sarah Jenkins"
    }
    
    response = client.post("/api/generate-pdf/batch", json=payload)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0

