import { Check } from "lucide-react";

export default function Stepper({ currentStep, steps }) {
  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-4 mb-8"
      data-testid="form-stepper"
    >
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <div
            key={step}
            className="flex items-center gap-2 sm:gap-3"
            data-testid={`stepper-step-${stepNum}`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all border-2 ${
                isCompleted
                  ? "text-white border-transparent"
                  : isActive
                  ? "text-white border-transparent shadow-md"
                  : "bg-white text-slate-400 border-slate-200"
              }`}
              style={
                isCompleted
                  ? { backgroundColor: "#2D3480" }
                  : isActive
                  ? { backgroundColor: "#2D3480" }
                  : {}
              }
            >
              {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
            </div>
            <span
              className={`text-xs sm:text-sm font-medium hidden sm:block ${
                isActive ? "text-slate-900" : "text-slate-500"
              }`}
            >
              {step}
            </span>
            {idx < steps.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-0.5 ${
                  isCompleted ? "" : "bg-slate-200"
                }`}
                style={isCompleted ? { backgroundColor: "#2D3480" } : {}}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
