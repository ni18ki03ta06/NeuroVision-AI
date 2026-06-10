import pytest
import io
import sys
from pathlib import Path
from PIL import Image
from fastapi.testclient import TestClient

# Ensure backend folder is in path for imports
sys.path.append(str(Path(__file__).resolve().parent.parent))

from main import app

@pytest.fixture
def client():
    """Returns a TestClient instance for the FastAPI app."""
    return TestClient(app)

@pytest.fixture
def sample_image():
    """Generates a dummy 224x224 RGB image for testing."""
    return Image.new('RGB', (224, 224), color='red')

@pytest.fixture
def sample_image_bytes(sample_image):
    """Converts the dummy image to bytes format."""
    buf = io.BytesIO()
    sample_image.save(buf, format='JPEG')
    return buf.getvalue()
