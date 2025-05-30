"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";
import {
  defaultValues,
  formSchema,
  FormValues,
  steps,
} from "./types/mentor-profile";
import { BasicDetailsStep } from "./components/mentor-profile/BasicDetailsStep";
import { MentorTypeStep } from "./components/mentor-profile/MentorTypeStep";
import { AvailabilityStep } from "./components/mentor-profile/AvailabilityStep";
import { ProfileStep } from "./components/mentor-profile/ProfileStep";
import { Stepper } from "./components/mentor-profile/Stepper";

const getValues = (profile: any, defaultValues: FormValues, props: any) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const availability = !!profile.availability
    ? days.map((day) => {
        const slots = profile.availability[day];
        const base = {
          day,
          start_time: "",
          end_time: "",
          enabled: !!slots?.length,
        } as any;
        if ((slots as any[])?.[0]?.start)
          base.start_time = (slots as any[])?.[0]?.start;
        if ((slots as any[])?.[0]?.end)
          base.end_time = (slots as any[])?.[0]?.end;
        return base;
      })
    : defaultValues.availability;

  const payload = {
    name: profile?.name ?? profile.name ?? props.name ?? defaultValues.name,
    phone_number: profile.phone_number ?? defaultValues.phone_number,
    address: profile.address ?? defaultValues.address,
    state: profile.state ?? defaultValues.state,
    country: profile.country ?? defaultValues.country,
    mentoring_type: profile.mentoring_type ?? defaultValues.mentoring_type,
    preferred_mentees:
      profile.preferred_mentees ?? defaultValues.preferred_mentees,
    institution: profile.institution ?? defaultValues.institution,
    major: profile.major ?? defaultValues.major,
    linkedin_url: profile.linkedin_url ?? defaultValues.linkedin_url,
    bio: profile.bio ?? defaultValues.bio,
    hours_per_week: profile.hours_per_week ?? defaultValues.hours_per_week,
    hourly_rate: profile.hourly_rate ?? defaultValues.hourly_rate,
    availability: availability,
    expertise: profile.expertise ?? defaultValues.expertise,
    marketing_title: profile.marketing_title ?? defaultValues.marketing_title,
    photo_url: profile.photo_url ?? defaultValues.photo_url,
  };
  return payload;
};

export default function MentorProfileEdit({
  profile,
  userId,
  name,
  email,
}: {
  profile: any;
  userId: string;
  name: string;
  email: string;
}) {
  const supabase = createClient();
  profile = profile || {};
  const [open, setOpen] = useState(!profile.onboarded);
  const { toast } = useToast();
  const values = profile
    ? getValues(profile, defaultValues, { name })
    : undefined;
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
      const { name, ...payload } = data;
      console.log("PAYLOAD:", payload);
      const { data: updatedProfile, error: profileError } = await supabase
        .from("profiles")
        .update({
          name,
        })
        .eq("id", userId);
      console.log("UPDATED PROFILE:", updatedProfile, profileError);

      const availability = data.availability.reduce((acc: any, curr: any) => {
        acc[curr.day] = [];
        if (curr.enabled)
          acc[curr.day].push({
            end: curr.end_time,
            start: curr.start_time,
          });
        return acc;
      }, {});

      payload.availability = availability;

      const { data: updatedMentorProfile, error } = await supabase
        .from("mentor_profiles")
        .upsert({
          id: userId,
          onboarded: true,
          ...payload,
        });
      console.log("UPDATED MENTOR PROFILE:", updatedMentorProfile, error);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setOpen(false);
    } catch (error) {
      console.log("ERROR:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const clearFieldError = (fieldName: keyof FormValues) => {
    form.clearErrors(fieldName);
  };

  return (
    <Sheet open={open} onOpenChange={onClose} modal={false}>
      <SheetTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant="ghost"
          className="w-full justify-start -ml-4 -mt-3"
        >
          Edit Profile
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className={cn(
          "outline-none p-0 transition-all duration-300 min-w-screen max-w-none sm:max-w-none w-screen bg-[#EBF5FF]"
        )}
      >
        <SheetTitle className="hidden">Edit Profile</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Header - full width */}
          <div className="w-full border-b p-4">
            <Stepper currentStep={step} steps={steps} />
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto">
            {/* Centered form container */}
            <div className="flex justify-center items-center min-h-full w-full">
              <div className={`w-full max-w-[640px] px-4 py-4`}>
                <Form {...form}>
                  <div className="flex flex-col gap-4">
                    {step === 0 && (
                      <BasicDetailsStep form={form} email={email} />
                    )}
                    {step === 1 && <MentorTypeStep form={form} />}
                    {step === 2 && <AvailabilityStep form={form} />}
                    {step === 3 && <ProfileStep form={form} />}
                  </div>
                </Form>
              </div>
            </div>
          </div>

          {/* Footer - full width */}
          <div className="w-full border-t bg-white p-4">
            <div className="flex gap-2 justify-end">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
