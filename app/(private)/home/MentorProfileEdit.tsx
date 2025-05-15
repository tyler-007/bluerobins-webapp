"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
import { ReviewStep } from "./components/mentor-profile/ReviewStep";
import { Stepper } from "./components/mentor-profile/Stepper";

const getValues = (profile: any, defaultValues: FormValues, props: any) => {
  const payload = {
    name: profile?.name ?? profile.name ?? props.name ?? defaultValues.name,
    phone_number: profile.phone_number ?? defaultValues.phone_number,
    address: profile.address ?? defaultValues.address,
    state: profile.state ?? defaultValues.state,
    country: profile.country ?? defaultValues.country,
    mentoring_type: profile.mentoring_type ?? defaultValues.mentoring_type,
    student_types: profile.student_types ?? defaultValues.student_types,
    institution: profile.institution ?? defaultValues.institution,
    major: profile.major ?? defaultValues.major,
    linkedin_url: profile.linkedin_url ?? defaultValues.linkedin_url,
    bio: profile.bio ?? defaultValues.bio,
    commitment_hours:
      profile.commitment_hours ?? defaultValues.commitment_hours,
    hourly_rate: profile.hourly_rate ?? defaultValues.hourly_rate,
    availability: profile.availability ?? defaultValues.availability,
    mentoring_areas: profile.mentoring_areas ?? defaultValues.mentoring_areas,
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
  const [open, setOpen] = useState(true);
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
      const { data: updatedProfile, error } = await supabase
        .from("mentor_profiles")
        .upsert({
          user_id: userId,
          phone_number: data.phone_number,
          address: data.address,
          institution: data.institution,
          major: data.major,
          linkedin_profile: data.linkedin_url,
          bio: data.bio,
          hourly_rate: data.hourly_rate,
          availability: data.availability,
          mentoring_areas: data.mentoring_areas,
          marketing_title: data.marketing_title,
          photo_url: data.photo_url,
        });

      console.log("UPDATED PROFILE:", updatedProfile, error);

      console.log("PAYLOAD:", {
        id: userId,
        ...profile,
        phone_number: data.phone_number,
        address: data.address,
        institution: data.institution,
        major: data.major,
        linkedin_url: data.linkedin_url,
        bio: data.bio,
        hourly_rate: data.hourly_rate,
        availability: data.availability,
        mentoring_areas: data.mentoring_areas,
        marketing_title: data.marketing_title,
        photo_url: data.photo_url,
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
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
        <div className="flex flex-col h-full">
          {/* Header - full width */}
          <div className="w-full border-b p-4">
            <Stepper currentStep={step} steps={steps} />
          </div>

          {/* Progress bar - full width */}
          <div className="w-full">
            <div className="mx-auto max-w-[640px] px-4 flex gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    idx === step ? "bg-blue-500" : "bg-blue-100"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto">
            {/* Centered form container */}
            <div className="flex justify-center items-center min-h-full w-full">
              <div
                className={`w-full ${
                  step === 4 ? "max-w-[980px]" : "max-w-[640px]"
                } px-4 py-8`}
              >
                <Form {...form}>
                  <div className="flex flex-col gap-4">
                    {step === 0 && (
                      <BasicDetailsStep form={form} email={email} />
                    )}
                    {step === 1 && <MentorTypeStep form={form} />}
                    {step === 2 && <AvailabilityStep form={form} />}
                    {step === 3 && <ProfileStep form={form} />}
                    {step === 4 && (
                      <ReviewStep form={form} onStepClick={setStep} />
                    )}
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
                    setStep(step + 1);
                    // const valid = await form.trigger(
                    //   steps[step].fields as Parameters<typeof form.trigger>[0]
                    // );
                    // if (valid) setStep(step + 1);
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
