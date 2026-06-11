# System Architecture — NeuroVision AI

This document details the software architecture, data flow, and database models implemented in the decoupled NeuroVision AI stack.

---

## 1. System Block Diagram
```mermaid
graph TD
    subgraph Frontend [React Client SPA]
        UI[User Interface / Tab Router]
        Store[LocalStorage State]
        Toast[react-hot-toast]
        Loader[Skeletons / Framer Motion]
    end

    subgraph Backend [FastAPI Server]
        API[API Endpoints Gateway]
        Engine[Inference Engine]
        PDF[FPDF2 Report Generator]
        DB[(SQLite Case Logs)]
    end

    UI -->|1. POST scan bytes| API
    API -->|2. Preprocess slice| Engine
    Engine -->|3. Evaluate Tensors| PyTorch[PyTorch Model Weights]
    PyTorch -->|4. Log logits| Engine
    Engine -->|5. Compute Activation Map| OpenCV[OpenCV GradCAM Processor]
    OpenCV -->|6. Return Base64 Result| API
    API -->|7. Auto-save Case| DB
    API -->|8. Send JSON Response| UI
    UI -->|9. Render overlays| UI
    UI -->|10. POST metadata & heatmaps| PDF
    PDF -->|11. Stream PDF Bytes| UI
```

---

## 2. Component Blueprints

### 2.1 Frontend Architecture (React SPA)
The client-side dashboard is built as an optimized Single Page Application (SPA) utilizing Vite for asset bundling:
- **`App.jsx`**: Manages global routing, active case states, health polling intervals, and sets up `<Toaster />` providers.
- **`components/`**: Reusable interface widgets:
  - `ImageUploader.jsx` & `Dropzone.jsx`: Keyboard-accessible file inputs handling drag-and-drop actions.
  - `CaseQueue.jsx`: Tracks uploaded scans.
  - `ConfidenceBar.jsx`: Visual progress indicators showing model probability percentages.
  - `MetricsCard.jsx` & `GaugeChart.jsx`: Performance summaries rendering metrics on viewport reveals.
- **`pages/`**: View panels swapped inside the layout main frame:
  - `AnalysisPage.jsx`: Active workspace hosting uploader, settings sliders, skeletons, and mock simulation overrides.
  - `HistoryPage.jsx`: Tabular list of past reports pulled from the SQLite database.
  - `ResultsPage.jsx`: Diagnostics telemetry curves.
- **`utils/errorHandler.js`**: Friendly Clinician Error Parser.

### 2.2 Backend Architecture (FastAPI ASGI)
The server layer acts as an asynchronous API gateway communicating with scientific libraries:
- **`main.py`**: Boots FastAPI, configures CORS, and exposes endpoints:
  - `GET /health`: Uptime checking.
  - `POST /api/predict`: Runs single MRI image inference.
  - `POST /api/predict/batch`: Sequentially/parallelly uploads and processes scan array.
  - `POST /api/generate-pdf`: Compiles scan findings and clinician notes to a PDF document.
  - `GET /api/history`: Retrieves saved patient metrics database records.
- **`src/report.py`**: Compiles PDF streams with explicit DejaVuSans font configuration. Strips color emojis to prevent compiler failure.
- **`src/model.py`**: Instantiates double backbone classifiers (ResNet/EfficientNet models) in PyTorch evaluation mode.

---

## 3. Detailed Data Flow
```mermaid
sequenceDiagram
    autonumber
    actor Clinician
    participant UI as React Client Dashboard
    participant API as FastAPI Server
    participant Model as PyTorch Models
    participant DB as SQLite DB

    Clinician->>UI: Drop scan files & click "Analyze Scan"
    UI->>UI: Render Loading Skeletons
    UI->>API: POST /api/predict (Multipart form file)
    API->>API: Read bytes & check modality settings
    API->>Model: Forward normalized tensors
    Model->>Model: Run Stage 1 (Tumor Type classification)
    Model->>Model: Run Stage 2 (Severity Grade classification)
    Model->>API: Return logits & GradCAM weights matrices
    API->>API: Overlay colored jet heatmap
    API->>DB: Log case details (Type, Grade, Date, Confidences)
    DB-->>API: Confirm transaction success
    API-->>UI: Return JSON payload with prediction & Base64 images
    UI->>UI: Replace skeletons with Results & Heatmaps
    Clinician->>UI: Enter physician signature & click "Report PDF"
    UI->>API: POST /api/generate-pdf (Report payload)
    API->>API: Strip emoji Unicode characters & compile PDF pages
    API-->>UI: Send PDF binary byte stream
    UI->>Clinician: Download neurovision_report.pdf
```

---

## 4. SQLite Database Schema
The database logging leverages a lightweight SQLite table schema. 

### 4.1 `predictions` Table Definition
```sql
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(50) PRIMARY KEY,       -- Format: CASE-XXXXXX-PATIENTID
    patient_id VARCHAR(50) NOT NULL,   -- Patient identifier
    tumor_type VARCHAR(50) NOT NULL,   -- Classified Tumor (Glioma, Meningioma, etc.)
    severity_class VARCHAR(50) NOT NULL,-- Classified Severity (Grade I, Grade II, etc.)
    risk_level VARCHAR(20) NOT NULL,   -- Assessment (LOW, MEDIUM, HIGH)
    top_confidence REAL NOT NULL,      -- Model probability (e.g. 95.6)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Datetime of inference
);
```
