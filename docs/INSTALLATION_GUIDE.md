# Installation & Execution Guide — NeuroVision AI

This guide provides instructions for evaluators and examiners to build, install, and run NeuroVision AI on their workstations.

---

## 1. System Requirements

### Minimum Requirements
- **Operating System**: Windows 10/11, macOS 12+, or Ubuntu 20.04+
- **Processor**: Quad-core Intel Core i5 / AMD Ryzen 5 or Apple Silicon M-series
- **Memory**: 8 GB RAM (16 GB recommended for parallel batch testing)
- **Disk Space**: 1.5 GB free space (excludes model weights storage)
- **Software**: 
  - Docker Desktop (Recommended) **OR**
  - Node.js (v18.x or later) & NPM (v9.x or later)
  - Python (v3.10.x or v3.11.x) & Pip

---

## 2. Option A: Containerized Execution (Recommended / Easiest)

Docker Compose bundles NodeJS, Nginx, Python dependencies, and OpenCV graphics layers into isolated containers, eliminating local environment mismatches.

### Step-by-Step Instructions
1. Clone or navigate to the root directory `NeuroVision-AI`.
2. Launch the docker daemon (open Docker Desktop).
3. Open your terminal in the root directory and run:
   ```bash
   docker-compose up --build
   ```
4. Wait for Node compilation and python package installations to complete.
5. Access the application:
   - **React Client Dashboard**: Open [http://localhost](http://localhost) (port 80).
   - **Interactive API Documentation (Swagger)**: Open [http://localhost:8000/docs](http://localhost:8000/docs).
6. To shutdown the containers, run:
   ```bash
   docker-compose down
   ```

---

## 3. Option B: Local Workstation Execution (Non-containerized)

Use this option if you want to inspect development logs and run the dev compilers manually.

### Step 1: Start the FastAPI Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Boot up the Uvicorn web server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
5. Verify it is running by checking the health endpoint: [http://localhost:8000/health](http://localhost:8000/health) (`{"status":"healthy"}`).

### Step 2: Start the React Frontend
1. Open a separate terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install node package dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development compiler:
   ```bash
   npm run dev
   ```
4. Access the client panel at the URL printed in the terminal (usually [http://localhost:5173](http://localhost:5173)).

---

## 4. Troubleshooting Common Issues

### Issue 1: "API is Offline" / Connection status indicator is red
- **Cause**: The React frontend cannot reach the FastAPI server at port 8000.
- **Troubleshooting**:
  - Check if your virtual environment terminal has crashed.
  - Verify that no other process is holding port 8000:
    - *Windows*: `netstat -ano | findstr 8000`
    - *macOS/Linux*: `lsof -i :8000`
  - **Fallback**: Click **"Activate Demo Mode"** on the dashboard. The application will switch to a high-fidelity local simulator, allowing you to test all components (uploader, grids, charts, reports) without the Python backend running!

### Issue 2: OpenCV libGL import error inside Docker
- **Error**: `ImportError: libGL.so.1: cannot open shared object file`
- **Troubleshooting**: 
  - Ensure you run `docker-compose up --build` with the latest Dockerfile. 
  - The latest image has been configured to update apt-get listings and install `libgl1-mesa-glx` and `libglib2.0-0` system modules automatically.

### Issue 3: Port 80 or 8000 is already occupied
- **Troubleshooting**: 
  - Edit the port mappings in `docker-compose.yml` to redirect target bindings (e.g. map frontend to `8080:80` and backend to `8001:8000`), and restart the docker engine.
