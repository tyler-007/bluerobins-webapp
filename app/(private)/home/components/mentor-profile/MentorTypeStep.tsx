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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../../types/mentor-profile";

interface MentorTypeStepProps {
  form: UseFormReturn<FormValues>;
}

export function MentorTypeStep({ form }: MentorTypeStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Mentor Details</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="institution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institution/Industry</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter your institution" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="major"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Major/Area of Expertise</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter your major" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="preferred_mentees"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Preferred Students</FormLabel>
              <div className="flex flex-col gap-4">
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes("middle_school")}
                      onCheckedChange={(checked) => {
                        const currentValues = field.value || [];
                        if (checked) {
                          field.onChange([...currentValues, "middle_school"]);
                        } else {
                          field.onChange(
                            currentValues.filter((v) => v !== "middle_school")
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Middle School</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes("high_school")}
                      onCheckedChange={(checked) => {
                        const currentValues = field.value || [];
                        if (checked) {
                          field.onChange([...currentValues, "high_school"]);
                        } else {
                          field.onChange(
                            currentValues.filter((v) => v !== "high_school")
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">High School</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes("undergrad")}
                      onCheckedChange={(checked) => {
                        const currentValues = field.value || [];
                        if (checked) {
                          field.onChange([...currentValues, "undergrad"]);
                        } else {
                          field.onChange(
                            currentValues.filter((v) => v !== "undergrad")
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Undergraduate</FormLabel>
                </FormItem>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
