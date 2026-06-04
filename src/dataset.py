import torch
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import transforms
from pathlib import Path
from PIL import Image
import sys
sys.path.append('..')
from config import *

# ── Transforms ─────────────────────────────────────────────
def get_transforms(mode='train'):
    if mode == 'train':
        return transforms.Compose([
            transforms.Resize((int(IMAGE_SIZE * 1.15), int(IMAGE_SIZE * 1.15))),
            transforms.RandomCrop(IMAGE_SIZE),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomVerticalFlip(p=0.3),
            transforms.RandomRotation(degrees=20),
            transforms.ColorJitter(
                brightness=0.3, contrast=0.3,
                saturation=0.2, hue=0.05
            ),
            transforms.RandomGrayscale(p=0.1),
            transforms.RandomAffine(
                degrees=0, translate=(0.1, 0.1),
                scale=(0.9, 1.1)
            ),
            transforms.ToTensor(),
            transforms.Normalize(MEAN, STD),
            transforms.RandomErasing(p=0.2, scale=(0.02, 0.1)),
        ])
    else:
        return transforms.Compose([
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(MEAN, STD),
        ])


# ── Stage 1 Dataset ────────────────────────────────────────
class TumorDataset(Dataset):
    def __init__(self, split_dir, class_names, transform=None):
        self.transform   = transform
        self.class_names = class_names
        self.paths       = []
        self.labels      = []

        for idx, cls in enumerate(class_names):
            cls_dir = Path(split_dir) / cls
            imgs    = list(cls_dir.glob('*.jpg')) + \
                      list(cls_dir.glob('*.jpeg')) + \
                      list(cls_dir.glob('*.png')) + \
                      list(cls_dir.glob('*.webp'))
            self.paths.extend(imgs)
            self.labels.extend([idx] * len(imgs))

        print(f"Loaded {len(self.paths)} images "
              f"from {split_dir}")

    def __len__(self):
        return len(self.paths)

    def __getitem__(self, idx):
        img   = Image.open(self.paths[idx]).convert('RGB')
        label = self.labels[idx]
        if self.transform:
            img = self.transform(img)
        return img, label

    def get_class_counts(self):
        return [self.labels.count(i)
                for i in range(len(self.class_names))]


# ── Stage 2 Severity Dataset ───────────────────────────────
class SeverityDataset(Dataset):
    def __init__(self, severity_dir, folders_dict,
                 transform=None):
        """
        severity_dir  : path to data/severity/
        folders_dict  : SEVERITY_FOLDERS from config
        transform     : image transforms
        """
        self.transform   = transform
        self.paths       = []
        self.labels      = []
        self.class_names = list(folders_dict.keys())

        for idx, (cls, folders) in enumerate(
                folders_dict.items()):
            for folder in folders:
                folder_path = Path(severity_dir) / folder
                if not folder_path.exists():
                    print(f"  [Warning] Not found: {folder}")
                    continue
                imgs = list(folder_path.glob('*.jpg')) + \
                       list(folder_path.glob('*.jpeg')) + \
                       list(folder_path.glob('*.png')) + \
                       list(folder_path.glob('*.webp'))
                self.paths.extend(imgs)
                self.labels.extend([idx] * len(imgs))

        print(f"Severity dataset: {len(self.paths)} images "
              f"| {len(self.class_names)} classes")

    def __len__(self):
        return len(self.paths)

    def __getitem__(self, idx):
        img   = Image.open(self.paths[idx]).convert('RGB')
        label = self.labels[idx]
        if self.transform:
            img = self.transform(img)
        return img, label

    def get_class_counts(self):
        return [self.labels.count(i)
                for i in range(len(self.class_names))]


class TransformSubset(Dataset):
    def __init__(self, subset, transform):
        self.subset = subset
        self.transform = transform
    def __len__(self): return len(self.subset)
    def __getitem__(self, idx):
        img, label = self.subset[idx]
        if self.transform: img = self.transform(img)
        return img, label


# ── DataLoader Builder ─────────────────────────────────────
def get_tumor_dataloaders(batch_size=BATCH_SIZE):
    train_ds = TumorDataset(
        TRAIN_DIR, TUMOR_CLASSES,
        transform=get_transforms('train')
    )
    test_ds = TumorDataset(
        TEST_DIR, TUMOR_CLASSES,
        transform=get_transforms('val')
    )

    # Split test into val + test
    val_size  = int(len(test_ds) * 0.5)
    test_size = len(test_ds) - val_size
    generator = torch.Generator().manual_seed(SEED)
    val_ds, test_ds = random_split(
        test_ds, [val_size, test_size], generator=generator
    )

    train_loader = DataLoader(
        train_ds, batch_size=batch_size,
        shuffle=True,  num_workers=2, pin_memory=True
    )
    val_loader = DataLoader(
        val_ds,   batch_size=batch_size,
        shuffle=False, num_workers=2, pin_memory=True
    )
    test_loader = DataLoader(
        test_ds,  batch_size=batch_size,
        shuffle=False, num_workers=2, pin_memory=True
    )

    print(f"\nDataLoaders ready:")
    print(f"  Train : {len(train_ds)} images")
    print(f"  Val   : {len(val_ds)} images")
    print(f"  Test  : {len(test_ds)} images")

    return train_loader, val_loader, test_loader


def get_severity_dataloaders(batch_size=BATCH_SIZE):
    full_ds = SeverityDataset(
        SEVERITY_DIR, SEVERITY_FOLDERS,
        transform=None
    )

    # 70 / 15 / 15 split
    total      = len(full_ds)
    train_size = int(total * 0.70)
    val_size   = int(total * 0.15)
    test_size  = total - train_size - val_size

    generator = torch.Generator().manual_seed(SEED)
    train_sub, val_sub, test_sub = random_split(
        full_ds, [train_size, val_size, test_size], generator=generator
    )

    train_ds = TransformSubset(train_sub, get_transforms('train'))
    val_ds   = TransformSubset(val_sub, get_transforms('val'))
    test_ds  = TransformSubset(test_sub, get_transforms('val'))

    train_loader = DataLoader(
        train_ds, batch_size=batch_size,
        shuffle=True,  num_workers=2, pin_memory=True
    )
    val_loader = DataLoader(
        val_ds,   batch_size=batch_size,
        shuffle=False, num_workers=2, pin_memory=True
    )
    test_loader = DataLoader(
        test_ds,  batch_size=batch_size,
        shuffle=False, num_workers=2, pin_memory=True
    )

    print(f"\nSeverity DataLoaders ready:")
    print(f"  Train : {train_size} images")
    print(f"  Val   : {val_size} images")
    print(f"  Test  : {test_size} images")

    return train_loader, val_loader, test_loader