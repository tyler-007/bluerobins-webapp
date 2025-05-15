import { cn } from "@/lib/utils";

interface StepperProps {
  currentStep: number;
  steps: { label: string }[];
}

export function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="w-full flex justify-center">
      <div className="max-w-[700px] flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const isCompleted = currentStep >= idx;
          return (
            <div key={step.label} className="flex-1 flex flex-col items-center">
              <div className="flex items-center w-full">
                {/* Step circle with checkmark */}
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full w-9 h-9 font-semibold text-lg transition-all duration-200",
                    isCompleted
                      ? "bg-blue-600 border-4 border-white text-white shadow"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                </div>
                {/* Line to next step */}
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-2 transition-all duration-200",
                      isCompleted ? "bg-blue-600" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
              {/* Step label */}
              <div
                className="mt-2 text-sm font-medium text-center"
                style={{ minWidth: 80 }}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
