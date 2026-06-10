import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
from tqdm import tqdm
import sys
sys.path.append('..')
from config import *


# ── Metrics tracker ───────────────────────────────────────
class History:
    def __init__(self):
        self.train_loss, self.val_loss = [], []
        self.train_acc,  self.val_acc  = [], []

    def update(self, tl, ta, vl, va):
        self.train_loss.append(tl)
        self.train_acc.append(ta)
        self.val_loss.append(vl)
        self.val_acc.append(va)

    def best_val_acc(self):
        return max(self.val_acc)


# ── One epoch ─────────────────────────────────────────────
def run_epoch(model, loader, criterion,
              optimizer=None, device=DEVICE):
    training = optimizer is not None
    model.train() if training else model.eval()

    total_loss, correct, total = 0.0, 0, 0

    with torch.set_grad_enabled(training):
        for images, labels in tqdm(loader,
                                   leave=False,
                                   desc='train' if training
                                        else 'val  '):
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            loss    = criterion(outputs, labels)

            if training:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

            total_loss += loss.item() * images.size(0)
            preds       = outputs.argmax(dim=1)
            correct    += (preds == labels).sum().item()
            total      += images.size(0)

    avg_loss = total_loss / total
    accuracy = correct   / total
    return avg_loss, accuracy


# ── Early stopping ────────────────────────────────────────
class EarlyStopping:
    def __init__(self, patience=7, min_delta=1e-4):
        self.patience   = patience
        self.min_delta  = min_delta
        self.counter    = 0
        self.best_score = None
        self.stop       = False

    def step(self, val_loss):
        score = -val_loss
        if self.best_score is None:
            self.best_score = score
        elif score < self.best_score + self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.stop = True
        else:
            self.best_score = score
            self.counter    = 0


# ── Full training loop ────────────────────────────────────
def train_model(model, train_loader, val_loader,
                epochs=EPOCHS, lr=LEARNING_RATE,
                save_path=None, class_weights=None):

    criterion = nn.CrossEntropyLoss(
        weight=class_weights.to(DEVICE)
        if class_weights is not None else None,
        label_smoothing=0.1
    )
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad,
               model.parameters()),
        lr=lr, weight_decay=1e-4
    )
    from torch.optim.lr_scheduler import (
        CosineAnnealingLR, LinearLR, SequentialLR, ReduceLROnPlateau
    )

    # 5-epoch linear warmup, then cosine decay
    warmup    = LinearLR(optimizer, start_factor=0.1,
                       end_factor=1.0, total_iters=5)
    cosine    = CosineAnnealingLR(optimizer, T_max=epochs-5, eta_min=1e-6)
    scheduler = SequentialLR(optimizer, schedulers=[warmup, cosine],
                            milestones=[5])
    early_stop    = EarlyStopping(patience=PATIENCE)
    history       = History()
    best_val_acc  = 0.0

    print(f"\n{'='*55}")
    print(f"  Training on {DEVICE} | Epochs: {epochs}")
    print(f"{'='*55}\n")

    for epoch in range(1, epochs + 1):
        train_loss, train_acc = run_epoch(
            model, train_loader, criterion, optimizer
        )
        val_loss, val_acc = run_epoch(
            model, val_loader, criterion
        )

        scheduler.step()
        history.update(train_loss, train_acc,
                        val_loss,   val_acc)
        early_stop.step(val_loss)

        print(f"Epoch {epoch:02d}/{epochs} | "
              f"Train Loss: {train_loss:.4f} "
              f"Acc: {train_acc*100:.2f}% | "
              f"Val Loss: {val_loss:.4f} "
              f"Acc: {val_acc*100:.2f}%", end='')

        # Save best checkpoint
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            if save_path:
                Path(save_path).parent.mkdir(
                    parents=True, exist_ok=True)
                torch.save({
                    'epoch'      : epoch,
                    'model_state': model.state_dict(),
                    'val_acc'    : val_acc,
                    'val_loss'   : val_loss,
                }, save_path)
            print(f"  [Saved Best]", end='')

        print()

        if early_stop.stop:
            print(f"\n[Early Stopping] at epoch {epoch}")
            break

    print(f"\nBest Val Accuracy: {best_val_acc*100:.2f}%")
    return history


# ── Plot training curves ──────────────────────────────────
def plot_history(history, title='Training Curves',
                 save_name='training_curves.png'):
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    epochs    = range(1, len(history.train_loss) + 1)

    # Loss
    axes[0].plot(epochs, history.train_loss,
                 label='Train', color='#1E88E5')
    axes[0].plot(epochs, history.val_loss,
                 label='Val',   color='#E53935')
    axes[0].set_title('Loss',     fontweight='bold')
    axes[0].set_xlabel('Epoch')
    axes[0].legend()
    axes[0].grid(alpha=0.3)

    # Accuracy
    axes[1].plot(epochs,
                 [a * 100 for a in history.train_acc],
                 label='Train', color='#1E88E5')
    axes[1].plot(epochs,
                 [a * 100 for a in history.val_acc],
                 label='Val',   color='#E53935')
    axes[1].set_title('Accuracy (%)', fontweight='bold')
    axes[1].set_xlabel('Epoch')
    axes[1].legend()
    axes[1].grid(alpha=0.3)

    plt.suptitle(title, fontsize=13, fontweight='bold')
    plt.tight_layout()

    save_path = RESULTS_DIR / save_name
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path)
    plt.show()
    print(f"Saved -> {save_path}")


def evaluate_model(model, loader, class_names, device=DEVICE):
    from sklearn.metrics import classification_report
    model.eval()
    all_preds, all_labels = [], []
    with torch.no_grad():
        for images, labels in loader:
            outputs = model(images.to(device))
            preds = outputs.argmax(dim=1).cpu()
            all_preds.extend(preds.numpy())
            all_labels.extend(labels.numpy())
    print(classification_report(all_labels, all_preds,
                                 target_names=class_names))
    return np.array(all_preds), np.array(all_labels)


def plot_confusion_matrix(y_true, y_pred, class_names,
                          save_name='confusion_matrix.png'):
    from sklearn.metrics import ConfusionMatrixDisplay
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(8, 8))
    ConfusionMatrixDisplay.from_predictions(
        y_true, y_pred, display_labels=class_names,
        cmap='Blues', ax=ax, colorbar=False
    )
    plt.tight_layout()
    save_path = RESULTS_DIR / save_name
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=150)
    plt.show()
    print(f"Saved -> {save_path}")