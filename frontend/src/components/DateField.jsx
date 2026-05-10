import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Selector de fecha con formato textual en español: "27 de noviembre de 2025".
 * Si `dateFormat="numeric"` devuelve "DD/MM/AAAA".
 *
 * value: Date | null
 * onChange: (date: Date) => void
 */
export default function DateField({
  id,
  label,
  value,
  onChange,
  required = true,
  error,
  dateFormat = "long",
  testId,
}) {
  const display =
    value &&
    (dateFormat === "numeric"
      ? format(value, "dd/MM/yyyy", { locale: es })
      : format(value, "d 'de' MMMM 'de' yyyy", { locale: es }));

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            data-testid={testId}
            className={cn(
              "w-full justify-start text-left font-normal h-10 bg-white",
              !value && "text-slate-500",
              error && "border-red-500 field-error-shake"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {display ? display : <span>Seleccione una fecha</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value || undefined}
            onSelect={(d) => d && onChange(d)}
            locale={es}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-xs text-red-600 mt-1" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
