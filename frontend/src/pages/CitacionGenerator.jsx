import { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileDown,
  Send,
  Eye,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/Header";
import TextField from "@/components/TextField";
import DateField from "@/components/DateField";
import ProferidoPorField from "@/components/ProferidoPorField";
import { DEFAULT_PROFERIDO_POR } from "@/modules/defaults";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const initialState = {
  vinculacion: false,
  NOMBRE: "",
  DIRECCION: "",
  CIUDAD: "",
  CORREO: "",
  TIPO_PROVIDENCIA: "",
  NUMERO_PROVIDENCIA: "",
  FECHA_PROVIDENCIA: null,
  NOMBRE_PROVIDENCIA: "",
  PRF: "",
  ENTIDAD_AFECTADA: "",
  PROFERIDO_POR: DEFAULT_PROFERIDO_POR,
  TIPO_PROVIDENCIA_2: "",
  NUMERO_PROVIDENCIA_2: "",
  FECHA_PROVIDENCIA_2: null,
  NOMBRE_PROVIDENCIA_2: "",
};

const BASE_REQUIRED = [
  "NOMBRE",
  "DIRECCION",
  "CIUDAD",
  "TIPO_PROVIDENCIA",
  "NUMERO_PROVIDENCIA",
  "FECHA_PROVIDENCIA",
  "NOMBRE_PROVIDENCIA",
  "PRF",
  "ENTIDAD_AFECTADA",
  "PROFERIDO_POR",
];

const VINCULACION_REQUIRED = [
  "TIPO_PROVIDENCIA_2",
  "NUMERO_PROVIDENCIA_2",
  "FECHA_PROVIDENCIA_2",
  "NOMBRE_PROVIDENCIA_2",
];

const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const accent = "#F0BA41";
const accentDark = "#7a5b16";

export default function CitacionGenerator() {
  const [data, setData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [proferidoUseDefault, setProferidoUseDefault] = useState(true);

  const update = (key) => (value) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const e = {};
    const required = [
      ...BASE_REQUIRED,
      ...(data.vinculacion ? VINCULACION_REQUIRED : []),
    ];
    required.forEach((f) => {
      const v = data[f];
      if (v === null || v === undefined || (typeof v === "string" && !v.trim())) {
        e[f] = "Este campo es obligatorio";
      }
    });
    // Correo opcional pero si está, debe ser válido
    if (data.CORREO && !isValidEmail(data.CORREO.trim())) {
      e.CORREO = "Ingrese un correo válido o déjelo vacío";
    }
    return e;
  };

  const buildPayload = () => ({
    vinculacion: data.vinculacion,
    NOMBRE: data.NOMBRE.trim(),
    DIRECCION: data.DIRECCION.trim(),
    CIUDAD: data.CIUDAD.trim(),
    CORREO: data.CORREO.trim(),
    TIPO_PROVIDENCIA: data.TIPO_PROVIDENCIA.trim(),
    NUMERO_PROVIDENCIA: data.NUMERO_PROVIDENCIA.trim(),
    FECHA_PROVIDENCIA: data.FECHA_PROVIDENCIA
      ? format(data.FECHA_PROVIDENCIA, "d 'de' MMMM 'de' yyyy", { locale: es })
      : "",
    NOMBRE_PROVIDENCIA: data.NOMBRE_PROVIDENCIA.trim(),
    PRF: data.PRF.trim(),
    ENTIDAD_AFECTADA: data.ENTIDAD_AFECTADA.trim(),
    PROFERIDO_POR: data.PROFERIDO_POR.trim(),
    TIPO_PROVIDENCIA_2: data.TIPO_PROVIDENCIA_2.trim(),
    NUMERO_PROVIDENCIA_2: data.NUMERO_PROVIDENCIA_2.trim(),
    FECHA_PROVIDENCIA_2: data.FECHA_PROVIDENCIA_2
      ? format(data.FECHA_PROVIDENCIA_2, "d 'de' MMMM 'de' yyyy", { locale: es })
      : "",
    NOMBRE_PROVIDENCIA_2: data.NOMBRE_PROVIDENCIA_2.trim(),
  });

  const handleGenerate = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      toast.error("Complete todos los campos obligatorios correctamente.");
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/citacion/generate`,
        buildPayload(),
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      let filename = "CITACION_NOTIFICACION_PERSONAL.docx";
      const cd = response.headers["content-disposition"];
      if (cd) {
        const m = cd.match(/filename="?([^";]+)"?/);
        if (m && m[1]) filename = m[1];
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Citación generada y descargada correctamente.");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Error desconocido al generar el documento.";
      toast.error(`No se pudo generar la citación: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="citacion-page">
      <Header moduleTitle="Citación a Notificación Personal" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <section
          className="mb-8 flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between"
          data-testid="hero-section"
        >
          <div className="max-w-2xl">
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em] mb-2"
              style={{ color: accentDark }}
            >
              Secretaría Común · Grupo de Responsabilidad Fiscal
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Generar{" "}
              <span style={{ color: accentDark }}>
                Citación a Notificación Personal
              </span>
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Cita al destinatario para que comparezca personalmente. Active
              la opción <strong>Vinculación</strong> cuando se trate de la
              vinculación de un nuevo presunto responsable con una segunda
              providencia.
            </p>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white"
            data-testid="template-info-card"
          >
            <Send
              className="w-8 h-8 flex-shrink-0"
              style={{ color: accentDark }}
            />
            <div className="text-xs">
              <p className="font-semibold text-slate-700">
                Plantilla institucional
              </p>
              <p className="text-slate-500">
                {data.vinculacion
                  ? "Citación con vinculación"
                  : "Citación base"}
              </p>
            </div>
          </div>
        </section>

        <Card className="cgr-card border-slate-200">
          <CardContent className="p-6 sm:p-8">
            {/* Vinculación toggle */}
            <div
              className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row mb-6 p-4 rounded-lg border border-slate-200 bg-slate-50"
              data-testid="vinculacion-toggle-wrapper"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: data.vinculacion
                      ? "rgba(240,186,65,0.25)"
                      : "rgba(45,52,128,0.08)",
                  }}
                >
                  <LinkIcon
                    className="w-5 h-5"
                    style={{
                      color: data.vinculacion ? accentDark : "#2D3480",
                    }}
                    strokeWidth={2.2}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="vinculacion"
                    className="text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    Vinculación
                  </Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {data.vinculacion
                      ? "Se usará el formato con segunda providencia (vinculación e imputación)."
                      : "Por defecto se usa el formato base de citación con una sola providencia."}
                  </p>
                </div>
              </div>
              <Switch
                id="vinculacion"
                checked={data.vinculacion}
                onCheckedChange={(v) => update("vinculacion")(v)}
                data-testid="switch-vinculacion"
                style={
                  data.vinculacion
                    ? { backgroundColor: accent }
                    : undefined
                }
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold text-slate-800"
                data-testid="form-title"
              >
                Datos del destinatario y providencia
              </h3>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(240,186,65,0.18)",
                  color: accentDark,
                }}
              >
                {data.vinculacion ? "14 campos" : "10 campos"}
              </span>
            </div>
            <Separator className="mb-5" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <TextField
                  id="NOMBRE"
                  label="Nombre del destinatario"
                  value={data.NOMBRE}
                  onChange={update("NOMBRE")}
                  placeholder="Ej: CRISTIANO RONALDO DOS SANTOS"
                  error={errors.NOMBRE}
                  testId="input-nombre"
                />
              </div>
              <TextField
                id="DIRECCION"
                label="Dirección"
                value={data.DIRECCION}
                onChange={update("DIRECCION")}
                placeholder="Ej: Carrera 12 No. 15 – 64"
                error={errors.DIRECCION}
                testId="input-direccion"
              />
              <TextField
                id="CIUDAD"
                label="Ciudad"
                value={data.CIUDAD}
                onChange={update("CIUDAD")}
                placeholder="Ej: Santa Marta, Magdalena"
                error={errors.CIUDAD}
                testId="input-ciudad"
              />
              <div className="md:col-span-2">
                <TextField
                  id="CORREO"
                  label="Correo electrónico (opcional)"
                  value={data.CORREO}
                  onChange={update("CORREO")}
                  placeholder="Déjelo vacío si el auto no contiene correo"
                  error={errors.CORREO}
                  testId="input-correo"
                  required={false}
                  helper="Si no se diligencia, la línea del correo no aparecerá en el documento generado."
                />
              </div>

              {/* Primera providencia */}
              <div
                className="md:col-span-2 flex items-center gap-2 mt-2"
                data-testid="providencia-1-divider"
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: accentDark }}
                >
                  {data.vinculacion ? "Primera providencia" : "Providencia"}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <TextField
                id="TIPO_PROVIDENCIA"
                label="Tipo de providencia"
                value={data.TIPO_PROVIDENCIA}
                onChange={update("TIPO_PROVIDENCIA")}
                placeholder="Ej: AUTO"
                error={errors.TIPO_PROVIDENCIA}
                testId="input-tipo-providencia"
              />
              <TextField
                id="NUMERO_PROVIDENCIA"
                label="Número de providencia"
                value={data.NUMERO_PROVIDENCIA}
                onChange={update("NUMERO_PROVIDENCIA")}
                placeholder="Ej: 419"
                error={errors.NUMERO_PROVIDENCIA}
                testId="input-numero-providencia"
              />
              <DateField
                id="FECHA_PROVIDENCIA"
                label="Fecha de providencia"
                value={data.FECHA_PROVIDENCIA}
                onChange={update("FECHA_PROVIDENCIA")}
                error={errors.FECHA_PROVIDENCIA}
                testId="input-fecha-providencia"
              />
              <div />
              <div className="md:col-span-2">
                <TextField
                  id="NOMBRE_PROVIDENCIA"
                  label="Nombre completo de la providencia"
                  value={data.NOMBRE_PROVIDENCIA}
                  onChange={update("NOMBRE_PROVIDENCIA")}
                  placeholder="Ej: POR MEDIO DEL CUAL SE ORDENA LA APERTURA DEL PROCESO DE RESPONSABILIDAD FISCAL"
                  error={errors.NOMBRE_PROVIDENCIA}
                  testId="input-nombre-providencia"
                  multiline
                  rows={3}
                />
              </div>

              {/* Segunda providencia (solo si vinculación) */}
              {data.vinculacion && (
                <>
                  <div
                    className="md:col-span-2 flex items-center gap-2 mt-2"
                    data-testid="providencia-2-divider"
                  >
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: accentDark }}
                    >
                      Segunda providencia (vinculación)
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <TextField
                    id="TIPO_PROVIDENCIA_2"
                    label="Tipo de segunda providencia"
                    value={data.TIPO_PROVIDENCIA_2}
                    onChange={update("TIPO_PROVIDENCIA_2")}
                    placeholder="Ej: AUTO"
                    error={errors.TIPO_PROVIDENCIA_2}
                    testId="input-tipo-providencia-2"
                  />
                  <TextField
                    id="NUMERO_PROVIDENCIA_2"
                    label="Número de segunda providencia"
                    value={data.NUMERO_PROVIDENCIA_2}
                    onChange={update("NUMERO_PROVIDENCIA_2")}
                    placeholder="Ej: 013"
                    error={errors.NUMERO_PROVIDENCIA_2}
                    testId="input-numero-providencia-2"
                  />
                  <DateField
                    id="FECHA_PROVIDENCIA_2"
                    label="Fecha de segunda providencia"
                    value={data.FECHA_PROVIDENCIA_2}
                    onChange={update("FECHA_PROVIDENCIA_2")}
                    error={errors.FECHA_PROVIDENCIA_2}
                    testId="input-fecha-providencia-2"
                  />
                  <div />
                  <div className="md:col-span-2">
                    <TextField
                      id="NOMBRE_PROVIDENCIA_2"
                      label="Nombre completo de la segunda providencia"
                      value={data.NOMBRE_PROVIDENCIA_2}
                      onChange={update("NOMBRE_PROVIDENCIA_2")}
                      placeholder="Ej: POR MEDIO DEL CUAL SE VINCULA E IMPUTA EN EL PROCESO DE RESPONSABILIDAD FISCAL"
                      error={errors.NOMBRE_PROVIDENCIA_2}
                      testId="input-nombre-providencia-2"
                      multiline
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Datos del proceso */}
              <div
                className="md:col-span-2 flex items-center gap-2 mt-2"
                data-testid="proceso-divider"
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: accentDark }}
                >
                  Datos del proceso
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <TextField
                id="PRF"
                label="Número del PRF"
                value={data.PRF}
                onChange={update("PRF")}
                placeholder="Ej: 80472-2024-46137"
                error={errors.PRF}
                testId="input-prf"
              />
              <TextField
                id="ENTIDAD_AFECTADA"
                label="Entidad afectada"
                value={data.ENTIDAD_AFECTADA}
                onChange={update("ENTIDAD_AFECTADA")}
                placeholder="Ej: MUNICIPIO DE PLATO"
                error={errors.ENTIDAD_AFECTADA}
                testId="input-entidad-afectada"
              />
              <div className="md:col-span-2">
                <ProferidoPorField
                  id="PROFERIDO_POR"
                  value={data.PROFERIDO_POR}
                  onChange={update("PROFERIDO_POR")}
                  error={errors.PROFERIDO_POR}
                  useDefault={proferidoUseDefault}
                  onUseDefaultChange={setProferidoUseDefault}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                onClick={() => setPreviewOpen(true)}
                variant="outline"
                size="lg"
                data-testid="btn-preview"
                className="border-slate-300"
              >
                <Eye className="mr-2 w-4 h-4" />
                Vista previa
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                size="lg"
                className="text-white font-bold tracking-wide px-8 shadow-lg"
                style={{ backgroundColor: accentDark }}
                data-testid="btn-generate"
              >
                <FileDown className="mr-2 w-5 h-5" />
                {loading ? "GENERANDO..." : "GENERAR CITACIÓN"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <footer
          className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-slate-500"
          data-testid="footer"
        >
          <span>
            Contraloría General de la República · Gerencia Departamental
            Colegiada del Magdalena
          </span>
          <span>Documento generado en formato Word (.docx) editable</span>
        </footer>
      </main>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="preview-modal-title">
              Vista previa
            </DialogTitle>
            <DialogDescription>
              Revise los datos antes de generar la citación.
            </DialogDescription>
          </DialogHeader>
          <PreviewList data={data} />
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(false)}
              data-testid="btn-close-preview"
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                handleGenerate();
              }}
              disabled={loading}
              className="text-white"
              style={{ backgroundColor: accentDark }}
              data-testid="btn-generate-from-preview"
            >
              <FileDown className="mr-2 w-4 h-4" />
              Generar y descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewList({ data }) {
  const fmtDate = (d) =>
    d ? format(d, "d 'de' MMMM 'de' yyyy", { locale: es }) : "—";

  const rows = [
    ["Modalidad", data.vinculacion ? "Con vinculación" : "Base"],
    ["Nombre", data.NOMBRE || "—"],
    ["Dirección", data.DIRECCION || "—"],
    ["Ciudad", data.CIUDAD || "—"],
    [
      "Correo electrónico",
      data.CORREO ? data.CORREO : "(se omitirá del documento)",
    ],
    ["Tipo de providencia", data.TIPO_PROVIDENCIA || "—"],
    ["Número de providencia", data.NUMERO_PROVIDENCIA || "—"],
    ["Fecha de providencia", fmtDate(data.FECHA_PROVIDENCIA)],
    ["Nombre de la providencia", data.NOMBRE_PROVIDENCIA || "—"],
    ...(data.vinculacion
      ? [
          ["Tipo segunda providencia", data.TIPO_PROVIDENCIA_2 || "—"],
          ["Número segunda providencia", data.NUMERO_PROVIDENCIA_2 || "—"],
          [
            "Fecha segunda providencia",
            fmtDate(data.FECHA_PROVIDENCIA_2),
          ],
          [
            "Nombre segunda providencia",
            data.NOMBRE_PROVIDENCIA_2 || "—",
          ],
        ]
      : []),
    ["PRF", data.PRF || "—"],
    ["Entidad afectada", data.ENTIDAD_AFECTADA || "—"],
    ["Proferido por", data.PROFERIDO_POR || "—"],
  ];
  return (
    <div
      className="border border-slate-200 rounded-lg p-5 bg-white"
      data-testid="preview-list"
    >
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(([k, v]) => (
          <div key={k} className="space-y-0.5">
            <dt className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              {k}
            </dt>
            <dd className="text-sm text-slate-800 break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
