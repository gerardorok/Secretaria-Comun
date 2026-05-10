# Generador de Notificaciones por Aviso - CGR

Aplicación web profesional para automatizar la elaboración de **Notificaciones por Aviso** de la Contraloría General de la República (CGR), conservando exactamente el formato del documento Word institucional.

## Stack

- **Frontend**: React + Tailwind + shadcn/ui (Poppins)
- **Backend**: FastAPI + python-docx-template (`docxtpl`)
- **Base de datos**: MongoDB (registro/auditoría)

## Estructura

```
/app
├── backend/
│   ├── server.py                # API FastAPI
│   ├── prepare_template.py      # Convierte la plantilla original en plantilla con placeholders Jinja2
│   ├── requirements.txt
│   └── templates/
│       ├── AVISO_PRF_FORMATO.docx   # Plantilla original (con valores reales de ejemplo)
│       └── plantilla_aviso.docx     # Plantilla con placeholders {{ NOMBRE }}, etc.
└── frontend/
    └── src/
        ├── App.js
        ├── pages/NotificationGenerator.jsx
        └── components/
            ├── Header.jsx
            ├── Stepper.jsx
            ├── TextField.jsx
            ├── DateField.jsx
            └── PreviewPanel.jsx
```

## Variables de la plantilla

Página 1: `{{NOMBRE}}`, `{{DIRECCION}}`, `{{CIUDAD}}`, `{{NUMERO_AVISO}}`, `{{AUTO}}`, `{{FECHA_AUTO}}`, `{{PRF}}`, `{{ENTIDAD_AFECTADA}}`, `{{PROFERIDO_POR}}`

Página 2: `{{NOTIFICADO}}`, `{{NUMERO_AVISO}}`, `{{FECHA_ELABORACION}}`, `{{PERSONAS_NOTIFICAR}}`, `{{PROVIDENCIA}}`, `{{FECHA_PROVIDENCIA}}`, `{{TIPO_PROVIDENCIA}}`, `{{PRF}}`, `{{ENTIDAD}}`, `{{PROFERIDO_POR}}`, `{{FECHA_CITACION}}`, `{{ANEXO}}`

Los campos `NUMERO_AVISO`, `PRF`, `ENTIDAD` y `PROFERIDO_POR` se reutilizan automáticamente desde la página 1.

## Endpoints

- `GET /api/` — health check
- `GET /api/template/status` — estado de la plantilla
- `POST /api/generate-notification` — recibe los datos del formulario y devuelve el `.docx` final

## Reemplazar la plantilla institucional

1. Sustituya el archivo `/app/backend/templates/AVISO_PRF_FORMATO.docx` por su plantilla oficial.
2. Ajuste los textos de muestra dentro de `prepare_template.py` para que coincidan con los valores reales de la plantilla.
3. Ejecute:
   ```bash
   cd /app/backend && python prepare_template.py
   ```
4. Reinicie el backend:
   ```bash
   sudo supervisorctl restart backend
   ```

## Diseño

Paleta institucional CGR (Manual de Identidad Visual v2 — 2024):

- Azul `#2D3480`
- Amarillo `#F0BA41`
- Rojo `#D63421`
- Tipografía **Poppins**
