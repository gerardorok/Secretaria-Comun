import { useState, useMemo } from "react";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  FileDown,
  FileText,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/Header";
import Stepper from "@/components/Stepper";
import TextField from "@/components/TextField";
import DateField from "@/components/DateField";
import PreviewPanel from "@/components/PreviewPanel";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  // Página 1
  NOMBRE: "",
  DIRECCION: "",
  CIUDAD: "",
  NUMERO_AVISO: "",
  AUTO: "",
  FECHA_AUTO: null,
  PRF: "",
  ENTIDAD_AFECTADA: "",
  PROFERIDO_POR: "",
  // Página 2 (NOTIFICADO, PROVIDENCIA y FECHA_PROVIDENCIA se reutilizan
  // automáticamente desde NOMBRE/AUTO/FECHA_AUTO de la página 1)
  FECHA_ELABORACION: null,
  PERSONAS_NOTIFICAR: "",
  TIPO_PROVIDENCIA: "",
  FECHA_CITACION: null,
  ANEXO: "",
};

const PAGE_1_REQUIRED = [
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

const PAGE_2_REQUIRED = [
  "FECHA_ELABORACION",
  "PERSONAS_NOTIFICAR",
  "TIPO_PROVIDENCIA",
  "FECHA_CITACION",
  "ANEXO",
];

export default function NotificationGenerator() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const update = (key) => (value) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateFields = (fields) => {
    const newErrors = {};
    fields.forEach((f) => {
      const v = data[f];
      if (v === null || v === undefined || (typeof v === "string" && !v.trim())) {
        newErrors[f] = "Este campo es obligatorio";
      }
    });
    return newErrors;
  };

  const goToStep2 = () => {
    const e = validateFields(PAGE_1_REQUIRED);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      toast.error("Complete todos los campos obligatorios de la Página 1.");
      return;
    }
    setErrors({});
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildPayload = useMemo(() => {
    return () => ({
      NOMBRE: data.NOMBRE.trim(),
      DIRECCION: data.DIRECCION.trim(),
      CIUDAD: data.CIUDAD.trim(),
      NUMERO_AVISO: data.NUMERO_AVISO.trim(),
      AUTO: data.AUTO.trim(),
      FECHA_AUTO: data.FECHA_AUTO
        ? format(data.FECHA_AUTO, "d 'de' MMMM 'de' yyyy", { locale: es })
        : "",
      PRF: data.PRF.trim(),
      ENTIDAD_AFECTADA: data.ENTIDAD_AFECTADA.trim(),
      PROFERIDO_POR: data.PROFERIDO_POR.trim(),

      // NOTIFICADO se reutiliza desde NOMBRE en el backend
      FECHA_ELABORACION: data.FECHA_ELABORACION
        ? format(data.FECHA_ELABORACION, "d 'de' MMMM 'de' yyyy", { locale: es })
        : "",
      PERSONAS_NOTIFICAR: data.PERSONAS_NOTIFICAR.trim(),
      // PROVIDENCIA se reutiliza desde AUTO en el backend
      // FECHA_PROVIDENCIA se reutiliza desde FECHA_AUTO en el backend
      TIPO_PROVIDENCIA: data.TIPO_PROVIDENCIA.trim(),
      FECHA_CITACION: data.FECHA_CITACION
        ? format(data.FECHA_CITACION, "dd/MM/yyyy", { locale: es })
        : "",
      ANEXO: data.ANEXO.trim(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleGenerate = async () => {
    const e = validateFields(PAGE_2_REQUIRED);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      toast.error("Complete todos los campos obligatorios de la Página 2.");
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const payload = buildPayload();
      const response = await axios.post(
        `${API}/generate-notification`,
        payload,
        { responseType: "blob" }
      );

      // Descargar el archivo .docx
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);

      // Extraer nombre del header
      let filename = "AVISO_NOTIFICACION.docx";
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

      toast.success("Documento generado y descargado correctamente.");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Error desconocido al generar el documento.";
      toast.error(`No se pudo generar el aviso: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Hero institucional */}
        <section
          className="mb-8 flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between"
          data-testid="hero-section"
        >
          <div className="max-w-2xl">
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em] mb-2"
              style={{ color: "#2D3480" }}
            >
              Secretaría Común · Grupo de Responsabilidad Fiscal
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Elaboración automatizada de{" "}
              <span style={{ color: "#2D3480" }}>
                Notificaciones por Aviso
              </span>
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Diligencie el formulario y genere el documento Word
              institucional conservando exactamente el formato oficial de la
              plantilla CGR.
            </p>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white"
            data-testid="template-info-card"
          >
            <FileText
              className="w-8 h-8 flex-shrink-0"
              style={{ color: "#2D3480" }}
            />
            <div className="text-xs">
              <p className="font-semibold text-slate-700">
                Plantilla institucional
              </p>
              <p className="text-slate-500">AVISO_PRF_FORMATO.docx</p>
            </div>
          </div>
        </section>

        {/* Stepper */}
        <Stepper
          currentStep={step}
          steps={["Datos del destinatario", "Cuadro de notificación"]}
        />

        {/* Form Card */}
        <Card className="cgr-card border-slate-200">
          <CardContent className="p-6 sm:p-8">
            {step === 1 && (
              <div className="space-y-5" data-testid="form-page-1">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-lg font-semibold text-slate-800"
                    data-testid="page-1-title"
                  >
                    Página 1 · Datos del destinatario y providencia
                  </h3>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: "rgba(45,52,128,0.08)",
                      color: "#2D3480",
                    }}
                  >
                    9 campos
                  </span>
                </div>
                <Separator />

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
                      helper="Se reutiliza automáticamente como “Procede a notificar a” en la Página 2"
                    />
                  </div>
                  <TextField
                    id="DIRECCION"
                    label="Dirección"
                    value={data.DIRECCION}
                    onChange={update("DIRECCION")}
                    placeholder="Ej: Calle 78 No. 14 – 15"
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
                  <TextField
                    id="NUMERO_AVISO"
                    label="Número de Aviso"
                    value={data.NUMERO_AVISO}
                    onChange={update("NUMERO_AVISO")}
                    placeholder="Ej: 085-2026"
                    error={errors.NUMERO_AVISO}
                    testId="input-numero-aviso"
                    helper="Se reutiliza automáticamente en la Página 2"
                  />
                  <TextField
                    id="AUTO"
                    label="Auto"
                    value={data.AUTO}
                    onChange={update("AUTO")}
                    placeholder="Ej: AUTO No. 456"
                    error={errors.AUTO}
                    testId="input-auto"
                    helper="Se reutiliza como “Providencia No.” en la Página 2"
                  />
                  <DateField
                    id="FECHA_AUTO"
                    label="Fecha del Auto"
                    value={data.FECHA_AUTO}
                    onChange={update("FECHA_AUTO")}
                    error={errors.FECHA_AUTO}
                    testId="input-fecha-auto"
                  />
                  <TextField
                    id="PRF"
                    label="Número del PRF"
                    value={data.PRF}
                    onChange={update("PRF")}
                    placeholder="Ej: 80472-2025-48999"
                    error={errors.PRF}
                    testId="input-prf"
                    helper="Se reutiliza automáticamente en la Página 2"
                  />
                  <TextField
                    id="ENTIDAD_AFECTADA"
                    label="Entidad Afectada"
                    value={data.ENTIDAD_AFECTADA}
                    onChange={update("ENTIDAD_AFECTADA")}
                    placeholder="Ej: MUNICIPIO DE TENERIFE"
                    error={errors.ENTIDAD_AFECTADA}
                    testId="input-entidad-afectada"
                    helper="Se reutiliza automáticamente en la Página 2"
                  />
                  <div className="md:col-span-2">
                    <TextField
                      id="PROFERIDO_POR"
                      label="Acto Administrativo Proferido Por"
                      value={data.PROFERIDO_POR}
                      onChange={update("PROFERIDO_POR")}
                      placeholder="Ej: GERENCIA DEPARTAMENTAL COLEGIADA DE MAGDALENA DE LA CONTRALORIA GENERAL DE LA REPUBLICA"
                      error={errors.PROFERIDO_POR}
                      testId="input-proferido-por"
                      helper="Se reutiliza automáticamente en la Página 2"
                      multiline
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={goToStep2}
                    size="lg"
                    className="text-white font-semibold"
                    style={{ backgroundColor: "#2D3480" }}
                    data-testid="btn-next-page"
                  >
                    Siguiente
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5" data-testid="form-page-2">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-lg font-semibold text-slate-800"
                    data-testid="page-2-title"
                  >
                    Página 2 · Cuadro de notificación
                  </h3>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: "rgba(240,186,65,0.18)",
                      color: "#7a5b16",
                    }}
                  >
                    5 campos
                  </span>
                </div>
                <Separator />

                {/* Campos reutilizados (solo lectura informativa) */}
                <div
                  className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4"
                  data-testid="reused-fields-info"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Campos reutilizados de la Página 1
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Procede a notificar a:</span>{" "}
                      <span className="font-medium text-slate-800">
                        {data.NOMBRE || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Número de Aviso:</span>{" "}
                      <span className="font-medium text-slate-800">
                        {data.NUMERO_AVISO || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Providencia No.:</span>{" "}
                      <span className="font-medium text-slate-800">
                        {data.AUTO || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Fecha Providencias:</span>{" "}
                      <span className="font-medium text-slate-800">
                        {data.FECHA_AUTO
                          ? format(data.FECHA_AUTO, "d 'de' MMMM 'de' yyyy", {
                              locale: es,
                            })
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">PRF:</span>{" "}
                      <span className="font-medium text-slate-800">
                        {data.PRF || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Entidad afectada:</span>{" "}
                      <span className="font-medium text-slate-800">
                        {data.ENTIDAD_AFECTADA || "—"}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Proferido por:</span>{" "}
                      <span className="font-medium text-slate-800 break-words">
                        {data.PROFERIDO_POR || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DateField
                    id="FECHA_ELABORACION"
                    label="Fecha de Elaboración del Documento"
                    value={data.FECHA_ELABORACION}
                    onChange={update("FECHA_ELABORACION")}
                    error={errors.FECHA_ELABORACION}
                    testId="input-fecha-elaboracion"
                  />
                  <TextField
                    id="TIPO_PROVIDENCIA"
                    label="Tipo de Providencias"
                    value={data.TIPO_PROVIDENCIA}
                    onChange={update("TIPO_PROVIDENCIA")}
                    placeholder="Ej: AUTO DE APERTURA"
                    error={errors.TIPO_PROVIDENCIA}
                    testId="input-tipo-providencia"
                  />
                  <DateField
                    id="FECHA_CITACION"
                    label="Fecha de envío de citación (notificación personal)"
                    value={data.FECHA_CITACION}
                    onChange={update("FECHA_CITACION")}
                    error={errors.FECHA_CITACION}
                    testId="input-fecha-citacion"
                    dateFormat="numeric"
                  />
                  <div className="md:col-span-2">
                    <TextField
                      id="PERSONAS_NOTIFICAR"
                      label="Personas a Notificar"
                      value={data.PERSONAS_NOTIFICAR}
                      onChange={update("PERSONAS_NOTIFICAR")}
                      placeholder="Ej: CRISTIANO RONALDO DOS SANTOS, LIONEL ANDRES MESSI"
                      error={errors.PERSONAS_NOTIFICAR}
                      testId="input-personas-notificar"
                      multiline
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <TextField
                      id="ANEXO"
                      label="Anexo Providencia En"
                      value={data.ANEXO}
                      onChange={update("ANEXO")}
                      placeholder="Ej: AUTO 456 en 17 folios"
                      error={errors.ANEXO}
                      testId="input-anexo"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4">
                  <Button
                    onClick={goBack}
                    variant="outline"
                    size="lg"
                    data-testid="btn-back-page"
                    className="border-slate-300"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Anterior
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-3">
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
                      style={{ backgroundColor: "#2D3480" }}
                      data-testid="btn-generate"
                    >
                      <FileDown className="mr-2 w-5 h-5" />
                      {loading ? "GENERANDO..." : "GENERAR AVISO"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer institucional */}
        <footer
          className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-slate-500"
          data-testid="footer"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="w-4 h-4"
              style={{ color: "#2D3480" }}
            />
            <span>
              Contraloría General de la República · Gerencia Departamental
              Colegiada del Magdalena
            </span>
          </div>
          <span>Documento generado en formato Word (.docx) editable</span>
        </footer>
      </main>

      {/* Modal de vista previa */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="preview-modal-title">
              Vista previa de la notificación
            </DialogTitle>
            <DialogDescription>
              Revise los datos antes de generar el documento institucional.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <PreviewPanel data={data} />
          </div>
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
              style={{ backgroundColor: "#2D3480" }}
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
