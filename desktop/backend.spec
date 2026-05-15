# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec para empaquetar el backend FastAPI como un único ejecutable
(`backend.exe` en Windows) que se incluirá dentro de la aplicación Electron
"Secretaría Común".

Incluye:
  - El módulo `server.py` y sus dependencias.
  - Las plantillas Word `.docx` ya preparadas con placeholders Jinja2.
  - La build estática del frontend React (carpeta `static/`), para que el
    backend pueda servir la UI sin necesidad de un servidor adicional.
"""
import os
import sys
from pathlib import Path

block_cipher = None

ROOT = Path(os.getcwd())
BACKEND_DIR = ROOT / "backend"
FRONTEND_BUILD = ROOT / "frontend" / "build"

datas = []

# Plantillas .docx institucionales
templates_dir = BACKEND_DIR / "templates"
for f in templates_dir.glob("plantilla_*.docx"):
    datas.append((str(f), "templates"))

# Build estático del frontend (lo genera `yarn build` antes del empaquetado)
if FRONTEND_BUILD.exists():
    for root, _dirs, files in os.walk(FRONTEND_BUILD):
        rel = Path(root).relative_to(FRONTEND_BUILD)
        target_dir = str(Path("static") / rel) if str(rel) != "." else "static"
        for file in files:
            datas.append((os.path.join(root, file), target_dir))

# Imports ocultos que PyInstaller no detecta automáticamente
hiddenimports = [
    "uvicorn",
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "docxtpl",
    "docx",
    "lxml",
    "jinja2",
    "babel.numbers",
    "email_validator",
]

a = Analysis(
    [str(BACKEND_DIR / "server.py")],
    pathex=[str(BACKEND_DIR)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["motor", "pymongo", "tkinter"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,  # sin ventana de consola
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    name="backend",
)
