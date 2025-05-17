import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { FormValues, steps } from "../../types/mentor-profile";

interface ReviewStepProps {
  form: UseFormReturn<FormValues>;
  onStepClick: (step: number) => void;
}

export function ReviewStep({ form, onStepClick }: ReviewStepProps) {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="grid grid-cols-3 grid-rows-2 gap-4 w-full">
        {/* Profile (spans 2 rows, left) */}
        <Card className="row-span-2">
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-base font-semibold">Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 p-2 pt-1">
            {steps[3].fields.map((fieldName) => {
              const value = form.getValues(fieldName as keyof FormValues);
              let displayValue: React.ReactNode = null;
              if (
                fieldName === "expertise" &&
                Array.isArray(value) &&
                value.every((v) => typeof v === "string")
              ) {
                displayValue =
                  value.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {value.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>-</span>
                  );
              } else if (Array.isArray(value)) {
                displayValue =
                  value.length > 0 ? value.join(", ") : <span>-</span>;
              } else if (typeof value === "boolean") {
                displayValue = value ? "Yes" : "No";
              } else if (
                typeof value === "string" &&
                value.startsWith("http")
              ) {
                displayValue = (
                  <a
                    href={value}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {value}
                  </a>
                );
              } else if (!value) {
                displayValue = <span>-</span>;
              } else {
                displayValue = <span>{value}</span>;
              }
              return (
                <div
                  key={fieldName}
                  className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition flex flex-col gap-0.5"
                  onClick={() => onStepClick(3)}
                >
                  <span className="font-medium capitalize text-sm text-gray-500">
                    {fieldName.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm">{displayValue}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
        {/* Basic Details (top center) */}
        <Card>
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-base font-semibold">
              Basic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 p-2 pt-1">
            {steps[0].fields.map((fieldName) => {
              const value = form.getValues(fieldName as keyof FormValues);
              let displayValue: React.ReactNode = Array.isArray(value) ? (
                value.length > 0 ? (
                  value.join(", ")
                ) : (
                  <span>-</span>
                )
              ) : value ? (
                <span>{value}</span>
              ) : (
                <span>-</span>
              );
              return (
                <div
                  key={fieldName}
                  className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition flex flex-col gap-0.5"
                  onClick={() => onStepClick(0)}
                >
                  <span className="font-medium capitalize text-sm text-gray-500">
                    {fieldName.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm">{displayValue}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
        {/* Availability (spans 2 rows, right) */}
        <Card className="row-span-2">
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-base font-semibold">
              Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 p-2 pt-1">
            {steps[2].fields.map((fieldName) => {
              const value = form.getValues(fieldName as keyof FormValues);
              let displayValue: React.ReactNode = null;
              if (fieldName === "availability" && Array.isArray(value)) {
                const enabledDays = value.filter((d: any) => d.enabled);
                displayValue =
                  enabledDays.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {enabledDays.map((d: any, i: number) => (
                        <span
                          key={i}
                          className="inline-block bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded border border-gray-200"
                        >
                          {d.day}: {d.start_time} - {d.end_time}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>-</span>
                  );
              } else if (Array.isArray(value)) {
                displayValue =
                  value.length > 0 ? value.join(", ") : <span>-</span>;
              } else {
                displayValue = value ? <span>{value}</span> : <span>-</span>;
              }
              return (
                <div
                  key={fieldName}
                  className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition flex flex-col gap-0.5"
                  onClick={() => onStepClick(2)}
                >
                  <span className="font-medium capitalize text-sm text-gray-500">
                    {fieldName.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm">{displayValue}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
        {/* Mentor Type (bottom center) */}
        <Card>
          <CardHeader className="p-2 pb-0">
            <CardTitle className="text-base font-semibold">
              Mentor Type
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 p-2 pt-1">
            {steps[1].fields.map((fieldName) => {
              const value = form.getValues(fieldName as keyof FormValues);
              let displayValue: React.ReactNode = null;
              if (fieldName === "student_types" && Array.isArray(value)) {
                displayValue =
                  value.length > 0 ? value.join(", ") : <span>-</span>;
              } else if (Array.isArray(value)) {
                displayValue =
                  value.length > 0 ? value.join(", ") : <span>-</span>;
              } else {
                displayValue = value ? <span>{value}</span> : <span>-</span>;
              }
              return (
                <div
                  key={fieldName}
                  className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition flex flex-col gap-0.5"
                  onClick={() => onStepClick(1)}
                >
                  <span className="font-medium capitalize text-sm text-gray-500">
                    {fieldName.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm">{displayValue}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
