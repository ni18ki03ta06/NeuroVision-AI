import io
import base64
import numpy as np
import torch
import matplotlib.pyplot as plt
from PIL import Image
from torchvision import transforms
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image
from backend.app.core.config import IMAGE_SIZE

def get_gradcam_map(model, pil_image, class_idx, image_size=IMAGE_SIZE):
    """
    Extract the raw 2D grayscale GradCAM activation heatmap.
    """
    model.eval()
    # Target layer is the last feature map block
    target_layer = [model.features[-1]]

    transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    tensor = transform(pil_image).unsqueeze(0).to(next(model.parameters()).device)

    cam = GradCAM(model=model, target_layers=target_layer)
    grayscale = cam(
        input_tensor=tensor,
        targets=[ClassifierOutputTarget(class_idx)]
    )
    return grayscale[0]

def overlay_heatmap(pil_image, grayscale_cam, opacity=0.5, colormap_name='jet', image_size=IMAGE_SIZE):
    """
    Blend the original PIL image with the colored colormap overlay.
    """
    resized_img = pil_image.resize((image_size, image_size))
    rgb_img = np.array(resized_img).astype(np.float32) / 255.0
    
    cm = plt.get_cmap(colormap_name)
    colored_cam = cm(grayscale_cam)[:, :, :3]  # Drop alpha
    
    overlay = (1.0 - opacity) * rgb_img + opacity * colored_cam
    overlay = np.clip(overlay, 0.0, 1.0)
    
    return Image.fromarray(np.uint8(255 * overlay))

def pil_to_base64(pil_image, format="JPEG"):
    """
    Converts a PIL image to a Base64-encoded data URI.
    """
    buffered = io.BytesIO()
    # Set quality to 85 to optimize download sizes
    pil_image.save(buffered, format=format, quality=85)
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    mime = f"image/{format.lower()}"
    if format.lower() == "jpg":
        mime = "image/jpeg"
    return f"data:{mime};base64,{img_str}"
