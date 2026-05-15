# Secretaría Común · App de escritorio

Aplicación de escritorio Windows que empaqueta el sistema de generación de
documentos institucionales de la CGR para funcionar **100% sin internet**.

## Arquitectura

```
┌──────────────────────────────────────────────────────┐
│  Secretaria-Comun-Setup.exe (Instalador NSIS)        │
│                                                      │
│  ├── Aplicación Electron (envoltorio nativo)         │
│  │     • Inicia el backend al abrir la app           │
│  │     • Lo cierra al salir                          │
│  │                                                   │
│  └── backend.exe (PyInstaller bundle)                │
│        • FastAPI + docxtpl + python-docx             │
│        • Plantillas .docx empaquetadas               │
│        • Sirve la UI React desde /static/            │
└──────────────────────────────────────────────────────┘
```

- Frontend y backend viven en el **mismo origen** (`http://127.0.0.1:<puerto-libre>`)
  para evitar problemas de CORS.
- Cada arranque busca un puerto libre aleatorio.
- MongoDB es opcional: si no está disponible (modo offline), los endpoints
  generan los documentos sin registrar la auditoría.

## Estructura

```
/app/desktop
├── electron/
│   └── main.js            # Proceso principal de Electron
├── package.json           # Config Electron + electron-builder (NSIS)
├── backend.spec           # PyInstaller spec
└── INSTRUCCIONES.md       # Guía para el usuario final
```

## Build local (solo para desarrolladores)

Requiere Windows + Python 3.11 + Node.js 20.

```bash
# 1. Build del frontend (genera /app/frontend/build)
cd frontend
REACT_APP_BACKEND_URL="" yarn build

# 2. Bundle del backend (genera /app/dist-backend/backend/)
cd ..
pip install pyinstaller==6.10.0
pyinstaller --noconfirm --clean --distpath dist-backend desktop/backend.spec

# 3. Empaquetado Electron (genera /app/desktop/dist/Secretaria-Comun-Setup-*.exe)
cd desktop
npm install
npm run dist
```

## Build automatizado (recomendado)

Push al repositorio en GitHub → la acción
[`build-desktop.yml`](../.github/workflows/build-desktop.yml) corre en un
runner Windows y publica el instalador como artifact descargable.

Ver [`INSTRUCCIONES.md`](INSTRUCCIONES.md) para el flujo completo orientado
al usuario final no técnico.
