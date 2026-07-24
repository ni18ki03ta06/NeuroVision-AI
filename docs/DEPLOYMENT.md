# 🌐 NeuroVision AI — Comprehensive Deployment Guide

This guide details step-by-step instructions for deploying **NeuroVision AI** to production cloud platforms (Vercel, Render, Railway, AWS, Docker VPS).

---

## ⚡ Option 1: Free Cloud Deployment (Vercel + Render)

This is the recommended free-tier cloud deployment setup.

### A. Deploy FastAPI Backend (Render.com)
1. Sign up for a free account at [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `ni18ki03ta06/NeuroVision-AI`.
4. Configure service settings:
   - **Name:** `neurovision-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Docker` (or `Python 3`)
   - **Dockerfile Path:** `Dockerfile`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `FASTAPI_ENV` = `production`
   - `ALLOWED_ORIGINS` = `https://your-vercel-app.vercel.app,http://localhost:5173`
6. Click **Deploy Web Service**.
7. Copy your assigned backend URL (e.g., `https://neurovision-backend.onrender.com`).

---

### B. Deploy React Frontend (Vercel.com)
1. Sign up for a free account at [Vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `ni18ki03ta06/NeuroVision-AI`.
4. Configure framework settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables** and add:
   - `REACT_APP_API_BASE_URL` = `https://neurovision-backend.onrender.com/api`
6. Click **Deploy**.
7. Your app is live at `https://your-app-name.vercel.app`!

---

## 🐳 Option 2: Docker VPS Deployment (AWS EC2 / DigitalOcean)

Ideal for single-server VPS hosting with Docker Compose.

1. SSH into your VPS server:
   ```bash
   ssh ubuntu@your-server-ip
   ```
2. Install Docker & Docker Compose:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   ```
3. Clone your repository:
   ```bash
   git clone https://github.com/ni18ki03ta06/NeuroVision-AI.git
   cd NeuroVision-AI
   ```
4. Build and start containers in detached mode:
   ```bash
   docker-compose up -d --build
   ```
5. Access your application:
   - **Frontend App:** `http://your-server-ip`
   - **Backend API:** `http://your-server-ip:8000/docs`

---

## 🛠️ Option 3: Single Server Production (Nginx + Uvicorn PM2)

### Backend Service (PM2)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name "neurovision-backend"
```

### Frontend Static Build (Nginx)
```bash
cd frontend
npm install
npm run build
```
Copy `dist` files to Nginx web root `/var/www/html` and configure SSL certificate via Certbot (`sudo certbot --nginx`).
