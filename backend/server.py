"""
Backend FastAPI para automatizar la elaboración de NOTIFICACIONES POR AVISO
de la Contraloría General de la República (CGR).

La generación del documento se realiza con docxtpl (python-docx-template) sobre
un archivo .docx institucional almacenado como plantilla, lo que garantiza que
se conserva exactamente el formato original (fuentes, tamaños, negrillas,
espaciados, tablas, márgenes, alineación, saltos de página, encabezados y
pies de página).
"""

import io
import logging
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

from docxtpl import DocxTemplate
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

# Detectar si estamos corriendo como ejecutable empaquetado (PyInstaller).
# En ese caso `sys._MEIPASS` apunta al directorio temporal con los recursos.
IS_FROZEN = getattr(sys, "frozen", False)
if IS_FROZEN:
    BASE_DIR = Path(sys._MEIPASS)
else:
    BASE_DIR = Path(__file__).parent

ROOT_DIR = Path(__file__).parent
env_path = ROOT_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# MongoDB connection (opcional). En modo desktop/offline puede no estar
# disponible: se usa solo para auditoría y los endpoints capturan la
# excepción al insertar, así que nunca bloquea la generación de documentos.
mongo_url = os.environ.get("MONGO_URL", "")
db_name = os.environ.get("DB_NAME", "secretaria_comun")
client = None
db = None
if mongo_url:
    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=1000)
        db = client[db_name]
    except Exception as ex:  # noqa: BLE001
        logger.warning("MongoDB no disponible (modo offline): %s", ex)
        client = None
        db = None

TEMPLATES_DIR = BASE_DIR / "templates"
TEMPLATE_FILE = TEMPLATES_DIR / "plantilla_aviso.docx"
TEMPLATE_ELECTRONICA_NATURAL = TEMPLATES_DIR / "plantilla_electronica_natural.docx"
TEMPLATE_ELECTRONICA_JURIDICA = TEMPLATES_DIR / "plantilla_electronica_juridica.docx"
TEMPLATE_CITACION_BASE = TEMPLATES_DIR / "plantilla_citacion_base.docx"
TEMPLATE_CITACION_VINCULACION = TEMPLATES_DIR / "plantilla_citacion_vinculacion.docx"

MESES_ES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


def fecha_es_hoy() -> str:
    """Devuelve la fecha actual en formato 'd de mes de YYYY' (español)."""
    now = datetime.now(timezone.utc)
    return f"{now.day} de {MESES_ES[now.month - 1]} de {now.year}"

app = FastAPI(title="Generador de Notificaciones por Aviso - CGR")
api_router = APIRouter(prefix="/api")


# --------------------------- Modelos ----------------------------------------
class NotificationData(BaseModel):
    """Datos del formulario para generar la notificación por aviso."""

    # Página 1
    NOMBRE: str = Field(..., min_length=1)
    DIRECCION: str = Field(..., min_length=1)
    CIUDAD: str = Field(..., min_length=1)
    NUMERO_AVISO: str = Field(..., min_length=1)
    AUTO: str = Field(..., min_length=1)
    FECHA_AUTO: str = Field(..., min_length=1)
    PRF: str = Field(..., min_length=1)
    ENTIDAD_AFECTADA: str = Field(..., min_length=1)
    PROFERIDO_POR: str = Field(..., min_length=1)

    # Página 2 (los campos NUMERO_AVISO, PRF, ENTIDAD y PROFERIDO_POR se reusan)
    # Página 2 (NOMBRE/NOTIFICADO, NUMERO_AVISO, AUTO/PROVIDENCIA,
    # FECHA_AUTO/FECHA_PROVIDENCIA, PRF, ENTIDAD_AFECTADA/ENTIDAD y
    # PROFERIDO_POR se reutilizan automáticamente desde la página 1)
    FECHA_ELABORACION: str = Field(..., min_length=1)
    PERSONAS_NOTIFICAR: str = Field(..., min_length=1)
    TIPO_PROVIDENCIA: str = Field(..., min_length=1)
    FECHA_CITACION: str = Field(..., min_length=1)
    ANEXO: str = Field(..., min_length=1)


# --------------------------- Utilidades -------------------------------------
def slugify_filename(value: str) -> str:
    """Convierte un texto en un nombre de archivo seguro."""
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^\w\s-]", "", value).strip()
    value = re.sub(r"[\s-]+", "_", value)
    return value or "AVISO"


# --------------------------- Endpoints --------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Generador de Notificaciones por Aviso CGR - API activa"}


@api_router.get("/template/status")
async def template_status():
    """Indica si la plantilla está disponible en el servidor."""
    return {
        "template_path": str(TEMPLATE_FILE),
        "exists": TEMPLATE_FILE.exists(),
        "size_bytes": TEMPLATE_FILE.stat().st_size if TEMPLATE_FILE.exists() else 0,
    }


@api_router.post("/generate-notification")
async def generate_notification(data: NotificationData):
    """Renderiza la plantilla institucional con los datos del formulario y
    devuelve el archivo .docx final para descarga."""

    if not TEMPLATE_FILE.exists():
        raise HTTPException(
            status_code=500,
            detail=(
                "La plantilla institucional no está disponible en el servidor. "
                "Ejecute prepare_template.py para generarla."
            ),
        )

    try:
        tpl = DocxTemplate(str(TEMPLATE_FILE))
        # docxtpl espera un dict; usamos los nombres exactos de las variables
        # tal como aparecen en la plantilla ({{ NOMBRE }}, {{ DIRECCION }}, ...)
        context = data.model_dump()
        # Reutilización automática de campos compartidos página 1 -> página 2.
        # En la plantilla la página 2 usa {{ ENTIDAD }}, {{ PROVIDENCIA }},
        # {{ FECHA_PROVIDENCIA }} y {{ NOTIFICADO }}.
        context["ENTIDAD"] = context["ENTIDAD_AFECTADA"]
        context["PROVIDENCIA"] = context["AUTO"]
        context["FECHA_PROVIDENCIA"] = context["FECHA_AUTO"]
        context["NOTIFICADO"] = context["NOMBRE"]
        tpl.render(context)

        buffer = io.BytesIO()
        tpl.save(buffer)
        buffer.seek(0)

        # Persistencia ligera del registro (auditoría) - no bloquea si falla
        try:
            await db.notifications.insert_one(
                {
                    **context,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }
            )
        except Exception as ex:  # noqa: BLE001
            logger.warning("No se pudo registrar en MongoDB: %s", ex)

        filename = f"AVISO_{slugify_filename(data.NUMERO_AVISO)}_{slugify_filename(data.NOMBRE)}.docx"

        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except HTTPException:
        raise
    except Exception as ex:  # noqa: BLE001
        logger.exception("Error generando notificación: %s", ex)
        raise HTTPException(status_code=500, detail=f"Error generando documento: {ex}")


# ============================ NOTIFICACIÓN ELECTRÓNICA =====================
class ElectronicaData(BaseModel):
    """Datos del formulario para generar la notificación electrónica."""

    persona_juridica: bool = False

    NOMBRE: str = Field(..., min_length=1)
    CORREO: str = Field(..., min_length=1)
    TIPO_PROVIDENCIA: str = Field(..., min_length=1)
    NUMERO_PROVIDENCIA: str = Field(..., min_length=1)
    FECHA_PROVIDENCIA: str = Field(..., min_length=1)
    NOMBRE_PROVIDENCIA: str = Field(..., min_length=1)
    PRF: str = Field(..., min_length=1)
    ENTIDAD_AFECTADA: str = Field(..., min_length=1)
    PROFERIDO_POR: str = Field(..., min_length=1)
    NUMERO_FOLIOS: str = Field(..., min_length=1)


@api_router.post("/electronica/generate")
async def generate_electronica(data: ElectronicaData):
    """Genera el documento de Notificación Electrónica.

    Selecciona automáticamente la plantilla institucional según el flag
    `persona_juridica` (False = natural, True = jurídica)."""

    tpl_path = (
        TEMPLATE_ELECTRONICA_JURIDICA
        if data.persona_juridica
        else TEMPLATE_ELECTRONICA_NATURAL
    )
    if not tpl_path.exists():
        raise HTTPException(
            status_code=500,
            detail=(
                f"La plantilla institucional no está disponible ({tpl_path.name}). "
                "Ejecute prepare_electronica.py para generarla."
            ),
        )

    try:
        tpl = DocxTemplate(str(tpl_path))
        context = data.model_dump()
        # La fecha de elaboración se asigna automáticamente con la fecha actual
        context["FECHA_ELABORACION"] = fecha_es_hoy()
        tpl.render(context)

        buffer = io.BytesIO()
        tpl.save(buffer)
        buffer.seek(0)

        # Auditoría
        try:
            await db.electronica_notifications.insert_one(
                {
                    **context,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }
            )
        except Exception as ex:  # noqa: BLE001
            logger.warning("No se pudo registrar en MongoDB: %s", ex)

        kind = "JURIDICA" if data.persona_juridica else "NATURAL"
        filename = f"NOTIFICACION_ELECTRONICA_{kind}_{slugify_filename(data.PRF)}_{slugify_filename(data.NOMBRE)}.docx"

        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except HTTPException:
        raise
    except Exception as ex:  # noqa: BLE001
        logger.exception("Error generando notificación electrónica: %s", ex)
        raise HTTPException(status_code=500, detail=f"Error generando documento: {ex}")


# ============================== CITACIÓN A NOTIFICACIÓN PERSONAL ============
class CitacionData(BaseModel):
    """Datos del formulario para generar la Citación a Notificación Personal.

    Cuando `vinculacion=True` se utiliza la plantilla con una segunda
    providencia. El campo CORREO es OPCIONAL: si viene vacío, la línea
    del correo desaparece del documento generado sin dejar líneas en
    blanco (gracias a la directiva paragraph-level de docxtpl).
    """

    vinculacion: bool = False

    NOMBRE: str = Field(..., min_length=1)
    DIRECCION: str = Field(..., min_length=1)
    CIUDAD: str = Field(..., min_length=1)
    CORREO: str = ""  # opcional
    TIPO_PROVIDENCIA: str = Field(..., min_length=1)
    NUMERO_PROVIDENCIA: str = Field(..., min_length=1)
    FECHA_PROVIDENCIA: str = Field(..., min_length=1)
    NOMBRE_PROVIDENCIA: str = Field(..., min_length=1)
    PRF: str = Field(..., min_length=1)
    ENTIDAD_AFECTADA: str = Field(..., min_length=1)
    PROFERIDO_POR: str = Field(..., min_length=1)

    # Campos exclusivos de vinculación (opcionales si no se usa vinculación)
    TIPO_PROVIDENCIA_2: str = ""
    NUMERO_PROVIDENCIA_2: str = ""
    FECHA_PROVIDENCIA_2: str = ""
    NOMBRE_PROVIDENCIA_2: str = ""


@api_router.post("/citacion/generate")
async def generate_citacion(data: CitacionData):
    """Genera el documento de Citación a Notificación Personal.

    Selecciona automáticamente la plantilla institucional según el flag
    `vinculacion` (False = base, True = vinculación con segunda providencia).
    """

    if data.vinculacion:
        # Validamos los campos de la segunda providencia
        missing = [
            name for name in ("TIPO_PROVIDENCIA_2", "NUMERO_PROVIDENCIA_2",
                              "FECHA_PROVIDENCIA_2", "NOMBRE_PROVIDENCIA_2")
            if not getattr(data, name, "").strip()
        ]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Faltan campos de la segunda providencia: "
                    + ", ".join(missing)
                ),
            )
        tpl_path = TEMPLATE_CITACION_VINCULACION
    else:
        tpl_path = TEMPLATE_CITACION_BASE

    if not tpl_path.exists():
        raise HTTPException(
            status_code=500,
            detail=(
                f"La plantilla institucional no está disponible ({tpl_path.name}). "
                "Ejecute prepare_citacion.py para generarla."
            ),
        )

    try:
        tpl = DocxTemplate(str(tpl_path))
        context = data.model_dump()
        context["FECHA_ELABORACION"] = fecha_es_hoy()
        # Si no es vinculación, las variables _2 quedan vacías pero como la
        # plantilla base no las contiene, no afectan el render.
        tpl.render(context)

        buffer = io.BytesIO()
        tpl.save(buffer)
        buffer.seek(0)

        try:
            await db.citaciones.insert_one(
                {
                    **context,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }
            )
        except Exception as ex:  # noqa: BLE001
            logger.warning("No se pudo registrar en MongoDB: %s", ex)

        kind = "VINCULACION" if data.vinculacion else "BASE"
        filename = (
            f"CITACION_{kind}_{slugify_filename(data.PRF)}_{slugify_filename(data.NOMBRE)}.docx"
        )

        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except HTTPException:
        raise
    except Exception as ex:  # noqa: BLE001
        logger.exception("Error generando citación: %s", ex)
        raise HTTPException(status_code=500, detail=f"Error generando citación: {ex}")


app.include_router(api_router)

# CORS: la aplicación no usa cookies ni autenticación, así que mantenemos
# `allow_credentials=False` para poder devolver `Access-Control-Allow-Origin: *`
# (la combinación `*` + credentials es rechazada por el navegador según la
# especificación CORS).
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


# En modo desktop (PyInstaller) el backend también sirve los archivos
# estáticos del frontend React (compilado a /static/). En modo web normal,
# Kubernetes/Nginx se encarga del frontend y este bloque no aplica.
STATIC_DIR = BASE_DIR / "static"
if STATIC_DIR.exists():
    app.mount(
        "/",
        StaticFiles(directory=str(STATIC_DIR), html=True),
        name="static",
    )


@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()


if __name__ == "__main__":
    # Permite arrancar el backend como ejecutable independiente
    # (modo desktop/Electron) con un puerto configurable.
    import argparse
    import uvicorn

    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8001)
    args = parser.parse_args()
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")
