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
import { Check, ArrowLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

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
  hourly_rate: z.number().min(1, { message: "Hourly rate is required" }),
  availability: z.string(),
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
  hourly_rate: 20,
  availability: "",
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
    hourly_rate: profile.hourly_rate ?? defaultValues.hourly_rate,
    availability: profile.availability ?? defaultValues.availability,
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
    fields: [
      "institution",
      "major",
      "linkedin_url",
      "mentoring_type",
      "student_types",
    ],
  },
  {
    label: "Professional Details",
    fields: ["bio"],
  },
  {
    label: "Availability",
    fields: ["hourly_rate", "availability"],
  },
  {
    label: "Step 5",
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
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 text-center">
              Basic Details (Step {step + 1} of {steps.length})
            </div>
          </div>

          {/* Progress bar - full width */}
          <div className="w-full px-4 flex gap-1">
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

          {/* Main content */}
          <div className="flex-1 overflow-auto">
            {/* Mascot and chat bubble - full width */}
            <div className="p-4">
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
            </div>

            {/* Centered form container */}
            <div className="flex justify-center w-full">
              <div className="w-full max-w-[640px] px-4">
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
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">
                            Professional Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                          <FormField
                            control={form.control}
                            name="institution"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Institution</FormLabel>
                                <FormDescription>
                                  Your current or most recent educational
                                  institution
                                </FormDescription>
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
                                <FormDescription>
                                  Your field of study or specialization
                                </FormDescription>
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
                          <FormField
                            control={form.control}
                            name="linkedin_url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>LinkedIn URL</FormLabel>
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
                                  Why we need the bio goes here.
                                </FormDescription>
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
                    {step === 3 && (
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
                                <FormDescription>
                                  Why we need the hourly rate goes here.
                                </FormDescription>
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
                                <FormDescription>
                                  Why we need the availability goes here.
                                </FormDescription>
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
