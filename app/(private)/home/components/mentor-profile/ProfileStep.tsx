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
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

interface ProfileStepProps {
  form: UseFormReturn<FormValues>;
}

export function ProfileStep({ form }: ProfileStepProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, [supabase.auth]);

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
                          if (!file || !userId) return;

                          try {
                            // Upload to Supabase Storage
                            const fileExt = file.name.split(".").pop();
                            const fileName = `${userId}/${Date.now()}.${fileExt}`;

                            const { error: uploadError } =
                              await supabase.storage
                                .from("profile-photos")
                                .upload(fileName, file, {
                                  cacheControl: "3600",
                                  upsert: true,
                                });

                            if (uploadError) throw uploadError;

                            // Get public URL
                            const {
                              data: { publicUrl },
                            } = supabase.storage
                              .from("profile-photos")
                              .getPublicUrl(fileName);

                            field.onChange(publicUrl);

                            toast({
                              title: "Success",
                              description:
                                "Profile photo uploaded successfully",
                            });
                          } catch (error: any) {
                            console.error("Error uploading file:", error);
                            toast({
                              title: "Error",
                              description:
                                error.message || "Failed to upload photo",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                      <label
                        htmlFor="photo-upload"
                        className={cn(
                          "min-w-32 max-w-32 min-h-32 max-h-32 h-full aspect-square rounded-xl border-2 border-dashed border-gray-300",
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
          <div className="flex flex-col justify-between md:col-span-2 gap-4">
            <FormField
              control={form.control}
              name="marketing_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marketing Title</FormLabel>
                  <FormDescription className="text-sm !-mt-1">
                    This will be displayed on your profile page.
                  </FormDescription>
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
                      value={field.value ?? ""}
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
          name="expertise"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mentoring Areas</FormLabel>
              <FormDescription>
                Add tags (e.g. Physics, Robotics, Counseling, Essay Writing)
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
