import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { countries } from "@/lib/countries";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../../types/mentor-profile";

interface BasicDetailsStepProps {
  form: UseFormReturn<FormValues>;
  email: string;
}

export function BasicDetailsStep({ form, email }: BasicDetailsStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Basic Details</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter your name" />
              </FormControl>
              <FormDescription>Email: {email}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter your phone number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter your address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter your state" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
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
        <div className="text-sm text-gray-500">
          Current Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </div>
      </CardContent>
    </Card>
  );
}
