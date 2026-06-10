# API Documentation — NeuroVision AI Backend Services

This document details the API endpoints exposed by the **NeuroVision AI** FastAPI backend service. 

---

## 1. Health Check
*   **Endpoint:** `GET /health`
*   **Description:** Returns the operational status of the service and the target execution hardware device (CPU or CUDA).
*   **Request Format:** None (Query Parameter / Header not required)
*   **Response Format (200 OK):**
    ```json
    {
      "status": "ok",
      "service": "NeuroVision AI Flat Backend Service",
      "device": "cpu"
    }
    ```
*   **cURL Example:**
    ```bash
    curl -X GET http://localhost:8000/health
    ```

---

## 2. Model Information Metadata
*   **Endpoint:** `GET /api/models/info`
*   **Description:** Returns metadata related to the deep learning models cached in memory, including network architecture versions, parameter sizes, and target classes.
*   **Request Format:** None
*   **Response Format (200 OK):**
    ```json
    {
      "architecture": "EfficientNet-B2 (Two-Stage Classifier Pipeline)",
      "input_shape": [3, 224, 224],
      "classes": {
        "stage1": ["glioma", "meningioma", "notumor", "pituitary"],
        "stage2": ["glioma", "meningioma", "neurocitoma", "normal", "outros", "schwannoma"]
      },
      "stage1_parameters": 9225844,
      "stage2_parameters": 9225844
    }
    ```
*   **cURL Example:**
    ```bash
    curl -X GET http://localhost:8000/api/models/info
    ```

---

## 3. Performance Telemetry Metrics
*   **Endpoint:** `GET /api/performance-metrics`
*   **Description:** Retrieves mathematical performance metrics computed on validation testing subsets, including overall accuracies, confusion matrices, class-wise precision/recalls, loss logs, and ROC curves.
*   **Request Format:** None
*   **Response Format (200 OK):**
    ```json
    {
      "overall": {
        "accuracy": 0.965,
        "precision": 0.952,
        "recall": 0.948,
        "f1_score": 0.95
      },
      "model_info": {
        "architecture": "EfficientNet-B2 Classifier",
        "total_params": 9225844,
        "train_dataset_size": 2500,
        "test_dataset_size": 625,
        "training_time": "3h 42m",
        "hardware": "NVIDIA RTX 3080 GPU"
      },
      "labels": ["Glioma", "Meningioma", "No Tumor", "Pituitary"],
      "confusion_matrix": [
        [142, 5, 3, 0],
        [6, 131, 8, 2],
        [1, 4, 155, 0],
        [0, 2, 1, 165]
      ],
      "class_wise": [
        {"name": "Glioma", "precision": 0.953, "recall": 0.947, "f1": 0.95, "accuracy": 0.947, "samples": 150},
        {"name": "Meningioma", "precision": 0.923, "recall": 0.891, "f1": 0.907, "accuracy": 0.891, "samples": 147},
        {"name": "No Tumor", "precision": 0.928, "recall": 0.969, "f1": 0.948, "accuracy": 0.969, "samples": 160},
        {"name": "Pituitary", "precision": 0.988, "recall": 0.982, "f1": 0.985, "accuracy": 0.982, "samples": 168}
      ],
      "training_history": [
        {"epoch": 1, "loss": 1.25, "val_loss": 1.1, "acc": 0.62, "val_acc": 0.68},
        {"epoch": 15, "loss": 0.08, "val_loss": 0.11, "acc": 0.98, "val_acc": 0.965}
      ],
      "roc_curves": [
        {"fpr": 0.0, "glioma": 0.0, "meningioma": 0.0, "notumor": 0.0, "pituitary": 0.0},
        {"fpr": 1.0, "glioma": 1.0, "meningioma": 1.0, "notumor": 1.0, "pituitary": 1.0}
      ],
      "data_distribution": [
        {"name": "Glioma", "value": 600},
        {"name": "Meningioma", "value": 580},
        {"name": "No Tumor", "value": 650},
        {"name": "Pituitary", "value": 670}
      ],
      "confidence_histogram": [
        {"range": "90-100%", "count": 170}
      ]
    }
    ```
*   **cURL Example:**
    ```bash
    curl -X GET http://localhost:8000/api/performance-metrics
    ```

---

## 4. MRI Scan Classification (2-Stage Predict)
*   **Endpoint:** `POST /api/predict`
*   **Description:** Uploads a 2D brain MRI slice. The backend performs tumor classification (Stage 1), severity classification (Stage 2), generates 2D GradCAM maps, and responds with predictions alongside color-mapped overlays returned as Base64 strings.
*   **Request Format:** Multipart Form-data
    *   `file`: The raw binary image file (JPEG, PNG, WEBP).
    *   `modality` (optional): The sequence configuration context (`Auto-detect`, `T1`, `T1C+`, `T2`). Default is `"Auto-detect"`.
*   **Response Format (200 OK):**
    ```json
    {
      "tumor_type": "Glioma",
      "severity_class": "Glioma",
      "risk_level": "high",
      "risk_label": "🔴 High — contains Glioblastoma (Grade 4)",
      "description": "Scan features match Glioma characteristics with 92.5% Stage 1 confidence. 🔴 High — contains Glioblastoma (Grade 4)",
      "stage1_confidences": {
        "glioma": 92.5,
        "meningioma": 4.1,
        "notumor": 2.1,
        "pituitary": 1.3
      },
      "stage2_confidences": {
        "glioma": 89.2,
        "meningioma": 2.5,
        "neurocitoma": 1.1,
        "normal": 2.1,
        "outros": 3.8,
        "schwannoma": 1.3
      },
      "stage1_top_pct": 92.5,
      "modality": "Auto-detect",
      "pred_type_idx": 0,
      "original_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
      "gradcam_heatmap": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
      "heatmaps": {
        "jet": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
        "hot": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
        "viridis": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
        "plasma": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
        "inferno": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
        "magma": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
      }
    }
    ```
*   **Error Responses:**
    *   **400 Bad Request:** Missing/invalid image format.
        ```json
        { "detail": "Invalid file type. Please upload an image." }
        ```
    *   **500 Internal Server Error:** Classifier model state-dictionary loading failure or CUDA out of memory.
        ```json
        { "detail": "Inference pipeline execution error: [Error details]" }
        ```
*   **cURL Example:**
    ```bash
    curl -X POST http://localhost:8000/api/predict \
      -F "file=@/path/to/mri_slice.jpg" \
      -F "modality=Auto-detect"
    ```

---

## 5. Clinical PDF Report Generation
*   **Endpoint:** `POST /api/generate-pdf`
*   **Description:** Compiles patient metadata, prediction metrics, clinical notes, physician sign-off signatures, and Base64 images into a clinical PDF case report. The file is streamed directly to the user, and background tasks handle files deletion.
*   **Request Format:** JSON
    ```json
    {
      "result": {
        "tumor_type": "Glioma",
        "severity_class": "Glioma",
        "risk_level": "high",
        "risk_label": "🔴 High — contains Glioblastoma (Grade 4)",
        "stage1_top_pct": 92.5,
        "modality": "Auto-detect",
        "stage1_confidences": { "glioma": 92.5, "meningioma": 4.1, "notumor": 2.1, "pituitary": 1.3 },
        "stage2_confidences": { "glioma": 89.2, "meningioma": 2.5, "neurocitoma": 1.1, "normal": 2.1, "outros": 3.8, "schwannoma": 1.3 }
      },
      "original_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
      "gradcam_heatmap": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
      "patient_name": "P-1042",
      "ref_id": "CASE-7482",
      "physician": "Dr. Sarah Jenkins",
      "notes": "Lesion boundaries visible under TTA. Strong localization markers present in the feature block.",
      "signature": "Dr. Sarah Jenkins"
    }
    ```
*   **Response Format (200 OK):**
    *   Content-Type: `application/pdf`
    *   Body: Binary PDF stream
*   **Error Responses:**
    *   **400 Bad Request:** Base64 decoding failure or missing parameters.
        ```json
        { "detail": "Failed to base64 decode report image assets: [Error details]" }
        ```
    *   **500 Internal Server Error:** FPDF2 layout or rendering compilation error.
        ```json
        { "detail": "PDF compilation failed: [Error details]" }
        ```
*   **cURL Example:**
    ```bash
    curl -X POST http://localhost:8000/api/generate-pdf \
      -H "Content-Type: application/json" \
      -d @report_payload.json \
      --output neurovision_report.pdf
    ```
