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

interface ProfileStepProps {
  form: UseFormReturn<FormValues>;
}

export function ProfileStep({ form }: ProfileStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex flex-col items-center justify-center">
            <FormField
              control={form.control}
              name="photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo Upload</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // For now, just use a local URL preview
                          const url = URL.createObjectURL(file);
                          field.onChange(url);
                        }
                      }}
                    />
                  </FormControl>
                  {field.value && (
                    <div className="mt-2 flex justify-center">
                      <img
                        src={field.value}
                        alt="Profile preview"
                        className="w-32 h-32 object-cover rounded-xl border"
                        style={{ aspectRatio: 1 }}
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-2">
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
                  <FormDescription className="text-xs">
                    A short headline to market yourself to students.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <FormField
          control={form.control}
          name="linkedin_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn Profile</FormLabel>
              <FormDescription>
                example: https://www.linkedin.com/in/your-profile
              </FormDescription>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
