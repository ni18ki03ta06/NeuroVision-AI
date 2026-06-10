from pathlib import Path
import torch

# ── Base Paths ─────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
DATA_DIR    = BASE_DIR / 'data'
MODELS_DIR  = BASE_DIR / 'models'
RESULTS_DIR = BASE_DIR / 'results' / 'plots'

# ── Stage 1 — Tumor Type ───────────────────────────────────
TRAIN_DIR     = DATA_DIR / 'tumor_type' / 'Training'
TEST_DIR      = DATA_DIR / 'tumor_type' / 'Testing'
TUMOR_CLASSES = ['glioma', 'meningioma', 'notumor', 'pituitary']
NUM_CLASSES   = len(TUMOR_CLASSES)

# ── Stage 2 — Severity Dataset Folder Names ────────────────
SEVERITY_DIR  = DATA_DIR / 'severity'

SEVERITY_FOLDERS = {
    'glioma': [
        'Glioma (Astrocitoma, Ganglioglioma, Glioblastoma, Oligodendroglioma, Ependimoma) T1',
        'Glioma (Astrocitoma, Ganglioglioma, Glioblastoma, Oligodendroglioma, Ependimoma) T1C+',
        'Glioma (Astrocitoma, Ganglioglioma, Glioblastoma, Oligodendroglioma, Ependimoma) T2',
    ],
    'meningioma': [
        'Meningioma (de Baixo Grau, Atípico, Anaplásico, Transicional) T1',
        'Meningioma (de Baixo Grau, Atípico, Anaplásico, Transicional) T1C+',
        'Meningioma (de Baixo Grau, Atípico, Anaplásico, Transicional) T2',
    ],
    'neurocitoma': [
        'Neurocitoma (Central - Intraventricular, Extraventricular) T1',
        'Neurocitoma (Central - Intraventricular, Extraventricular) T1C+',
        'Neurocitoma (Central - Intraventricular, Extraventricular) T2',
    ],
    'normal': [
        'NORMAL T1',
        'NORMAL T2',
    ],
    'outros': [
        'Outros Tipos de Lesões (Abscessos, Cistos, Encefalopatias Diversas) T1',
        'Outros Tipos de Lesões (Abscessos, Cistos, Encefalopatias Diversas) T1C+',
        'Outros Tipos de Lesões (Abscessos, Cistos, Encefalopatias Diversas) T2',
    ],
    'schwannoma': [
        'Schwannoma (Acustico, Vestibular - Trigeminal) T1',
        'Schwannoma (Acustico, Vestibular - Trigeminal) T1C+',
        'Schwannoma (Acustico, Vestibular - Trigeminal) T2',
    ],
}

# ── Severity Label Mapping ─────────────────────────────────
# Mapped from medical knowledge of subtypes
SEVERITY_MAP = {
    'glioma'      : {'label': 'Glioma',      'risk': '🔴 High — contains Glioblastoma (Grade 4)'},
    'meningioma'  : {'label': 'Meningioma',  'risk': '🟡 Low-High — ranges Grade 1 to 3'},
    'neurocitoma' : {'label': 'Neurocytoma', 'risk': '🟢 Low — usually benign'},
    'schwannoma'  : {'label': 'Schwannoma',  'risk': '🟢 Low — usually benign'},
    'outros'      : {'label': 'Other Lesion','risk': '🟠 Medium — needs further diagnosis'},
    'normal'      : {'label': 'Normal',      'risk': '✅ No tumor detected'},
}

# ── Image Settings ─────────────────────────────────────────
IMAGE_SIZE = 224
CHANNELS   = 3
MEAN       = [0.1835, 0.1835, 0.1836]
STD        = [0.1814, 0.1814, 0.1814]

# ── Training Settings ──────────────────────────────────────
BATCH_SIZE    = 16   # smaller batch = better generalization
EPOCHS        = 60
LEARNING_RATE = 1e-4
PATIENCE      = 8     # increase early stopping patience from 5
VAL_SPLIT     = 0.2
SEED          = 42

# ── Device ─────────────────────────────────────────────────
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
if __name__ == '__main__':
    print(f"Using device: {DEVICE}")