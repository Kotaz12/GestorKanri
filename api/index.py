"""Vercel serverless entry point para FastAPI."""
import os
import sys
from pathlib import Path

# Agregar la raíz del proyecto al path para encontrar la carpeta 'backend'
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from backend.server import app