import React from "react";

const stepLabels = [
  "Profile",
  "Basic Details",
  "Mentor Type",
  "Availability",
  "Review",
];

type ReviewStepperProps = {
  labels?: string[];
};

const ReviewStepper: React.FC<ReviewStepperProps> = ({
  labels = stepLabels,
}) => (
  <div className="w-full flex justify-center">
    <div className="max-w-[900px] w-full grid grid-cols-5 gap-0 mb-8">
      {labels.map((label, idx, arr) => {
        const isCompleted = true;
        return (
          <div key={label} className="flex flex-col items-center">
            <div className="flex items-center justify-center w-full">
              <div
                className={
                  isCompleted
                    ? "bg-blue-600 border-4 border-white text-white flex items-center justify-center rounded-full w-9 h-9 font-semibold text-lg transition-all duration-200 shadow"
                    : "bg-gray-200 text-gray-500 flex items-center justify-center rounded-full w-9 h-9 font-semibold text-lg transition-all duration-200"
                }
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
              {idx < arr.length - 1 && (
                <div className="bg-blue-600 h-1 flex-1 mx-2 transition-all duration-200" />
              )}
            </div>
            <div className="mt-2 text-sm font-medium text-center w-full">
              {label}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default ReviewStepper;
