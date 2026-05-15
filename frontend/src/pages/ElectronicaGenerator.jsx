import { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileDown,
  Mail,
  Eye,
  Building2,
  User,
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
  persona_juridica: false,
  NOMBRE: "",
  CORREO: "",
  TIPO_PROVIDENCIA: "",
  NUMERO_PROVIDENCIA: "",
  FECHA_PROVIDENCIA: null,
  NOMBRE_PROVIDENCIA: "",
  PRF: "",
  ENTIDAD_AFECTADA: "",
  PROFERIDO_POR: DEFAULT_PROFERIDO_POR,
  NUMERO_FOLIOS: "",
};

const REQUIRED = [
  "NOMBRE",
  "CORREO",
  "TIPO_PROVIDENCIA",
  "NUMERO_PROVIDENCIA",
  "FECHA_PROVIDENCIA",
  "NOMBRE_PROVIDENCIA",
  "PRF",
  "ENTIDAD_AFECTADA",
  "PROFERIDO_POR",
  "NUMERO_FOLIOS",
];

const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default function ElectronicaGenerator() {
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
    REQUIRED.forEach((f) => {
      const v = data[f];
      if (v === null || v === undefined || (typeof v === "string" && !v.trim())) {
        e[f] = "Este campo es obligatorio";
      }
    });
    if (data.CORREO && !isValidEmail(data.CORREO.trim())) {
      e.CORREO = "Ingrese un correo electrónico válido";
    }
    return e;
  };

  const buildPayload = () => ({
    persona_juridica: data.persona_juridica,
    NOMBRE: data.NOMBRE.trim(),
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
    NUMERO_FOLIOS: data.NUMERO_FOLIOS.trim(),
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
      const payload = buildPayload();
      const response = await axios.post(
        `${API}/electronica/generate`,
        payload,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);

      let filename = "NOTIFICACION_ELECTRONICA.docx";
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

      toast.success("Notificación electrónica generada y descargada correctamente.");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Error desconocido al generar el documento.";
      toast.error(`No se pudo generar la notificación: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const TratamientoIcon = data.persona_juridica ? Building2 : User;

  return (
    <div className="min-h-screen flex flex-col" data-testid="electronica-page">
      <Header moduleTitle="Notificación Electrónica" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <section
          className="mb-8 flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between"
          data-testid="hero-section"
        >
          <div className="max-w-2xl">
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em] mb-2"
              style={{ color: "#D63421" }}
            >
              Secretaría Común · Grupo de Responsabilidad Fiscal
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Elaboración automatizada de{" "}
              <span style={{ color: "#D63421" }}>
                Notificaciones Electrónicas
              </span>
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Notifica electrónicamente al destinatario sobre una providencia.
              El sistema selecciona automáticamente la plantilla institucional
              según el tipo de persona.
            </p>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white"
            data-testid="template-info-card"
          >
            <Mail
              className="w-8 h-8 flex-shrink-0"
              style={{ color: "#D63421" }}
            />
            <div className="text-xs">
              <p className="font-semibold text-slate-700">
                Plantilla institucional
              </p>
              <p className="text-slate-500">
                {data.persona_juridica ? "Persona jurídica" : "Persona natural"}
              </p>
            </div>
          </div>
        </section>

        <Card className="cgr-card border-slate-200">
          <CardContent className="p-6 sm:p-8">
            {/* Persona jurídica toggle */}
            <div
              className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row mb-6 p-4 rounded-lg border border-slate-200 bg-slate-50"
              data-testid="persona-juridica-toggle-wrapper"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: data.persona_juridica
                      ? "rgba(214,52,33,0.12)"
                      : "rgba(45,52,128,0.08)",
                  }}
                >
                  <TratamientoIcon
                    className="w-5 h-5"
                    style={{
                      color: data.persona_juridica ? "#D63421" : "#2D3480",
                    }}
                    strokeWidth={2.2}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="persona-juridica"
                    className="text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    ¿Persona jurídica?
                  </Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {data.persona_juridica
                      ? 'Se usará el formato dirigido a "Señores" para personas jurídicas.'
                      : 'Por defecto se usa el formato "Señor(a)" para personas naturales.'}
                  </p>
                </div>
              </div>
              <Switch
                id="persona-juridica"
                checked={data.persona_juridica}
                onCheckedChange={(v) => update("persona_juridica")(v)}
                data-testid="switch-persona-juridica"
                className="data-[state=checked]:bg-[#D63421]"
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold text-slate-800"
                data-testid="form-title"
              >
                Datos de la notificación electrónica
              </h3>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(214,52,33,0.10)",
                  color: "#D63421",
                }}
              >
                10 campos
              </span>
            </div>
            <Separator className="mb-5" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <TextField
                  id="NOMBRE"
                  label={
                    data.persona_juridica
                      ? "Nombre o razón social"
                      : "Nombre del destinatario"
                  }
                  value={data.NOMBRE}
                  onChange={update("NOMBRE")}
                  placeholder={
                    data.persona_juridica
                      ? "Ej: CARMING SAS"
                      : "Ej: CRISTIANO RONALDO DOS SANTOS"
                  }
                  error={errors.NOMBRE}
                  testId="input-nombre"
                />
              </div>
              <div className="md:col-span-2">
                <TextField
                  id="CORREO"
                  label="Correo electrónico"
                  value={data.CORREO}
                  onChange={update("CORREO")}
                  placeholder="Ej: destinatario@correo.com"
                  error={errors.CORREO}
                  testId="input-correo"
                />
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
                placeholder="Ej: 126"
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
              <TextField
                id="PRF"
                label="Número del PRF"
                value={data.PRF}
                onChange={update("PRF")}
                placeholder="Ej: 80472-2024-46647"
                error={errors.PRF}
                testId="input-prf"
              />
              <div className="md:col-span-2">
                <TextField
                  id="NOMBRE_PROVIDENCIA"
                  label="Nombre completo de la providencia"
                  value={data.NOMBRE_PROVIDENCIA}
                  onChange={update("NOMBRE_PROVIDENCIA")}
                  placeholder="Ej: POR EL CUAL SE ORDENA EL CIERRE DE LA INDAGACIÓN PRELIMINAR Y LA APERTURA DEL PROCESO DE RESPONSABILIDAD FISCAL"
                  error={errors.NOMBRE_PROVIDENCIA}
                  testId="input-nombre-providencia"
                  multiline
                  rows={3}
                />
              </div>
              <TextField
                id="ENTIDAD_AFECTADA"
                label="Entidad afectada"
                value={data.ENTIDAD_AFECTADA}
                onChange={update("ENTIDAD_AFECTADA")}
                placeholder="Ej: MUNICIPIO DE SABANAS DE SAN ANGEL"
                error={errors.ENTIDAD_AFECTADA}
                testId="input-entidad-afectada"
              />
              <TextField
                id="NUMERO_FOLIOS"
                label="Número de folios"
                value={data.NUMERO_FOLIOS}
                onChange={update("NUMERO_FOLIOS")}
                placeholder="Ej: veintidós (22)"
                error={errors.NUMERO_FOLIOS}
                testId="input-numero-folios"
                helper="Texto que aparecerá en el documento (ej: ‘veintidós (22)’)."
              />
              <div className="md:col-span-2">
                <ProferidoPorField
                  id="PROFERIDO_POR"
                  label="Proferido por"
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
                style={{ backgroundColor: "#D63421" }}
                data-testid="btn-generate"
              >
                <FileDown className="mr-2 w-5 h-5" />
                {loading ? "GENERANDO..." : "GENERAR NOTIFICACIÓN"}
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
              Revise los datos antes de generar la notificación electrónica.
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
              style={{ backgroundColor: "#D63421" }}
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
  const rows = [
    ["Tipo de persona", data.persona_juridica ? "Jurídica" : "Natural"],
    [
      data.persona_juridica ? "Razón social" : "Nombre",
      data.NOMBRE || "—",
    ],
    ["Correo electrónico", data.CORREO || "—"],
    ["Tipo de providencia", data.TIPO_PROVIDENCIA || "—"],
    ["Número de providencia", data.NUMERO_PROVIDENCIA || "—"],
    [
      "Fecha de providencia",
      data.FECHA_PROVIDENCIA
        ? format(data.FECHA_PROVIDENCIA, "d 'de' MMMM 'de' yyyy", {
            locale: es,
          })
        : "—",
    ],
    ["Nombre de la providencia", data.NOMBRE_PROVIDENCIA || "—"],
    ["PRF", data.PRF || "—"],
    ["Entidad afectada", data.ENTIDAD_AFECTADA || "—"],
    ["Proferido por", data.PROFERIDO_POR || "—"],
    ["Número de folios", data.NUMERO_FOLIOS || "—"],
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
