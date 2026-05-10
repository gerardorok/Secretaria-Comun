import { format } from "date-fns";
import { es } from "date-fns/locale";

const LABELS = {
  NOMBRE: "Nombre",
  DIRECCION: "Dirección",
  CIUDAD: "Ciudad",
  NUMERO_AVISO: "Número de Aviso",
  AUTO: "Auto",
  FECHA_AUTO: "Fecha del Auto",
  PRF: "Número del PRF",
  ENTIDAD_AFECTADA: "Entidad Afectada",
  PROFERIDO_POR: "Acto Administrativo Proferido Por",
  NOTIFICADO: "Procede a Notificar a",
  FECHA_ELABORACION: "Fecha de Elaboración del Documento",
  PERSONAS_NOTIFICAR: "Personas a Notificar",
  PROVIDENCIA: "Providencia No.",
  FECHA_PROVIDENCIA: "Fecha Providencias",
  TIPO_PROVIDENCIA: "Tipo de Providencias",
  FECHA_CITACION: "Fecha de envío de citación para notificación personal",
  ANEXO: "Anexo Providencia En",
};

const PAGE_1_FIELDS = [
  "NOMBRE",
  "DIRECCION",
  "CIUDAD",
  "NUMERO_AVISO",
  "AUTO",
  "FECHA_AUTO",
  "PRF",
  "ENTIDAD_AFECTADA",
  "PROFERIDO_POR",
];

const PAGE_2_FIELDS = [
  "FECHA_ELABORACION",
  "PERSONAS_NOTIFICAR",
  "TIPO_PROVIDENCIA",
  "FECHA_CITACION",
  "ANEXO",
];

const formatValue = (key, value) => {
  if (!value) return "—";
  if (key === "FECHA_AUTO" || key === "FECHA_ELABORACION" || key === "FECHA_PROVIDENCIA") {
    return value instanceof Date
      ? format(value, "d 'de' MMMM 'de' yyyy", { locale: es })
      : value;
  }
  if (key === "FECHA_CITACION") {
    return value instanceof Date
      ? format(value, "dd/MM/yyyy", { locale: es })
      : value;
  }
  return value;
};

function PreviewBlock({ title, fields, data, accent }) {
  return (
    <div
      className="border border-slate-200 rounded-lg p-5 bg-white"
      data-testid={`preview-block-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
          {title}
        </h4>
      </div>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        {fields.map((key) => (
          <div key={key} className="space-y-0.5">
            <dt className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              {LABELS[key]}
            </dt>
            <dd className="text-sm text-slate-800 break-words">
              {formatValue(key, data[key])}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function PreviewPanel({ data }) {
  return (
    <div className="space-y-4" data-testid="preview-panel">
      <PreviewBlock
        title="Página 1 · Notificación por Aviso"
        fields={PAGE_1_FIELDS}
        data={data}
        accent="#2D3480"
      />
      <PreviewBlock
        title="Página 2 · Cuadro de Notificación"
        fields={PAGE_2_FIELDS}
        data={data}
        accent="#F0BA41"
      />
    </div>
  );
}
