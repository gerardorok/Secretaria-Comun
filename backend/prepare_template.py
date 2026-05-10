"""
Script de preparación de la plantilla.

Lee el archivo original AVISO_PRF_FORMATO.docx (que contiene valores de ejemplo
reales) y produce plantilla_aviso.docx con placeholders Jinja2 ({{ VAR }}) que
serán renderizados por docxtpl, conservando exactamente el formato original
(fuentes, tamaños, negrillas, espaciados, tablas, márgenes, alineación, saltos
de página, encabezados y pies de página).

Ejecutar una sola vez:
    cd /app/backend && python prepare_template.py
"""
from docx import Document
from pathlib import Path

ROOT = Path(__file__).parent
SOURCE = ROOT / "templates" / "AVISO_PRF_FORMATO.docx"
TARGET = ROOT / "templates" / "plantilla_aviso.docx"


def replace_in_runs(paragraph, old: str, new: str) -> bool:
    """Reemplaza `old` por `new` en un párrafo, posiblemente atravesando
    varios runs, conservando el formato del primer run que coincide.

    Devuelve True si se realizó algún reemplazo.
    """
    full_text = "".join(r.text for r in paragraph.runs)
    if old not in full_text:
        return False

    start = full_text.find(old)
    end = start + len(old)

    pos = 0
    first_match_done = False
    for run in paragraph.runs:
        run_start = pos
        run_end = pos + len(run.text)
        pos = run_end

        # Sin solape con la región a reemplazar
        if run_end <= start or run_start >= end:
            continue

        if not first_match_done:
            # Este run contiene el inicio del match: insertamos `new`
            prefix = run.text[: max(0, start - run_start)]
            suffix = ""
            if run_end > end:
                suffix = run.text[end - run_start :]
            run.text = prefix + new + suffix
            first_match_done = True
        else:
            # Run intermedio o final (parte ya insertada en el primero)
            if run_end > end:
                run.text = run.text[end - run_start :]
            else:
                run.text = ""
    return True


def replace_in_paragraph_repeated(paragraph, old: str, new: str) -> int:
    """Reemplaza todas las ocurrencias no superpuestas de `old` por `new`.

    Si `old` está contenido en `new` solo se realiza una sustitución (la
    primera) para evitar bucles infinitos donde el reemplazo regenera el
    patrón buscado.
    """
    if old in new:
        return 1 if replace_in_runs(paragraph, old, new) else 0
    count = 0
    while replace_in_runs(paragraph, old, new):
        count += 1
        if count > 20:
            break
    return count


# Reemplazos exclusivos para PÁRRAFOS (página 1 + bloque texto página 2)
# El orden importa: cadenas más largas primero para evitar colisiones.
PARAGRAPH_REPLACEMENTS_GLOBAL = [
    # Párrafo 18 (cuerpo página 1)
    ("AVISO No. 029-2026", "AVISO No. {{NUMERO_AVISO}}"),
    ("AUTO No. 503", "{{AUTO}}"),
    ("27 de noviembre de 2025", "{{FECHA_AUTO}}"),
    ("PRF-80472-2025-48809", "PRF-{{PRF}}"),
    (
        "GERENCIA DEPARTAMENTAL COLEGIADA DE MAGDALENA DE LA CONTRALORIA GENERAL DE LA REPUBLICA",
        "{{PROFERIDO_POR}}",
    ),
    ("MUNICIPIO DE SANTA ANA", "{{ENTIDAD_AFECTADA}}"),
    # Dirección y ciudad (párrafos 10, 11)
    ("Diagonal 4 a 2 a – 22, Barrio Loma Fresca", "{{DIRECCION}}"),
    ("Ariguaní, Magdalena", "{{CIUDAD}}"),
]

# Reemplazos por índice de párrafo (cuando el mismo texto aparece en lugares
# distintos y debe mapearse a variables diferentes).
PARAGRAPH_REPLACEMENTS_BY_INDEX = {
    # Párrafo 4: "Santa Marta D.T.C.H., " -> añadir fecha de elaboración
    4: [("Santa Marta D.T.C.H., ", "Santa Marta D.T.C.H., {{FECHA_ELABORACION}}")],
    # Párrafo 8: encabezado de tratamiento (institucional inclusivo)
    8: [("Señor", "Señor(a)")],
    # Párrafo 9: nombre del destinatario (página 1)
    9: [("RODRIGO ALBERTO ANDRADE ORTIZ", "{{NOMBRE}}")],
    # Párrafo 43: persona notificada (página 2)
    43: [("RODRIGO ALBERTO ANDRADE ORTIZ", "{{NOTIFICADO}}")],
}

# Reemplazos para celdas de TABLAS (página 2). Largos primero.
TABLE_REPLACEMENTS = [
    # Más específicas primero
    ("AUTO No. 503 en 19 folios", "{{ANEXO}}"),
    (
        "CONSORCIO VIDA, INVERSIONES Y PROYECTOS ALTAMIRA SAS, RODRIGO ALBERTO ANDRADE ORTIZ, WUILLMAN ANTONIO BERMUDEZ SILVERA, HUGUES LEONARDO BARROS MENDOZA",
        "{{PERSONAS_NOTIFICAR}}",
    ),
    (
        "GERENCIA DEPARTAMENTAL COLEGIADA DE MAGDALENA DE LA CONTRALORIA GENERAL DE LA REPUBLICA",
        "{{PROFERIDO_POR}}",
    ),
    ("Aviso No.029-2026", "Aviso No.{{NUMERO_AVISO}}"),
    ("26 de enero de 2026", "{{FECHA_ELABORACION}}"),
    ("AUTO No. 503", "{{PROVIDENCIA}}"),
    ("27 de noviembre de 2025", "{{FECHA_PROVIDENCIA}}"),
    ("AUTO DE APERTURA", "{{TIPO_PROVIDENCIA}}"),
    ("80472-2025-48809", "{{PRF}}"),
    ("MUNICIPIO DE SANTA ANA", "{{ENTIDAD}}"),
    ("19/12/2025", "{{FECHA_CITACION}}"),
]


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"No se encontró la plantilla original: {SOURCE}")

    doc = Document(str(SOURCE))

    # 1. Reemplazos por índice de párrafo (NOMBRE vs NOTIFICADO usan el mismo texto)
    for idx, replacements in PARAGRAPH_REPLACEMENTS_BY_INDEX.items():
        if idx < len(doc.paragraphs):
            par = doc.paragraphs[idx]
            for old, new in replacements:
                replace_in_paragraph_repeated(par, old, new)

    # 2. Reemplazos globales en todos los párrafos
    for par in doc.paragraphs:
        for old, new in PARAGRAPH_REPLACEMENTS_GLOBAL:
            replace_in_paragraph_repeated(par, old, new)

    # 3. Reemplazos en celdas de tablas.
    # Nota: usamos los elementos XML directamente para identificar celdas
    # fusionadas sin depender de id() (que recicla direcciones).
    processed_tcs = []
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                tc = cell._tc
                if any(tc is x for x in processed_tcs):
                    continue
                processed_tcs.append(tc)

                for par in cell.paragraphs:
                    for old, new in TABLE_REPLACEMENTS:
                        replace_in_paragraph_repeated(par, old, new)

    doc.save(str(TARGET))
    print(f"OK - Plantilla generada: {TARGET}")

    # Verificación: contamos placeholders insertados
    out = Document(str(TARGET))
    full = []
    for p in out.paragraphs:
        full.append(p.text)
    for t in out.tables:
        for r in t.rows:
            for c in r.cells:
                full.append(c.text)
    text = "\n".join(full)
    expected = [
        "{{NOMBRE}}",
        "{{DIRECCION}}",
        "{{CIUDAD}}",
        "{{NUMERO_AVISO}}",
        "{{AUTO}}",
        "{{FECHA_AUTO}}",
        "{{PRF}}",
        "{{ENTIDAD_AFECTADA}}",
        "{{PROFERIDO_POR}}",
        "{{NOTIFICADO}}",
        "{{FECHA_ELABORACION}}",
        "{{PERSONAS_NOTIFICAR}}",
        "{{PROVIDENCIA}}",
        "{{FECHA_PROVIDENCIA}}",
        "{{TIPO_PROVIDENCIA}}",
        "{{ENTIDAD}}",
        "{{FECHA_CITACION}}",
        "{{ANEXO}}",
    ]
    print("\nPlaceholders encontrados:")
    for v in expected:
        present = "OK" if v in text else "FALTA"
        print(f"  {present:6} {v}")


if __name__ == "__main__":
    main()
