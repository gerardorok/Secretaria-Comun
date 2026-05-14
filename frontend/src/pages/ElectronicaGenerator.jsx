import { AlertCircle } from "lucide-react";
import Header from "@/components/Header";

/**
 * Placeholder de la página de Notificación Electrónica.
 *
 * La UI definitiva se ensambla cuando se cargue la plantilla institucional
 * .docx correspondiente. La arquitectura (catálogo + componentes
 * compartidos + motor de generación) ya está lista para soportarla.
 */
export default function ElectronicaGenerator() {
  return (
    <div className="min-h-screen flex flex-col" data-testid="electronica-page">
      <Header moduleTitle="Notificación Electrónica" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
        <div
          className="rounded-xl border border-slate-200 bg-white p-8 text-center"
          data-testid="electronica-placeholder"
        >
          <div
            className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(214,52,33,0.10)" }}
          >
            <AlertCircle
              className="w-7 h-7"
              style={{ color: "#D63421" }}
              strokeWidth={2.2}
            />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Módulo en preparación
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            La arquitectura del módulo de Notificación Electrónica está
            lista. Sólo falta que se cargue la plantilla institucional
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-xs">
              FORMATO_NOTIFICACION_ELECTRONICA.docx
            </code>
            para habilitar el formulario.
          </p>
        </div>
      </main>
    </div>
  );
}
