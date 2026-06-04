import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import torch
import numpy as np
from src.dataset import get_tumor_dataloaders, TumorDataset
from src.model import build_tumor_classifier
from src.train import train_model
from config import *

def main():
    # Set seed for reproducibility
    torch.manual_seed(SEED)
    np.random.seed(SEED)

    print("Running quick tumor classifier training to match new head architecture...")

    # 1. Load Data
    train_loader, val_loader, test_loader = get_tumor_dataloaders(batch_size=BATCH_SIZE)

    # Sub-sample to 10% for speed
    train_ds = train_loader.dataset
    val_ds = val_loader.dataset
    
    generator = torch.Generator().manual_seed(SEED)
    train_indices = torch.randperm(len(train_ds), generator=generator)[:int(len(train_ds) * 0.1)]
    val_indices = torch.randperm(len(val_ds), generator=generator)[:int(len(val_ds) * 0.1)]

    from torch.utils.data import Subset, DataLoader
    train_sub = Subset(train_ds, train_indices)
    val_sub = Subset(val_ds, val_indices)

    train_loader = DataLoader(train_sub, batch_size=BATCH_SIZE, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_sub, batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True)

    # 2. Class weights
    tumor_ds = TumorDataset(TRAIN_DIR, TUMOR_CLASSES)
    counts = tumor_ds.get_class_counts()
    total = sum(counts)
    weights = [total / (len(counts) * c) for c in counts]
    class_weights = torch.tensor(weights, dtype=torch.float32)

    # 3. Build Model
    model = build_tumor_classifier(num_classes=NUM_CLASSES, pretrained=True)

    # 4. Train Model for 1 epoch
    history = train_model(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        epochs=1,
        lr=LEARNING_RATE,
        save_path=MODELS_DIR / 'tumor_classifier.pth',
        class_weights=class_weights,
    )
    print("Quick tumor classifier training finished successfully!")

if __name__ == '__main__':
    main()
