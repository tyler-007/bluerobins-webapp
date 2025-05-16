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

interface ParentInfoProps {
  control: Control<FormValues>;
}

export const ParentInfo = ({ control }: ParentInfoProps) => (
  <>
    <FormField
      control={control}
      name="parentName"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base">Parent's Name</FormLabel>
          <FormControl>
            <Input {...field} placeholder="Enter parent's name" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="parentEmail"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base">Parent's Email</FormLabel>
          <FormControl>
            <Input {...field} type="email" placeholder="Enter parent's email" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </>
);
