import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MIDDLE_SCHOOL_GRADES,
  HIGH_SCHOOL_GRADES,
  StudentType,
} from "../types";
import { Control } from "react-hook-form";
import { FormValues } from "../types";

interface GradeSelectorProps {
  control: Control<FormValues>;
  studentType: StudentType;
}

export const GradeSelector = ({ control, studentType }: GradeSelectorProps) => (
  <FormField
    control={control}
    name="grade"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Which grade are you in?</FormLabel>
        <FormControl>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Select a grade" />
            </SelectTrigger>
            <SelectContent>
              {studentType === "middle_school" &&
                MIDDLE_SCHOOL_GRADES.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              {studentType === "high_school" &&
                HIGH_SCHOOL_GRADES.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);
