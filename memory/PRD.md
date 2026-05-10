# PRD - Generador de Notificaciones por Aviso (CGR)

## Problema original

> Necesito que desarrolles una aplicación web profesional para automatizar la elaboración de NOTIFICACIONES POR AVISO de la Contraloría General de la República (CGR), utilizando un documento Word .docx como plantilla base. La aplicación debe permitir diligenciar un formulario y generar automáticamente un documento .docx final, conservando EXACTAMENTE el formato original del archivo Word (fuentes, tamaños, negrillas, espaciados, tablas, márgenes, alineación, saltos de página, encabezados, pies de página, estructura completa). NO debe reconstruir el documento desde cero. Debe usar el archivo original como plantilla y únicamente reemplazar variables.

## Decisiones del usuario (capturadas en el primer turno)

- **Backend**: Python/FastAPI con `python-docx-template` (docxtpl)
- **Plantilla**: archivo `AVISO_PRF_FORMATO.docx` adjuntado por el usuario, predefinida en el servidor
- **Diseño**: colores oficiales de la CGR (Manual de Identidad Visual v2 — 2024) — azul `#2D3480`, amarillo `#F0BA41`, rojo `#D63421`, fuente Poppins
- **Validación**: todos los campos son obligatorios

## Arquitectura

- **Frontend**: React 19 + Tailwind + shadcn/ui + sonner (toasts) + react-day-picker (calendarios)
- **Backend**: FastAPI + docxtpl + python-docx + Motor (MongoDB para auditoría)
- **DB**: MongoDB (`notifications` collection, registro automático cada generación)

## Flujo de la solución

1. `prepare_template.py` lee la plantilla original con valores reales y produce `plantilla_aviso.docx` con placeholders Jinja2 (`{{ NOMBRE }}`, etc.) preservando los runs y formato original.
2. El frontend muestra un formulario en 2 páginas (9 + 8 campos). Los campos `NUMERO_AVISO`, `PRF`, `ENTIDAD_AFECTADA` y `PROFERIDO_POR` se reutilizan automáticamente en la página 2.
3. Al pulsar **GENERAR AVISO**, el frontend hace `POST /api/generate-notification` con responseType blob y descarga el `.docx` resultante.
4. El backend renderiza la plantilla con docxtpl (auto-mapea `ENTIDAD_AFECTADA → ENTIDAD` para reutilización), y devuelve el archivo con `Content-Disposition: attachment; filename="AVISO_<NUMERO_AVISO>_<NOMBRE>.docx"`.

## Variables de la plantilla

`{{NOMBRE}}` `{{DIRECCION}}` `{{CIUDAD}}` `{{NUMERO_AVISO}}` `{{AUTO}}` `{{FECHA_AUTO}}` `{{PRF}}` `{{ENTIDAD_AFECTADA}}` `{{PROFERIDO_POR}}` `{{NOTIFICADO}}` `{{FECHA_ELABORACION}}` `{{PERSONAS_NOTIFICAR}}` `{{PROVIDENCIA}}` `{{FECHA_PROVIDENCIA}}` `{{TIPO_PROVIDENCIA}}` `{{ENTIDAD}}` `{{FECHA_CITACION}}` `{{ANEXO}}`

## Implementado (10-feb-2026)

- [x] Plantilla institucional con 18 placeholders generada automáticamente
- [x] Endpoints: `GET /api/`, `GET /api/template/status`, `POST /api/generate-notification`
- [x] Pydantic con `min_length=1` para validación obligatoria → 422 si falta algún campo
- [x] Auto-reutilización `ENTIDAD = ENTIDAD_AFECTADA` en el contexto de renderizado
- [x] Frontend de 2 páginas con stepper, navegación Anterior/Siguiente, validación con toast
- [x] DateField con popover + calendar shadcn (formato textual español "27 de noviembre de 2025" / numérico "DD/MM/AAAA")
- [x] Vista previa opcional en Dialog con bloques por página
- [x] Botón GENERAR AVISO con descarga automática .docx (filename derivado de aviso + nombre)
- [x] Diseño institucional CGR: header con franja tricolor, paleta oficial, Poppins
- [x] Auditoría en MongoDB (`db.notifications`)
- [x] Tests automatizados (10/10 backend pytest + flujos frontend Playwright)

## Backlog priorizado

### P1 (mejoras valiosas)
- Permitir al usuario subir su propia plantilla `.docx` desde la UI (en vez de la predefinida en el servidor)
- Histórico de notificaciones generadas (consultable desde el frontend)
- Plantillas múltiples (selector de plantilla institucional según tipo de proceso)

### P2 (calidad de vida)
- Exportar también a PDF como secundario (opt-in)
- Auto-rellenar la fecha de elaboración con la fecha actual
- Importar datos desde CSV/Excel para generación masiva
- Migrar de `on_event('shutdown')` a lifespan handler (FastAPI moderno)

## Persona

- **Funcionario asignado a Secretaría Común** del Grupo de Responsabilidad Fiscal en una Gerencia Departamental de la CGR. Necesita producir múltiples notificaciones por aviso al día, manteniendo el formato institucional inmutable.

## Próximos pasos

- Validar el diseño con el usuario y recolectar feedback de funcionarios reales
- Considerar P1 según prioridades del usuario
