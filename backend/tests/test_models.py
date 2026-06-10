import pytest
import sys
from pathlib import Path

# Ensure backend folder is in path for imports
sys.path.append(str(Path(__file__).resolve().parent.parent))

from src.pipeline import load_models

def test_load_models():
    """
    Verifies that the double-stage classifier models load properly 
    or fail with a clear weights missing notification.
    """
    s1, s2, err = load_models()
    
    if err:
        assert s1 is None or s2 is None
        assert "not found" in err.lower()
    else:
        assert s1 is not None
        assert s2 is not None
        # Verify both classifiers are set to evaluation mode
        assert not s1.training
        assert not s2.training
