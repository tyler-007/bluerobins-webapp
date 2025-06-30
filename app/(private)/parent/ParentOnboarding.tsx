"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useRouter } from "next/navigation";

const parentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  country: z.string().optional(),
});

type ParentFormValues = z.infer<typeof parentFormSchema>;

export default function ParentOnboarding({ userId, email: defaultEmail }: { userId: string; email: string }) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ParentFormValues>({
    resolver: zodResolver(parentFormSchema),
    defaultValues: {
      name: "",
      email: defaultEmail || "",
      phone: "",
      country: "",
    },
  });

  const onSubmit = async (data: ParentFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("parent_profiles").upsert(
        {
          user_id: userId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          country: data.country,
        },
        {
          onConflict: "user_id",
        }
      );
      if (error) throw error;
      toast({ title: "Success", description: "Profile updated successfully." });
      setTimeout(() => {
        router.push("/parent");
      }, 1500);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 max-w-md mx-auto bg-white rounded-xl shadow mt-10">
      <h2 className="text-2xl font-bold mb-2">Parent Onboarding</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input {...field} placeholder="Your name" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} placeholder="Email address" type="email" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (optional)</FormLabel>
                <FormControl><Input {...field} placeholder="Phone number" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country (optional)</FormLabel>
                <FormControl><Input {...field} placeholder="Country" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" loading={loading} disabled={loading} className="mt-2">Save Profile</Button>
        </form>
      </Form>
    </div>
  );
} 