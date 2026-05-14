import { Link } from "react-router-dom";
import { ChevronRight, FileText } from "lucide-react";
import Header from "@/components/Header";
import { MODULES } from "@/modules/catalog";
import { cn } from "@/lib/utils";

/**
 * Pantalla inicial: selector de módulo documental.
 *
 * Presenta una rejilla de tarjetas con los módulos disponibles (y los que
 * vendrán en futuras iteraciones). Las tarjetas deshabilitadas muestran un
 * badge "Próximamente" y no son navegables.
 */
export default function HomeSelector() {
  const activeModules = MODULES.filter((m) => m.enabled);
  const upcomingModules = MODULES.filter((m) => !m.enabled);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <section
          className="mb-10 max-w-3xl"
          data-testid="home-hero"
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em] mb-2"
            style={{ color: "#2D3480" }}
          >
            Secretaría Común · Grupo de Responsabilidad Fiscal
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
            Sistema de{" "}
            <span style={{ color: "#2D3480" }}>
              Automatización Documental
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Selecciona el tipo de documento que necesitas generar. Cada
            módulo utiliza la plantilla institucional oficial y produce un
            archivo Word listo para imprimir o enviar.
          </p>
        </section>

        {/* Módulos activos */}
        <section className="mb-12" data-testid="active-modules-section">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-xs font-semibold uppercase tracking-wider text-slate-500"
              data-testid="active-modules-title"
            >
              Módulos disponibles
            </h3>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: "rgba(45,52,128,0.08)",
                color: "#2D3480",
              }}
            >
              {activeModules.length} módulos
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeModules.map((m) => (
              <ModuleCard key={m.id} module={m} />
            ))}
          </div>
        </section>

        {/* Módulos próximos */}
        {upcomingModules.length > 0 && (
          <section data-testid="upcoming-modules-section">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Próximos módulos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {upcomingModules.map((m) => (
                <ModuleCard key={m.id} module={m} compact />
              ))}
            </div>
          </section>
        )}

        <footer
          className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-slate-500"
          data-testid="footer"
        >
          <span>
            Contraloría General de la República · Gerencia Departamental
            Colegiada del Magdalena
          </span>
          <span>Documentos generados en formato Word (.docx) editable</span>
        </footer>
      </main>
    </div>
  );
}

function ModuleCard({ module, compact = false }) {
  const Icon = module.icon || FileText;
  const isDisabled = !module.enabled;

  const content = (
    <div
      className={cn(
        "relative group h-full flex flex-col rounded-xl border bg-white transition-all overflow-hidden",
        compact ? "p-4" : "p-6",
        isDisabled
          ? "border-slate-200 opacity-60 cursor-not-allowed"
          : "border-slate-200 hover:border-transparent hover:shadow-xl cursor-pointer"
      )}
      style={
        !isDisabled
          ? {
              borderColor: undefined,
            }
          : undefined
      }
      data-testid={module.testId}
    >
      {/* Top color accent bar (only visible on hover for active modules) */}
      {!isDisabled && (
        <div
          className="absolute top-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
          style={{ backgroundColor: module.accent }}
        />
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className={cn(
            "rounded-lg flex items-center justify-center",
            compact ? "w-10 h-10" : "w-12 h-12"
          )}
          style={{ backgroundColor: module.accentSoft }}
        >
          <Icon
            className={compact ? "w-5 h-5" : "w-6 h-6"}
            style={{ color: module.accent }}
            strokeWidth={2.2}
          />
        </div>
        <span
          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
          style={{
            backgroundColor: isDisabled ? "rgb(241 245 249)" : module.accentSoft,
            color: isDisabled ? "rgb(100 116 139)" : module.accent,
          }}
        >
          {module.badge}
        </span>
      </div>

      <h4
        className={cn(
          "font-semibold text-slate-900 leading-tight mb-2",
          compact ? "text-sm" : "text-lg"
        )}
      >
        {module.title}
      </h4>
      <p
        className={cn(
          "text-slate-600 leading-relaxed flex-1",
          compact ? "text-xs" : "text-sm"
        )}
      >
        {module.description}
      </p>

      {!isDisabled && !compact && (
        <div
          className="mt-4 flex items-center gap-1 text-sm font-semibold"
          style={{ color: module.accent }}
        >
          <span>Generar documento</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );

  if (isDisabled) {
    return content;
  }
  return (
    <Link to={module.route} className="block h-full no-underline">
      {content}
    </Link>
  );
}
