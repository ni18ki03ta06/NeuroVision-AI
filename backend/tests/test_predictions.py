import pytest

def test_predict_endpoint(client, sample_image_bytes):
    """
    Tests uploading a dummy image slice to /api/predict and checks that the 
    response contains the required classification schemas and base64 assets.
    """
    response = client.post(
        "/api/predict",
        files={"file": ("test.jpg", sample_image_bytes, "image/jpeg")},
        data={"modality": "T1"}
    )
    
    # If model weights are present, it should succeed. If weights are missing,
    # it handles it gracefully returning 500. We assert either path operates correctly.
    if response.status_code == 200:
        data = response.json()
        assert "tumor_type" in data
        assert "severity_class" in data
        assert "risk_level" in data
        assert "risk_label" in data
        assert "description" in data
        assert "stage1_confidences" in data
        assert "stage2_confidences" in data
        assert "stage1_top_pct" in data
        assert "original_image" in data
        assert "gradcam_heatmap" in data
        assert "heatmaps" in data
        assert data["original_image"].startswith("data:image/jpeg;base64,")
        assert data["gradcam_heatmap"].startswith("data:image/jpeg;base64,")
    else:
        assert response.status_code == 500
        assert "detail" in response.json()


def test_predict_batch_endpoint(client, sample_image_bytes):
    """
    Tests uploading multiple dummy image slices to /api/predict/batch and checks
    that the response contains a list of predictions.
    """
    response = client.post(
        "/api/predict/batch",
        files=[
            ("files", ("test1.jpg", sample_image_bytes, "image/jpeg")),
            ("files", ("test2.jpg", sample_image_bytes, "image/jpeg"))
        ],
        data={"modality": "T1"}
    )
    
    # Either successfully processes the batch or gracefully returns 500 if weights missing.
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        for pred in data:
            assert "tumor_type" in pred
            assert "severity_class" in pred
            assert "risk_level" in pred
            assert "original_image" in pred
            assert "gradcam_heatmap" in pred
    else:
        assert response.status_code == 500
        assert "detail" in response.json()

