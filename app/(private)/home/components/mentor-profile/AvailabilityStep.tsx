import { Card, CardContent } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../../types/mentor-profile";

interface AvailabilityStepProps {
  form: UseFormReturn<FormValues>;
}

export function AvailabilityStep({ form }: AvailabilityStepProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hours_per_week"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commitment per week (hours)</FormLabel>
                <FormDescription className="text-xs">
                  Hours per week can you commit
                </FormDescription>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    min={1}
                    placeholder="Enter hours per week"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hourly_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Per hour rate ($)</FormLabel>
                <FormDescription className="text-xs">
                  Your hourly rate for mentoring sessions
                </FormDescription>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    min={1}
                    placeholder="Enter hourly rate"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="availability"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Weekly Availability</FormLabel>
              <FormDescription className="text-xs">
                Select your available time slots for each day
              </FormDescription>
              <div className="space-y-2">
                {field.value.map((day, index) => (
                  <div key={day.day} className="flex items-center gap-4">
                    <FormControl>
                      <Checkbox
                        checked={day.enabled}
                        onCheckedChange={(checked) => {
                          const newValue = [...field.value];
                          newValue[index] = {
                            ...day,
                            enabled: checked as boolean,
                          };
                          field.onChange(newValue);
                        }}
                      />
                    </FormControl>
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div className="font-medium flex items-center h-full">
                        {day.day}
                      </div>
                      <div className="w-full">
                        <Input
                          type="time"
                          value={day.start_time}
                          onChange={(e) => {
                            const newValue = [...field.value];
                            newValue[index] = {
                              ...day,
                              start_time: e.target.value,
                            };
                            field.onChange(newValue);
                          }}
                          disabled={!day.enabled}
                          className="w-40 min-w-[120px]"
                        />
                      </div>
                      <div className="w-full">
                        <Input
                          type="time"
                          value={day.end_time}
                          onChange={(e) => {
                            const newValue = [...field.value];
                            newValue[index] = {
                              ...day,
                              end_time: e.target.value,
                            };
                            field.onChange(newValue);
                          }}
                          disabled={!day.enabled}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
