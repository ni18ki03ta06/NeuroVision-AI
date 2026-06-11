import pytest
import os
import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database import init_db, save_prediction, get_predictions, delete_prediction

@pytest.fixture(autouse=True)
def setup_test_db():
    """Initializes the database before each test run and cleans up afterwards."""
    # Set database path to a temporary test DB to avoid polluting production DB
    test_db = str(Path(__file__).resolve().parent / "test_predictions.db")
    os.environ["DATABASE_PATH"] = test_db
    init_db()
    yield
    # Cleanup test DB file
    if os.path.exists(test_db):
        try:
            os.remove(test_db)
        except Exception:
            pass

def test_init_db():
    """Verifies that predictions table is initialized successfully."""
    predictions = get_predictions()
    assert isinstance(predictions, list)
    assert len(predictions) == 0

def test_save_and_retrieve_prediction():
    """Tests saving a mock prediction and retrieving it from history."""
    mock_data = {
        "patient_name": "Test Patient",
        "ref_id": "REF-TEST-99",
        "modality": "T1",
        "tumor_type": "Glioma",
        "severity_class": "Moderate Lesion",
        "risk_level": "medium",
        "risk_label": "MEDIUM RISK",
        "description": "Test scan results.",
        "stage1_top_pct": 85.5,
        "original_image": "data:image/jpeg;base64,mockorig",
        "gradcam_heatmap": "data:image/jpeg;base64,mockgrad",
        "stage1_confidences": {"Glioma": 0.855, "No Tumor": 0.145},
        "stage2_confidences": {"Moderate": 0.9, "Severe": 0.1}
    }
    
    inserted_id = save_prediction(mock_data)
    assert inserted_id is not None
    assert inserted_id > 0
    
    predictions = get_predictions()
    assert len(predictions) == 1
    record = predictions[0]
    assert record["id"] == inserted_id
    assert record["patient_name"] == "Test Patient"
    assert record["ref_id"] == "REF-TEST-99"
    assert record["tumor_type"] == "Glioma"
    assert record["risk_level"] == "medium"
    assert record["stage1_top_pct"] == 85.5
    assert record["stage1_confidences"]["Glioma"] == 0.855

def test_delete_prediction():
    """Tests deleting a prediction from history."""
    mock_data = {
        "patient_name": "Delete Patient",
        "ref_id": "REF-DEL-1",
        "modality": "T2"
    }
    inserted_id = save_prediction(mock_data)
    assert len(get_predictions()) == 1
    
    deleted = delete_prediction(inserted_id)
    assert deleted is True
    assert len(get_predictions()) == 0

def test_api_history_endpoints(client):
    """Tests /api/history GET and DELETE endpoints using test client."""
    # First, list history (should be empty)
    response = client.get("/api/history")
    assert response.status_code == 200
    assert len(response.json()) == 0
    
    # Insert mock item directly
    mock_data = {
        "patient_name": "API Patient",
        "ref_id": "REF-API-1",
        "modality": "T1C+"
    }
    inserted_id = save_prediction(mock_data)
    
    # Retrieve via API
    response = client.get("/api/history")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["patient_name"] == "API Patient"
    assert data[0]["id"] == inserted_id
    
    # Delete via API
    del_response = client.delete(f"/api/history/{inserted_id}")
    assert del_response.status_code == 200
    assert del_response.json()["status"] == "success"
    
    # Check deleted list via API
    response = client.get("/api/history")
    assert len(response.json()) == 0
