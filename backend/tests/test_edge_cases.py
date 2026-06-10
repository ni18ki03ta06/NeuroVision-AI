import pytest

def test_predict_invalid_file_format(client):
    """
    Verifies that uploading a non-image file type to /api/predict 
    returns a 400 Bad Request error.
    """
    response = client.post(
        "/api/predict",
        files={"file": ("test.txt", b"plain text content", "text/plain")},
        data={"modality": "Auto-detect"}
    )
    assert response.status_code == 400
    assert "image" in response.json()["detail"].lower()

def test_predict_corrupted_image(client):
    """
    Verifies that uploading corrupted image bytes to /api/predict 
    returns a 400 Bad Request error.
    """
    response = client.post(
        "/api/predict",
        files={"file": ("corrupted.png", b"corrupted bytes", "image/png")},
        data={"modality": "Auto-detect"}
    )
    assert response.status_code == 400
    assert "parse image" in response.json()["detail"].lower()

def test_pdf_generation_invalid_base64(client):
    """
    Verifies that passing invalid base64 image strings to /api/generate-pdf 
    returns a 400 Bad Request error.
    """
    payload = {
        "result": {
            "tumor_type": "Normal",
            "stage1_top_pct": 99.0,
            "stage1_confidences": {},
            "stage2_confidences": {}
        },
        "original_image": "invalid_base64_string",
        "gradcam_heatmap": "invalid_base64_string",
        "patient_name": "P-0000",
        "ref_id": "CASE-ERR",
        "physician": "Dr. Unknown",
        "notes": "Error test.",
        "signature": "Dr. Unknown"
    }
    response = client.post("/api/generate-pdf", json=payload)
    assert response.status_code == 400
    assert "decode" in response.json()["detail"].lower()
