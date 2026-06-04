from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image
import numpy as np
from PIL import Image
import torch
from torchvision import transforms

def get_gradcam_overlay(model, pil_image, class_idx, image_size=224):
    model.eval()
    target_layer = [model.features[-1]]

    transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485,0.456,0.406],
                             [0.229,0.224,0.225]),
    ])
    tensor = transform(pil_image).unsqueeze(0)

    rgb_img = np.array(
        pil_image.resize((image_size, image_size))
    ).astype(np.float32) / 255.0

    cam = GradCAM(model=model, target_layers=target_layer)
    grayscale = cam(
        input_tensor=tensor,
        targets=[ClassifierOutputTarget(class_idx)]
    )
    overlay = show_cam_on_image(rgb_img, grayscale[0], use_rgb=True)
    return Image.fromarray(overlay)
