import { Check } from "lucide-react";

const STEPS = ["Identificación", "Detalles", "Revisión"] as const;

export function ServiceWizardStepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-start px-1 py-3">
      {STEPS.map((label, idx) => {
        const num = idx + 1;
        const completed = num < currentStep;
        const active = num === currentStep;

        return (
          <div key={label} className="flex flex-1 items-start">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  completed || active
                    ? "bg-primary text-on-primary"
                    : "border-2 border-slate-300 text-slate-400"
                }`}
              >
                {completed ? <Check className="size-4" /> : num}
              </div>
              <span
                className={`text-center text-[10px] font-medium leading-tight ${
                  active ? "text-primary" : completed ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className={`mx-2 mt-4 flex-1 border-t-2 ${
                  num < currentStep ? "border-primary" : "border-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
