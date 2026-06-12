# NeuroVision AI — Advanced MRI Neuro-Diagnostic Suite

NeuroVision AI is a research-grade, deep learning medical diagnostic application designed to classify brain MRI scans and identify anomalous spatial localization boundaries. The system operates on a decoupled **React SPA + FastAPI backend** architecture, deploying a two-stage CNN pipeline (EfficientNet-B2) augmented with Test-Time Augmentation (TTA) and GradCAM spatial explainability.

---

## 1. Project Objectives
*   **Decoupled Low-Latency Inference:** Migrate legacy single-file Python Streamlit tools into a low-latency React web app powered by a FastAPI API.
*   **Two-Stage Diagnostic Pipeline:** Automatically screen for primary tumor presence (Glioma, Meningioma, Pituitary, Normal) and route positives to determine subclass severity (Grades 1–4).
*   **Visual Interpretability:** Provide clinicians with spatial activation heatmaps via GradCAM to expose features driving model classification.
*   **Streamlined PDF Reporting:** Compile MRI slices, colormap markers, confidence thresholds, and approval signatures into clinical reports.

---

## 2. Features Overview
*   **8x Test-Time Augmentation (TTA):** Runs inference across 8 augmented views of the slice (flips, rotations, contrast adjustments) and averages confidence outputs to minimize outlier alerts.
*   **60 FPS Canvas Blending:** Pre-renders pure heatmaps on the backend; the frontend layers the heatmap on top of the original MRI and blends them instantly via GPU-accelerated CSS opacity controls.
*   **Multi-Colormap Support:** Supports immediate colormap switching (Jet, Hot, Viridis, Plasma, Inferno, Magma) without redundant API calls.
*   **Model Telemetry Charts:** Interactive Recharts elements visualizing validation histories, ROC points, sample distributions, and confidence densities.
*   **Clinician Sign-off Block:** Physician approvals, reference keys, and notes are validated before compile.

---

## 3. Tech Stack & Versions

### Frontend (Client-side)
*   **Core Framework:** React 18.3.1
*   **Build Tool & Dev Server:** Vite 5.3.1
*   **HTTP API Requests:** Axios 1.7.2
*   **Charting Library:** Recharts 2.12.7
*   **Styling:** Tailwind CSS v3.4.4
*   **Icon Library:** Lucide React 0.395.0

### Backend (Server-side)
*   **Core Framework:** FastAPI 0.100.0
*   **WSGI/ASGI Server:** Uvicorn 0.22.0
*   **Deep Learning Backbone:** PyTorch 2.0.0 (EfficientNet-B2 fine-tuned)
*   **Computer Vision Framework:** Torchvision 0.15.0 & OpenCV / Pillow 10.0.0
*   **Model Explainability:** pytorch-grad-cam 1.4.8
*   **PDF Report Engine:** fpdf2 2.7.0
*   **Scientific Suite:** NumPy 1.24.0, Scikit-Learn 1.3.0, Matplotlib 3.7.0

---

## 4. Installation Instructions

### Prerequisites
*   Python 3.10+ installed
*   Node.js v18+ and npm installed

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the required python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template to create a local configuration file:
   ```bash
   cp .env.example .env
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install the node dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

---

## 5. How to Run

### Step 1: Start the FastAPI Backend
Ensure your Python virtual environment is active in the `backend` directory, then start the Uvicorn ASGI server:
```bash
cd backend
uvicorn main:app --reload --port 8000
```
*   The backend will start on **`http://localhost:8000`**.
*   Swagger documentation is hosted at **`http://localhost:8000/docs`**.
*   The backend pre-loads models from `backend/models/` during the startup hook.

### Step 2: Start the React Frontend
Open a separate terminal window, navigate to `frontend`, and launch the Vite server:
```bash
cd frontend
npm run dev
```
*   The React client will serve on **`http://localhost:5173`**.
*   Open the link in your browser to access the dashboard.

---

## 6. Project Structure Explanation

```
NeuroVision-AI/
├── backend/                       # FastAPI flat backend directory
│   ├── models/                    # Folder containing PyTorch weight files (.pth)
│   │   ├── tumor_classifier.pth
│   │   └── severity_classifier.pth
│   ├── src/                       # PyTorch source files (copied from root)
│   │   ├── model.py               # EfficientNet network building code
│   │   ├── pipeline.py            # Double-stage classification pipeline
│   │   ├── gradcam.py             # Grayscale GradCAM map extraction
│   │   └── report.py              # PDF compiler utility
│   ├── .env                       # Local running environment configurations
│   ├── .env.example               # Backend environment variables template
│   ├── config.py                  # Configurations (copied from root config.py)
│   ├── main.py                    # FastAPI application routes entrypoint
│   └── requirements.txt           # Backend python dependencies list
├── frontend/                      # React frontend directory
│   ├── src/
│   │   ├── api/                   # API Axios instances
│   │   │   ├── apiClient.js       # Axios base instance
│   │   │   └── predictionAPI.js   # Route requests
│   │   ├── components/            # Reusable UI widgets
│   │   │   ├── Dropzone.jsx       # Uploader area
│   │   │   ├── ImageDisplay.jsx   # MRI + GradCAM overlay blending canvas
│   │   │   ├── GaugeChart.jsx     # SVG Stage 1 gauge
│   │   │   ├── RadarChart.jsx     # Recharts Stage 2 radar
│   │   │   └── ReportEditor.jsx   # Physician metadata compiler form
│   │   ├── constants/             # Global colors and label mappings
│   │   ├── hooks/                 # Custom upload and predict hooks
│   │   ├── layout/                # Sidebar, Navbar, and Footer layouts
│   │   ├── pages/                 # Full Page widgets (Home, Analyze, Results, Docs, About)
│   │   ├── utils/                 # Percentages and colors formatters
│   │   ├── globals.css            # Tailwind directives and scroll bar CSS
│   │   ├── theme.js               # Typography scales and shadows JS themes
│   │   └── main.jsx               # Entrypoint mounting App.jsx
│   ├── .env.local                 # Frontend environment variables config
│   ├── .env.example               # Frontend env template
│   ├── package.json               # Frontend package manager
│   ├── tailwind.config.js         # Tailwind styling overrides
│   └── vite.config.js             # Vite compiler configurations
├── models/                        # Root models folder (Preserved weights)
├── src/                           # Root source folder (Preserved original code)
├── config.py                      # Root config file (Preserved)
└── README.md                      # Primary project documentation
```

---

## 7. API Documentation

### System Health
*   **Endpoint:** `GET /health`
*   **Description:** Returns backend status and PyTorch hardware device target.
*   **Response:**
    ```json
    { "status": "ok", "service": "NeuroVision AI Flat Backend Service", "device": "cpu" }
    ```

### Model Information
*   **Endpoint:** `GET /api/models/info`
*   **Description:** Returns trainable parameters, shapes, and class names.
*   **Response:**
    ```json
    {
      "architecture": "EfficientNet-B2 (Two-Stage Classifier Pipeline)",
      "input_shape": [3, 224, 224],
      "classes": { "stage1": ["glioma", ...], "stage2": ["glioma", ...] },
      "stage1_parameters": 9225844,
      "stage2_parameters": 9225844
    }
    ```

### Performance Telemetry
*   **Endpoint:** `GET /api/performance-metrics`
*   **Description:** Returns coordinate matrices for confusion heatmaps, validation loss curves, and per-class accuracies.
*   **Response:**
    ```json
    {
      "overall": { "accuracy": 0.965, "precision": 0.952, "recall": 0.948, "f1_score": 0.950 },
      "confusion_matrix": [[142, 5, ...], ...],
      "class_wise": [{"name": "Glioma", "precision": 0.953, "recall": 0.947, ...}, ...]
    }
    ```

### MRI Classification & Explainability
*   **Endpoint:** `POST /api/predict`
*   **Form Data:**
    *   `file`: MRI image file (JPEG, PNG, WEBP)
    *   `modality`: Sequence mode (`Auto-detect`, `T1`, `T1C+`, `T2`)
*   **Response:**
    ```json
    {
      "tumor_type": "Glioma",
      "severity_class": "Glioma",
      "risk_level": "high",
      "risk_label": "🔴 High — contains Glioblastoma (Grade 4)",
      "description": "Scan features match Glioma characteristics...",
      "stage1_confidences": { "glioma": 92.5, "meningioma": 4.1, ... },
      "stage2_confidences": { "glioma": 89.2, "meningioma": 2.5, ... },
      "stage1_top_pct": 92.5,
      "original_image": "data:image/jpeg;base64,...",
      "gradcam_heatmap": "data:image/jpeg;base64,...",
      "heatmaps": {
        "jet": "data:image/jpeg;base64,...",
        "hot": "data:image/jpeg;base64,..."
      }
    }
    ```

### Generate PDF Report
*   **Endpoint:** `POST /api/generate-pdf`
*   **Payload (JSON):**
    ```json
    {
      "result": { "tumor_type": "Glioma", "severity_class": "Glioma", ... },
      "original_image": "data:image/jpeg;base64,...",
      "gradcam_heatmap": "data:image/jpeg;base64,...",
      "patient_name": "P-1042",
      "ref_id": "CASE-7482",
      "physician": "Dr. Sarah Jenkins",
      "notes": "Lesion boundaries visible under TTA.",
      "signature": "Dr. Sarah Jenkins"
    }
    ```
*   **Response:** Binary PDF document stream (`application/pdf`).

---

## 8. Results & Performance Metrics

The double-stage EfficientNet-B2 neural network achieved high-contrast classification boundaries during hold-out validation sweeps:
*   **Overall Accuracy:** 96.5%
*   **Precision:** 95.2%
*   **Recall:** 94.8%
*   **F1-Score:** 95.0%

### Class-wisebreakdowns
*   **Glioma:** 95.3% Precision | 94.7% Recall (High Risk)
*   **Meningioma:** 92.3% Precision | 89.1% Recall (Low-High Risk)
*   **Normal:** 92.8% Precision | 96.9% Recall (No Risk)
*   **Pituitary:** 98.8% Precision | 98.2% Recall (Low Risk)

---

## 9. Screenshots & Placement Suggestions
For demonstration materials, capture high-resolution captures of the following frames and place them under a newly created `docs/assets/` folder, linking them inside this README:
1.  **Dashboard Home:** Highlight stats grid cards and CSE department labels.
    *   *Placement:* `docs/assets/dashboard_home.png`
2.  **MRI Analysis Console:** Highlight uploaded MRI scan side-by-side with the GradCAM activation overlay.
    *   *Placement:* `docs/assets/analysis_console.png`
3.  **Performance Charts:** Highlight Recharts line/bar distributions and 4x4 confusion heatmap.
    *   *Placement:* `docs/assets/performance_charts.png`
4.  **Methodology Page:** Show tabbed interfaces and disclaimers.
    *   *Placement:* `docs/assets/methodology_page.png`

---

## 10. Future Enhancements
*   **3D Volumetric Segmentation:** Integrate a secondary 3D U-Net pipeline to compute total lesion volumes.
*   **DICOM Integration:** Include parsing adapters for medical DICOM images (`pydicom`) directly in the uploader.
*   **SQL Database History:** Implement a persistent database schema (SQLite/PostgreSQL) to store clinical history logs permanently.

---

## 11. References & Citations
1.  Tan, M., & Le, Q. V. (2019). *EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks*. International Conference on Machine Learning (ICML).
2.  Selvaraju, R. R., et al. (2017). *Grad-CAM: Visual Explanations from Deep Networks via Gradient-based Localization*. IEEE International Conference on Computer Vision (ICCV).
3.  FastAPI Web Framework. https://fastapi.tiangolo.com/
4.  Vite Front-end Tooling. https://vite.dev/

---
