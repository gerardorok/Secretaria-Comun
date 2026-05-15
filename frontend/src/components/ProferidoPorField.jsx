import { useEffect } from "react";
import { Lock, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DEFAULT_PROFERIDO_POR } from "@/modules/defaults";

/**
 * Campo reutilizable de "Proferido por" con check para usar el valor
 * institucional por defecto.
 *
 * Props:
 *   id, label, value, onChange, error, testId, useDefault, onUseDefaultChange
 *
 * Comportamiento:
 *   - `useDefault` controlado desde el padre (boolean).
 *   - Cuando `useDefault` está en true → el textarea queda en solo lectura
 *     y el valor se fuerza a DEFAULT_PROFERIDO_POR.
 *   - Cuando se desmarca → el textarea queda editable (manteniendo el
 *     valor actual, que el usuario puede ajustar).
 */
export default function ProferidoPorField({
  id = "PROFERIDO_POR",
  label = "Acto Administrativo Proferido Por",
  value,
  onChange,
  error,
  testId = "input-proferido-por",
  useDefault,
  onUseDefaultChange,
  helper,
  rows = 2,
}) {
  // Cuando se activa el check, forzar el valor por defecto.
  useEffect(() => {
    if (useDefault && value !== DEFAULT_PROFERIDO_POR) {
      onChange(DEFAULT_PROFERIDO_POR);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useDefault]);

  const handleToggle = (checked) => {
    onUseDefaultChange(Boolean(checked));
    if (checked) {
      onChange(DEFAULT_PROFERIDO_POR);
    }
  };

  return (
    <div className="space-y-2" data-testid={`${testId}-wrapper`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <label
          className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none"
          data-testid={`${testId}-use-default-label`}
        >
          <Checkbox
            id={`${id}-use-default`}
            checked={useDefault}
            onCheckedChange={handleToggle}
            data-testid={`${testId}-use-default`}
          />
          <span className="flex items-center gap-1">
            {useDefault ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Pencil className="w-3 h-3" />
            )}
            Usar valor institucional por defecto
          </span>
        </label>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={useDefault}
        rows={rows}
        data-testid={testId}
        placeholder="Ej: GERENCIA DEPARTAMENTAL COLEGIADA DE MAGDALENA DE LA CONTRALORIA GENERAL DE LA REPUBLICA"
        className={cn(
          "bg-white",
          useDefault && "bg-slate-50 text-slate-700 cursor-not-allowed",
          error && "border-red-500 focus-visible:ring-red-500 field-error-shake"
        )}
      />
      {helper && !error && (
        <p className="text-xs text-slate-500">{helper}</p>
      )}
      {error && (
        <p className="text-xs text-red-600" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
