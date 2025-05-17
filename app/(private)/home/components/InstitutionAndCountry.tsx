import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { countries } from "@/lib/countries";
import { Control } from "react-hook-form";
import { FormValues } from "../types";

interface InstitutionAndCountryProps {
  control: Control<FormValues>;
  isUndergrad: boolean;
}

export const InstitutionAndCountry = ({
  control,
  isUndergrad,
}: InstitutionAndCountryProps) => (
  <div className="grid grid-cols-[2fr_1fr] gap-4">
    <FormField
      control={control}
      name="institution_name"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base">
            {isUndergrad ? "University Name" : "School Name"}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder={`Enter your ${isUndergrad ? "university" : "school"} name`}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="country"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base">Country</FormLabel>
          <FormControl>
            <Combobox
              items={countries.map((country) => ({
                value: country.code,
                label: country.name,
              }))}
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Select country"
              searchPlaceholder="Search country..."
              emptyText="No country found."
              className="border border-gray-300 rounded px-3 py-2 w-full focus:border-black focus:ring-0 focus:outline-none text-black"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);
