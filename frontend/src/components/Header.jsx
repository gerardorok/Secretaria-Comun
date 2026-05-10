import { ShieldCheck } from "lucide-react";

export default function Header() {
  return (
    <header
      className="bg-white border-b border-slate-200 sticky top-0 z-40"
      data-testid="cgr-header"
    >
      <div className="cgr-stripe h-1.5 w-full" data-testid="cgr-color-stripe" />
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-md flex items-center justify-center text-white"
          style={{ backgroundColor: "#2D3480" }}
          data-testid="cgr-logo-mark"
        >
          <ShieldCheck className="w-7 h-7" strokeWidth={2.2} />
        </div>
        <div className="flex-1">
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
            Generador de Notificaciones por Aviso
          </h1>
        </div>
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
