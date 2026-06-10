import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import torch
import numpy as np
from src.dataset import get_severity_dataloaders, SeverityDataset
from src.model import build_tumor_classifier
from src.train import train_model, plot_history, evaluate_model, plot_confusion_matrix
from config import *

def main():
    # Set seed for reproducibility
    torch.manual_seed(SEED)
    np.random.seed(SEED)

    print("Starting Severity Model Training...")

    # 1. Load Data
    train_loader, val_loader, test_loader = get_severity_dataloaders(batch_size=BATCH_SIZE)

    # Sub-sample datasets to speed up training on CPU (10% of the dataset)
    train_ds = train_loader.dataset
    val_ds = val_loader.dataset
    test_ds = test_loader.dataset

    generator = torch.Generator().manual_seed(SEED)
    train_indices = torch.randperm(len(train_ds), generator=generator)[:int(len(train_ds) * 0.1)]
    val_indices = torch.randperm(len(val_ds), generator=generator)[:int(len(val_ds) * 0.1)]
    test_indices = torch.randperm(len(test_ds), generator=generator)[:int(len(test_ds) * 0.1)]

    from torch.utils.data import Subset, DataLoader
    train_sub = Subset(train_ds, train_indices)
    val_sub = Subset(val_ds, val_indices)
    test_sub = Subset(test_ds, test_indices)

    train_loader = DataLoader(train_sub, batch_size=BATCH_SIZE, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_sub, batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True)
    test_loader = DataLoader(test_sub, batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True)

    # 2. Calculate Class Weights
    severity_ds = SeverityDataset(SEVERITY_DIR, SEVERITY_FOLDERS)
    counts = severity_ds.get_class_counts()
    total = sum(counts)
    weights = [total / (len(counts) * c) for c in counts]
    class_weights = torch.tensor(weights, dtype=torch.float32)

    print("Class weights:")
    for cls, w in zip(severity_ds.class_names, weights):
        print(f"  {cls:12s}: {w:.4f}")

    # 3. Build Model (6 classes for Stage 2)
    model = build_tumor_classifier(num_classes=6, pretrained=True)

    # 4. Train Model
    # We train for 5 epochs to ensure it completes reasonably fast on CPU while saving a valid model
    history = train_model(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        epochs=5,
        lr=LEARNING_RATE,
        save_path=MODELS_DIR / 'severity_classifier.pth',
        class_weights=class_weights,
    )

    # 5. Plot training history
    plot_history(history, title='Severity Classifier — Training', save_name='severity_training_curves.png')

    # 6. Evaluate Model on Test Set
    ckpt = torch.load(MODELS_DIR / 'severity_classifier.pth', map_location=DEVICE)
    model.load_state_dict(ckpt['model_state'])
    print(f"\nLoaded checkpoint from epoch {ckpt['epoch']} | Val acc: {ckpt['val_acc']*100:.2f}%")

    print("\n--- Test Set Evaluation ---")
    y_pred, y_true = evaluate_model(model, test_loader, severity_ds.class_names, device=DEVICE)

    # 7. Plot Confusion Matrix
    plot_confusion_matrix(y_true, y_pred, severity_ds.class_names, save_name='severity_confusion_matrix.png')
    print("Training and evaluation completed successfully!")

if __name__ == '__main__':
    main()
