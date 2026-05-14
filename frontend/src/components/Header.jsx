import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

/**
 * Encabezado institucional compartido.
 *
 * En la pantalla inicial muestra el título principal. En las páginas
 * internas de los módulos muestra un enlace de retorno al selector
 * y el nombre del módulo activo (cuando se pasa por `moduleTitle`).
 */
export default function Header({ moduleTitle }) {
  const location = useLocation();
  const isInternal = location.pathname !== "/";

  return (
    <header
      className="bg-white border-b border-slate-200 sticky top-0 z-40"
      data-testid="cgr-header"
    >
      <div className="cgr-stripe h-1.5 w-full" data-testid="cgr-color-stripe" />
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-3 group"
          data-testid="cgr-home-link"
        >
          <div
            className="w-12 h-12 rounded-md flex items-center justify-center text-white transition-transform group-hover:scale-105"
            style={{ backgroundColor: "#2D3480" }}
            data-testid="cgr-logo-mark"
          >
            <ShieldCheck className="w-7 h-7" strokeWidth={2.2} />
          </div>
          <div>
            <p
              className="text-xs uppercase tracking-[0.18em] font-semibold"
              style={{ color: "#2D3480" }}
              data-testid="cgr-institution-name"
            >
              Contraloría General de la República
            </p>
            <h1
              className="text-base sm:text-lg font-semibold text-slate-800 leading-tight"
              data-testid="cgr-app-title"
            >
              {moduleTitle || "Generador de Documentos Institucionales"}
            </h1>
          </div>
        </Link>

        <div className="flex-1" />

        {isInternal && (
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
            data-testid="btn-back-to-home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Cambiar de módulo
          </Link>
        )}
        <div
          className="hidden sm:flex flex-col items-end text-right"
          data-testid="cgr-header-meta"
        >
          <span className="text-[11px] text-slate-500 uppercase tracking-wider">
            Gerencia Departamental
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: "#2D3480" }}
          >
            Secretaría Común · GRF
          </span>
        </div>
      </div>
    </header>
  );
}
