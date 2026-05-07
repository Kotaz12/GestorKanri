"""Vercel serverless entry point para FastAPI."""
import os
import sys
from pathlib import Path

# Configurar el path para que encuentre la carpeta 'backend'
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

# Definir la variable BACKEND para evitar el NameError
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from backend.server import app