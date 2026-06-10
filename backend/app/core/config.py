import os
from pathlib import Path
import torch

# ── Load environment variables from .env manually ───────────
# Path pointing to backend/app/
APP_DIR = Path(__file__).resolve().parent.parent
# Path pointing to root NeuroVision-AI/
ROOT_DIR = APP_DIR.parent.parent

DOTENV_PATH = ROOT_DIR / 'backend' / '.env'
if DOTENV_PATH.exists():
    with open(DOTENV_PATH, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

# ── Environment Configurations ──────────────────────────────
FASTAPI_ENV = os.getenv('FASTAPI_ENV', 'development')
DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'

# ── Model Sizing and Paths ─────────────────────────────────
model_path_str = os.getenv('MODEL_PATH', './models/')
if model_path_str.startswith('.'):
    MODELS_DIR = (ROOT_DIR / model_path_str).resolve()
else:
    MODELS_DIR = Path(model_path_str).resolve()

DATA_DIR = ROOT_DIR / 'data'
RESULTS_DIR = ROOT_DIR / 'results' / 'plots'

# Ensure model files are findable
TUMOR_CLASSIFIER_PATH = MODELS_DIR / 'tumor_classifier.pth'
SEVERITY_CLASSIFIER_PATH = MODELS_DIR / 'severity_classifier.pth'

# ── Stage 1 — Tumor Type ───────────────────────────────────
TUMOR_CLASSES = ['glioma', 'meningioma', 'notumor', 'pituitary']
NUM_CLASSES = len(TUMOR_CLASSES)

# ── Stage 2 — Severity Label Mapping ───────────────────────
SEVERITY_MAP = {
    'glioma': {'label': 'Glioma', 'risk': '🔴 High — contains Glioblastoma (Grade 4)'},
    'meningioma': {'label': 'Meningioma', 'risk': '🟡 Low-High — ranges Grade 1 to 3'},
    'neurocitoma': {'label': 'Neurocytoma', 'risk': '🟢 Low — usually benign'},
    'schwannoma': {'label': 'Schwannoma', 'risk': '🟢 Low — usually benign'},
    'outros': {'label': 'Other Lesion', 'risk': '🟠 Medium — needs further diagnosis'},
    'normal': {'label': 'Normal', 'risk': '✅ No tumor detected'},
}

# ── Image Settings ─────────────────────────────────────────
IMAGE_SIZE = 224
CHANNELS = 3
MEAN = [0.1835, 0.1835, 0.1836]
STD = [0.1814, 0.1814, 0.1814]

# ── Device ─────────────────────────────────────────────────
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# ── CORS Origins ───────────────────────────────────────────
allowed_origins_str = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173')
CORS_ORIGINS = [origin.strip() for origin in allowed_origins_str.split(',') if origin.strip()]

# Add development defaults
for fallback in ["http://localhost:5173", "http://127.0.0.1:5173", "*"]:
    if fallback not in CORS_ORIGINS:
        CORS_ORIGINS.append(fallback)
