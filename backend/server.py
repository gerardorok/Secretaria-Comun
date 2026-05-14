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
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

from docxtpl import DocxTemplate
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# MongoDB connection (mantenido por compatibilidad con la plantilla del entorno)
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

TEMPLATES_DIR = ROOT_DIR / "templates"
TEMPLATE_FILE = TEMPLATES_DIR / "plantilla_aviso.docx"
TEMPLATE_ELECTRONICA_NATURAL = TEMPLATES_DIR / "plantilla_electronica_natural.docx"
TEMPLATE_ELECTRONICA_JURIDICA = TEMPLATES_DIR / "plantilla_electronica_juridica.docx"

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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
