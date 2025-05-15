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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { ControllerRenderProps } from "react-hook-form";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check, ArrowLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { TagInput } from "@/app/components/ui/TagInput";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  phone_number: z.string().min(1, { message: "Phone number is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  state: z.string().min(1, { message: "State is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  mentoring_type: z.enum(["pay_as_you_go", "research_packages", "both"], {
    required_error: "Please select a mentoring type",
  }),
  student_types: z
    .array(z.enum(["middle_school", "high_school", "undergrad"]))
    .min(1, {
      message: "Please select at least one student type",
    }),
  institution: z.string().min(1, { message: "Institution is required" }),
  major: z.string().min(1, { message: "Major is required" }),
  linkedin_url: z.string().min(1, { message: "LinkedIn URL is required" }),
  bio: z.string().min(1, { message: "Bio is required" }),
  commitment_hours: z
    .number()
    .min(1, { message: "Commitment hours is required" }),
  hourly_rate: z.number().min(1, { message: "Hourly rate is required" }),
  availability: z.array(
    z.object({
      day: z.string(),
      start_time: z.string(),
      end_time: z.string(),
      enabled: z.boolean(),
    })
  ),
  mentoring_areas: z
    .array(z.string().min(1))
    .min(1, { message: "Mentoring areas are required" }),
  marketing_title: z
    .string()
    .min(1, { message: "Marketing title is required" }),
  photo_url: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type FormFieldProps<T extends keyof FormValues> = {
  field: ControllerRenderProps<FormValues, T>;
};

const defaultValues: FormValues = {
  name: "",
  phone_number: "",
  address: "",
  state: "",
  country: "",
  mentoring_type: "pay_as_you_go",
  student_types: [],
  institution: "",
  major: "",
  linkedin_url: "",
  bio: "",
  commitment_hours: 5,
  hourly_rate: 20,
  availability: [
    { day: "Sunday", start_time: "09:00", end_time: "17:00", enabled: false },
    { day: "Monday", start_time: "09:00", end_time: "17:00", enabled: false },
    { day: "Tuesday", start_time: "09:00", end_time: "17:00", enabled: false },
    {
      day: "Wednesday",
      start_time: "09:00",
      end_time: "17:00",
      enabled: false,
    },
    { day: "Thursday", start_time: "09:00", end_time: "17:00", enabled: false },
    { day: "Friday", start_time: "09:00", end_time: "17:00", enabled: false },
    { day: "Saturday", start_time: "09:00", end_time: "17:00", enabled: false },
  ],
  mentoring_areas: [],
  marketing_title: "",
  photo_url: "",
};

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

const steps = [
  {
    label: "Basic Details",
    fields: ["name", "phone_number", "address", "state", "country"],
  },
  {
    label: "Mentor Type",
    fields: ["institution", "major", "mentoring_type", "student_types"],
  },
  {
    label: "Availability",
    fields: ["commitment_hours", "hourly_rate", "availability"],
  },
  {
    label: "Profile",
    fields: [
      "photo_url",
      "marketing_title",
      "linkedin_url",
      "bio",
      "mentoring_areas",
    ],
  },
  {
    label: "Review",
    fields: [],
  },
];

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
      // TODO: Implement form submission to your backend
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
          <div className="w-full border-b p-4 flex items-center gap-4">
            {/* <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 text-center">
              {steps[step].label} (Step {step + 1} of {steps.length})
            </div> */}
            {/* Horizontal review stepper */}
            <div className="w-full flex justify-center">
              <div className="max-w-[700px] flex items-center justify-between w-full">
                {[
                  "Profile",
                  "Basic Details",
                  "Mentor Type",
                  "Availability",
                  "Review",
                ].map((label, idx, arr) => {
                  const isCompleted = true; // All are completed in review
                  return (
                    <div
                      key={label}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div className="flex items-center w-full">
                        {/* Step circle with checkmark */}
                        <div
                          className={
                            isCompleted
                              ? "bg-blue-600 border-4 border-white text-white flex items-center justify-center rounded-full w-9 h-9 font-semibold text-lg transition-all duration-200 shadow"
                              : "bg-gray-200 text-gray-500 flex items-center justify-center rounded-full w-9 h-9 font-semibold text-lg transition-all duration-200"
                          }
                        >
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white">
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </span>
                        </div>
                        {/* Line to next step */}
                        {idx < arr.length - 1 && (
                          <div className="bg-blue-600 flex-1 h-1 mx-2 transition-all duration-200" />
                        )}
                      </div>
                      {/* Step label */}
                      <div
                        className="mt-2 text-sm font-medium text-center"
                        style={{ minWidth: 80 }}
                      >
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
            {/* Mascot and chat bubble - full width */}
            {/* <div className="p-4">
              <div className="flex gap-4 mb-6">
                <div className="w-12 h-12">
                  <Image
                    src={mascot}
                    alt="mascot"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="relative bg-white rounded-2xl p-4 shadow-sm flex-1">
                  <div
                    className="absolute left-[-10px] top-4 w-0 h-0 
                    border-t-[10px] border-t-transparent
                    border-r-[10px] border-r-white
                    border-b-[10px] border-b-transparent"
                  ></div>
                  <p className="text-gray-700">
                    Tell us about yourself so that students gets you know you
                    better
                  </p>
                </div>
              </div>
            </div> */}

            {/* Centered form container */}
            <div className="flex justify-center items-center min-h-full w-full">
              <div
                className={`w-full ${step === 4 ? "max-w-[980px]" : "max-w-[640px]"} px-4 py-8`}
              >
                <Form {...form}>
                  <div className="flex flex-col gap-4">
                    {step === 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">
                            Basic Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    defaultValue={name}
                                    placeholder="Enter your name"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Email: {email}
                                </FormDescription>
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
                                  <Input
                                    {...field}
                                    placeholder="Enter your phone number"
                                  />
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
                                  <Input
                                    {...field}
                                    placeholder="Enter your address"
                                  />
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
                                    <Input
                                      {...field}
                                      placeholder="Enter your state"
                                    />
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
                                    <Input
                                      {...field}
                                      placeholder="Enter your country"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="text-sm text-gray-500">
                            Current Timezone:{" "}
                            {Intl.DateTimeFormat().resolvedOptions().timeZone}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {step === 1 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">
                            Mentor Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-6">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="institution"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Institution</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Enter your institution"
                                    />
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
                                  <FormLabel>Major</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Enter your major"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="mentoring_type"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel>Mentoring Type</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col gap-2"
                                  >
                                    <FormItem className="flex space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem
                                          className="mt-[6px]"
                                          value="pay_as_you_go"
                                        />
                                      </FormControl>
                                      <div>
                                        <FormLabel className="font-normal">
                                          Pay as you go sessions
                                        </FormLabel>
                                        <FormDescription className="text-xs">
                                          One-on-one sessions that can be booked
                                          individually, perfect for specific
                                          questions or short-term guidance
                                        </FormDescription>
                                      </div>
                                    </FormItem>
                                    <FormItem className="flex space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem
                                          className="mt-[6px]"
                                          value="research_packages"
                                        />
                                      </FormControl>
                                      <div>
                                        <FormLabel className="font-normal">
                                          Research mentorship packages
                                        </FormLabel>
                                        <FormDescription className="text-xs">
                                          Comprehensive packages for long-term
                                          research projects, including regular
                                          meetings and structured guidance
                                        </FormDescription>
                                      </div>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="both" />
                                      </FormControl>
                                      <div className="space-y-1">
                                        <FormLabel className="font-normal">
                                          Both
                                        </FormLabel>
                                      </div>
                                    </FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="student_types"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel>Type of Students</FormLabel>
                                <div className="flex flex-col gap-4">
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          "middle_school"
                                        )}
                                        onCheckedChange={(checked) => {
                                          const currentValues =
                                            field.value || [];
                                          if (checked) {
                                            field.onChange([
                                              ...currentValues,
                                              "middle_school",
                                            ]);
                                          } else {
                                            field.onChange(
                                              currentValues.filter(
                                                (v) => v !== "middle_school"
                                              )
                                            );
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Middle School
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          "high_school"
                                        )}
                                        onCheckedChange={(checked) => {
                                          const currentValues =
                                            field.value || [];
                                          if (checked) {
                                            field.onChange([
                                              ...currentValues,
                                              "high_school",
                                            ]);
                                          } else {
                                            field.onChange(
                                              currentValues.filter(
                                                (v) => v !== "high_school"
                                              )
                                            );
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      High School
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          "undergrad"
                                        )}
                                        onCheckedChange={(checked) => {
                                          const currentValues =
                                            field.value || [];
                                          if (checked) {
                                            field.onChange([
                                              ...currentValues,
                                              "undergrad",
                                            ]);
                                          } else {
                                            field.onChange(
                                              currentValues.filter(
                                                (v) => v !== "undergrad"
                                              )
                                            );
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Undergraduate
                                    </FormLabel>
                                  </FormItem>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    )}
                    {step === 2 && (
                      <Card>
                        <CardContent className="flex flex-col gap-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="commitment_hours"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Commitment per week (hours)
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Hours per week can you commit
                                  </FormDescription>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(e.target.valueAsNumber)
                                      }
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
                                      onChange={(e) =>
                                        field.onChange(e.target.valueAsNumber)
                                      }
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
                                    <div
                                      key={day.day}
                                      className="flex items-center gap-4"
                                    >
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
                    )}
                    {step === 3 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">
                            Profile
                          </CardTitle>
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
                                            const url =
                                              URL.createObjectURL(file);
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
                                      A short headline to market yourself to
                                      students.
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
                                  example:
                                  https://www.linkedin.com/in/your-profile
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
                                  Tell students about your background and
                                  mentoring style.
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
                    )}
                    {step === 4 && (
                      <div className="flex flex-col items-center w-full">
                        <div className="grid grid-cols-3 grid-rows-2 gap-4 w-full">
                          {/* Profile (spans 2 rows, left) */}
                          <Card className="row-span-2">
                            <CardHeader className="p-2 pb-0">
                              <CardTitle className="text-base font-semibold">
                                Profile
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-1 p-2 pt-1">
                              {steps[3].fields.map((fieldName) => {
                                const value = form.getValues(
                                  fieldName as keyof FormValues
                                );
                                let displayValue: React.ReactNode = null;
                                if (
                                  fieldName === "mentoring_areas" &&
                                  Array.isArray(value) &&
                                  value.every((v) => typeof v === "string")
                                ) {
                                  displayValue =
                                    value.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {value.map((tag: string, i: number) => (
                                          <span
                                            key={i}
                                            className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-blue-200"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span>-</span>
                                    );
                                } else if (Array.isArray(value)) {
                                  displayValue =
                                    value.length > 0 ? (
                                      value.join(", ")
                                    ) : (
                                      <span>-</span>
                                    );
                                } else if (typeof value === "boolean") {
                                  displayValue = value ? "Yes" : "No";
                                } else if (
                                  typeof value === "string" &&
                                  value.startsWith("http")
                                ) {
                                  displayValue = (
                                    <a
                                      href={value}
                                      className="text-blue-600 underline"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {value}
                                    </a>
                                  );
                                } else if (!value) {
                                  displayValue = <span>-</span>;
                                } else {
                                  displayValue = <span>{value}</span>;
                                }
                                return (
                                  <div
                                    key={fieldName}
                                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition flex flex-col gap-0.5"
                                    onClick={() => setStep(3)}
                                  >
                                    <span className="font-medium capitalize text-sm text-gray-500">
                                      {fieldName.replace(/_/g, " ")}
                                    </span>
                                    <span className="text-sm">
                                      {displayValue}
                                    </span>
                                  </div>
                                );
                              })}
                            </CardContent>
                          </Card>
                          {/* Basic Details (top center) */}
                          <Card>
                            <CardHeader className="p-2 pb-0">
                              <CardTitle className="text-base font-semibold">
                                Basic Details
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-1 p-2 pt-1">
                              {steps[0].fields.map((fieldName) => {
                                const value = form.getValues(
                                  fieldName as keyof FormValues
                                );
                                let displayValue: React.ReactNode =
                                  Array.isArray(value) ? (
                                    value.length > 0 ? (
                                      value.join(", ")
                                    ) : (
                                      <span>-</span>
                                    )
                                  ) : value ? (
                                    <span>{value}</span>
                                  ) : (
                                    <span>-</span>
                                  );
                                return (
                                  <div
                                    key={fieldName}
                                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition flex flex-col gap-0.5"
                                    onClick={() => setStep(0)}
                                  >
                                    <span className="font-medium capitalize text-sm text-gray-500">
                                      {fieldName.replace(/_/g, " ")}
                                    </span>
                                    <span className="text-sm">
                                      {displayValue}
                                    </span>
                                  </div>
                                );
                              })}
                            </CardContent>
                          </Card>
                          {/* Availability (spans 2 rows, right) */}
                          <Card className="row-span-2">
                            <CardHeader className="p-2 pb-0">
                              <CardTitle className="text-base font-semibold">
                                Availability
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-1 p-2 pt-1">
                              {steps[2].fields.map((fieldName) => {
                                const value = form.getValues(
                                  fieldName as keyof FormValues
                                );
                                let displayValue: React.ReactNode = null;
                                if (
                                  fieldName === "availability" &&
                                  Array.isArray(value)
                                ) {
                                  const enabledDays = value.filter(
                                    (d: any) => d.enabled
                                  );
                                  displayValue =
                                    enabledDays.length > 0 ? (
                                      <div className="flex flex-col gap-1">
                                        {enabledDays.map(
                                          (d: any, i: number) => (
                                            <span
                                              key={i}
                                              className="inline-block bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded border border-gray-200"
                                            >
                                              {d.day}: {d.start_time} -{" "}
                                              {d.end_time}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <span>-</span>
                                    );
                                } else if (Array.isArray(value)) {
                                  displayValue =
                                    value.length > 0 ? (
                                      value.join(", ")
                                    ) : (
                                      <span>-</span>
                                    );
                                } else {
                                  displayValue = value ? (
                                    <span>{value}</span>
                                  ) : (
                                    <span>-</span>
                                  );
                                }
                                return (
                                  <div
                                    key={fieldName}
                                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition flex flex-col gap-0.5"
                                    onClick={() => setStep(2)}
                                  >
                                    <span className="font-medium capitalize text-sm text-gray-500">
                                      {fieldName.replace(/_/g, " ")}
                                    </span>
                                    <span className="text-sm">
                                      {displayValue}
                                    </span>
                                  </div>
                                );
                              })}
                            </CardContent>
                          </Card>
                          {/* Mentor Type (bottom center) */}
                          <Card>
                            <CardHeader className="p-2 pb-0">
                              <CardTitle className="text-base font-semibold">
                                Mentor Type
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-1 p-2 pt-1">
                              {steps[1].fields.map((fieldName) => {
                                const value = form.getValues(
                                  fieldName as keyof FormValues
                                );
                                let displayValue: React.ReactNode = null;
                                if (
                                  fieldName === "student_types" &&
                                  Array.isArray(value)
                                ) {
                                  displayValue =
                                    value.length > 0 ? (
                                      value.join(", ")
                                    ) : (
                                      <span>-</span>
                                    );
                                } else if (Array.isArray(value)) {
                                  displayValue =
                                    value.length > 0 ? (
                                      value.join(", ")
                                    ) : (
                                      <span>-</span>
                                    );
                                } else {
                                  displayValue = value ? (
                                    <span>{value}</span>
                                  ) : (
                                    <span>-</span>
                                  );
                                }
                                return (
                                  <div
                                    key={fieldName}
                                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition flex flex-col gap-0.5"
                                    onClick={() => setStep(1)}
                                  >
                                    <span className="font-medium capitalize text-sm text-gray-500">
                                      {fieldName.replace(/_/g, " ")}
                                    </span>
                                    <span className="text-sm">
                                      {displayValue}
                                    </span>
                                  </div>
                                );
                              })}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
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
