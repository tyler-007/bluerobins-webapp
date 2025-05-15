import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Control } from "react-hook-form";
import { FormValues } from "../types";

interface MajorFieldProps {
  control: Control<FormValues>;
}

export const MajorField = ({ control }: MajorFieldProps) => (
  <FormField
    control={control}
    name="major"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Major</FormLabel>
        <FormControl>
          <Input {...field} placeholder="Enter your major" />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);
