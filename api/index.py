import os
import sys
from pathlib import Path

# Agregar la raíz del proyecto al sys.path
root = Path(__file__).resolve().parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

from backend.server import app