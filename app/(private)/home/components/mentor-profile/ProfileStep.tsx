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
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/app/components/ui/TagInput";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../../types/mentor-profile";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileStepProps {
  form: UseFormReturn<FormValues>;
}

export function ProfileStep({ form }: ProfileStepProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-4 ">
          <div className="flex flex-col">
            <FormField
              control={form.control}
              name="photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo Upload</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="photo-upload"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            field.onChange(url);
                          }
                        }}
                      />
                      <label
                        htmlFor="photo-upload"
                        className={cn(
                          " w-32 h-32 rounded-xl border-2 border-dashed border-gray-300",
                          "flex items-center justify-center cursor-pointer",
                          "hover:border-gray-400 transition-colors",
                          "relative overflow-hidden"
                        )}
                      >
                        {field.value ? (
                          <img
                            src={field.value}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-500">
                            <User className="w-8 h-8" />
                            <span className="text-xs">Click to upload</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col justify-between md:col-span-2">
            <FormField
              control={form.control}
              name="marketing_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marketing Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Award-winning Science Mentor"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedin_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile</FormLabel>

                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. https://www.linkedin.com/in/your-profile"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormDescription>
                Tell students about your background and mentoring style.
              </FormDescription>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mentoring_areas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mentoring Areas</FormLabel>
              <FormDescription>
                Add tags (e.g. Physics, Math, Robotics)
              </FormDescription>
              <FormControl>
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Type and press enter…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
