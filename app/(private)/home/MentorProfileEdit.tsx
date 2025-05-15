"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Image from "next/image";
import mascot from "./mascot.png";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { ControllerRenderProps } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";

const formSchema = z.object({
  phone_number: z.string().min(1, { message: "Phone number is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  institution_name: z
    .string()
    .min(1, { message: "Institution name is required" }),
  linkedin_url: z.string().min(1, { message: "LinkedIn URL is required" }),
  bio: z.string().min(1, { message: "Bio is required" }),
  hourly_rate: z.number().min(1, { message: "Hourly rate is required" }),
  availability: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

type FormFieldProps<T extends keyof FormValues> = {
  field: ControllerRenderProps<FormValues, T>;
};

const defaultValues: FormValues = {
  phone_number: "",
  address: "",
  institution_name: "",
  linkedin_url: "",
  bio: "",
  hourly_rate: 20,
  availability: [],
};

const getValues = (profile: any, defaultValues: FormValues) => {
  const payload = {
    phone_number: profile.phone_number ?? defaultValues.phone_number,
    address: profile.address ?? defaultValues.address,
    institution_name:
      profile.institution_name ?? defaultValues.institution_name,
    linkedin_url: profile.linkedin_url ?? defaultValues.linkedin_url,
    bio: profile.bio ?? defaultValues.bio,
    hourly_rate: profile.hourly_rate ?? defaultValues.hourly_rate,
    availability: profile.availability ?? defaultValues.availability,
  };
  return payload;
};

const steps = [
  { label: "Personal Info", fields: ["phone_number", "address"] },
  {
    label: "Professional Details",
    fields: ["institution_name", "linkedin_url", "bio"],
  },
  { label: "Availability", fields: ["hourly_rate", "availability"] },
];

export default function MentorProfileEdit({
  profile,
  userId,
}: {
  profile: any;
  userId: string;
}) {
  const supabase = createClient();
  profile = profile || {};
  const [open, setOpen] = useState(true);
  const { toast } = useToast();
  const values = profile ? getValues(profile, defaultValues) : undefined;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    values,
  });
  const [step, setStep] = useState(0);

  const onClose = (open: boolean) => {
    setOpen(open);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // TODO: Implement form submission to your backend
      // const { data: updatedProfile, error } = await supabase
      //   .from("mentor_profiles")
      //   .upsert({
      //     id: userId,
      //     ...profile,
      //     phone_number: data.phone_number,
      //     address: data.address,
      //     institution_name: data.institution_name,
      //     linkedin_url: data.linkedin_url,
      //     bio: data.bio,
      //     hourly_rate: data.hourly_rate,
      //     availability: data.availability,
      //   });

      console.log("PAYLOAD:", {
        id: userId,
        ...profile,
        phone_number: data.phone_number,
        address: data.address,
        institution_name: data.institution_name,
        linkedin_url: data.linkedin_url,
        bio: data.bio,
        hourly_rate: data.hourly_rate,
        availability: data.availability,
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      // setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  // Stepper UI
  const Stepper = () => (
    <div className="flex items-center justify-between mb-6">
      {steps.map((s, idx) => (
        <div key={s.label} className="flex-1 flex flex-col items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= idx ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}
          >
            {step > idx ? (
              <Check className="w-5 h-5" />
            ) : step === idx ? (
              <span className="font-bold">{idx + 1}</span>
            ) : (
              <span>{idx + 1}</span>
            )}
          </div>
          <span
            className={`mt-2 text-xs font-medium ${step === idx ? "text-blue-700" : "text-gray-500"}`}
          >
            {s.label}
          </span>
          {/* {idx < steps.length - 1 && (
            <div
              className={`h-1 w-full ${step > idx ? "bg-blue-600" : "bg-gray-200"}`}
            ></div>
          )} */}
        </div>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetTrigger asChild>
        <Button
          onClick={() => {
            console.log("OPENING SHEET");
            setOpen(true);
          }}
          variant="ghost"
          className="w-full justify-start -ml-4 -mt-3"
        >
          Edit Profile
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className={cn("outline-none p-0 transition-all duration-300")}
      >
        <div className="flex flex-col gap-4 p-3">
          <h1 className="text-xl font-bold">Profile Details</h1>
          <Stepper />
          <div className="flex flex-row gap-2">
            <Image src={mascot} alt="logo" width={48} height={48} />
            <div className="flex flex-col gap-2 flex-1">
              <span>A few details before we proceed</span>
            </div>
          </div>
          <Form {...form}>
            <div className="flex flex-col gap-4">
              {step === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Personal Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Professional Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="institution_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institution Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>LinkedIn URL</FormLabel>
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
                          <FormControl>
                            <Textarea {...field} rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}
              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="hourly_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hourly Rate</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="availability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Availability</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 mt-4">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                )}
                {step < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={async () => {
                      const valid = await form.trigger(
                        steps[step].fields as Parameters<typeof form.trigger>[0]
                      );

                      if (valid) setStep(step + 1);
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    loading={form.formState.isSubmitting}
                    type="button"
                  >
                    Save Changes
                  </Button>
                )}
              </div>
            </div>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
