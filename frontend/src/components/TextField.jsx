import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Campo de texto reutilizable, con label, placeholder y mensaje de error.
 * Si `multiline` es true, renderiza un Textarea.
 */
export default function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = true,
  error,
  multiline = false,
  rows = 3,
  testId,
  helper,
}) {
  const sharedClasses = cn(
    "bg-white",
    error && "border-red-500 focus-visible:ring-red-500 field-error-shake"
  );

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          data-testid={testId}
          className={sharedClasses}
        />
      ) : (
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          data-testid={testId}
          className={sharedClasses}
        />
      )}
      {helper && !error && (
        <p className="text-xs text-slate-500 mt-1">{helper}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
