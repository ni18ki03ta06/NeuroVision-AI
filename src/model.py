import torch
import torch.nn as nn
from torchvision import models
import sys
sys.path.append('..')
from config import *


def build_tumor_classifier(num_classes=NUM_CLASSES,
                            pretrained=True):
    """
    EfficientNet-B2 fine-tuned for tumor type classification.
    """
    weights = models.EfficientNet_B2_Weights.DEFAULT \
              if pretrained else None
    model   = models.efficientnet_b2(weights=weights)

    # Freeze all backbone layers
    for param in model.parameters():
        param.requires_grad = False

    # Replace classifier head
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Linear(in_features, 512),
        nn.BatchNorm1d(512),
        nn.SiLU(),
        nn.Dropout(p=0.3),
        nn.Linear(512, num_classes),
    )

    # Unfreeze last 2 blocks + classifier
    for name, param in model.named_parameters():
        if any(x in name for x in
               ['features.7', 'features.8', 'classifier']):
            param.requires_grad = True

    total     = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters()
                    if p.requires_grad)
    print(f"Model     : EfficientNet-B2")
    print(f"Total params    : {total:,}")
    print(f"Trainable params: {trainable:,} "
          f"({trainable/total*100:.1f}%)")

    return model.to(DEVICE)