import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { STUDENT_TYPES } from "../types";
import { ControllerRenderProps } from "react-hook-form";
import { FormValues } from "../types";

interface StudentTypeSelectorProps {
  field: ControllerRenderProps<FormValues, "studentType">;
}

export const StudentTypeSelector = ({ field }: StudentTypeSelectorProps) => (
  <FormItem>
    <FormLabel>What type of student are you?</FormLabel>
    <FormControl>
      <div className="flex flex-row gap-2">
        {STUDENT_TYPES.map((type) => (
          <Button
            key={type.value}
            type="button"
            variant={field.value === type.value ? "default" : "outline"}
            className="flex-1"
            onClick={() => field.onChange(type.value)}
          >
            {type.label}
          </Button>
        ))}
      </div>
    </FormControl>
    <FormMessage />
  </FormItem>
);
