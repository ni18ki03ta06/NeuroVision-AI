"""
SQLite database module for NeuroVision AI.
Handles storage and retrieval of MRI analysis predictions.
"""

import sqlite3
import json
import os
from pathlib import Path

def get_db_path():
    """Returns the configured path to the SQLite database file."""
    return os.getenv(
        "DATABASE_PATH",
        str(Path(__file__).resolve().parent / "predictions.db")
    )

def get_connection():
    """Returns a connection to the SQLite database."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the predictions table in the database if it doesn't exist."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT DEFAULT (datetime('now', 'localtime')),
            patient_name TEXT,
            ref_id TEXT,
            modality TEXT,
            tumor_type TEXT,
            severity_class TEXT,
            risk_level TEXT,
            risk_label TEXT,
            description TEXT,
            stage1_top_pct REAL,
            original_image TEXT,
            gradcam_heatmap TEXT,
            stage1_confidences TEXT,
            stage2_confidences TEXT
        )
    """)
    conn.commit()
    conn.close()

def save_prediction(data: dict) -> int:
    """
    Saves a prediction payload into the database.
    
    Parameters:
        data (dict): Prediction results dictionary containing classifications,
                     confidence, and base64 image strings.
                     
    Returns:
        int: The inserted record ID.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Serialize dictionary structures into JSON strings for database storage
    s1_conf = json.dumps(data.get("stage1_confidences", {}))
    s2_conf = json.dumps(data.get("stage2_confidences", {}))
    
    cursor.execute("""
        INSERT INTO predictions (
            patient_name, ref_id, modality, tumor_type, severity_class,
            risk_level, risk_label, description, stage1_top_pct,
            original_image, gradcam_heatmap, stage1_confidences, stage2_confidences
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("patient_name", "Pending / Anonymous"),
        data.get("ref_id", "Pending"),
        data.get("modality", "Auto-detect"),
        data.get("tumor_type", "No Tumor"),
        data.get("severity_class", "No Tumor / Healthy"),
        data.get("risk_level", "none"),
        data.get("risk_label", "No Risk"),
        data.get("description", "No abnormalities detected."),
        float(data.get("stage1_top_pct", 0.0)),
        data.get("original_image", ""),
        data.get("gradcam_heatmap", ""),
        s1_conf,
        s2_conf
    ))
    
    conn.commit()
    inserted_id = cursor.lastrowid
    conn.close()
    return inserted_id

def get_predictions() -> list:
    """
    Retrieves all stored prediction records from the database.
    
    Returns:
        list: List of dictionary records representing historical predictions.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM predictions ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    
    predictions = []
    for row in rows:
        record = dict(row)
        # Deserialize JSON fields
        try:
            record["stage1_confidences"] = json.loads(record["stage1_confidences"] or "{}")
        except Exception:
            record["stage1_confidences"] = {}
        try:
            record["stage2_confidences"] = json.loads(record["stage2_confidences"] or "{}")
        except Exception:
            record["stage2_confidences"] = {}
        predictions.append(record)
        
    return predictions

def delete_prediction(pred_id: int) -> bool:
    """
    Deletes a prediction record by its ID.
    
    Parameters:
        pred_id (int): The database record ID.
        
    Returns:
        bool: True if deletion was successful, False otherwise.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM predictions WHERE id = ?", (pred_id,))
    conn.commit()
    deleted_count = cursor.rowcount
    conn.close()
    return deleted_count > 0
