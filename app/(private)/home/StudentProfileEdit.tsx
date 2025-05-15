"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
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

import { Check, ChevronsUpDown } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { countries } from "@/lib/countries";
import {
  getCountryFromTimezone,
  getCountryFromSpecificTimezone,
  getCountry,
} from "@/lib/timezone";

const studentTypes = [
  { value: "middle_school", label: "Middle School" },
  { value: "high_school", label: "High School" },
  { value: "undergrad", label: "Undergraduate" },
] as const;

const middleSchoolGrades = ["Grade 6", "Grade 7", "Grade 8"] as const;
const highSchoolGrades = [
  "Grade 9 (Freshman)",
  "Grade 10 (Sophomore)",
  "Grade 11 (Junior)",
  "Grade 12 (Senior)",
] as const;
const undergradGrades = ["Undergrad"] as const;

const formSchema = z
  .object({
    studentType: z
      .enum(["middle_school", "high_school", "undergrad"])
      .optional(),
    grade: z.string(),
    parentName: z.string(),
    parentEmail: z.string(),
    institution_name: z.string(),
    major: z.string(),
    country: z.string().min(2, { message: "Please select a country" }),
  })
  .superRefine((val, ctx) => {
    if (!val.studentType) {
      ctx.addIssue({
        path: ["studentType"],
        code: z.ZodIssueCode.custom,
        message: "Please select a student type",
      });
      return false;
    }

    if (val.studentType === "undergrad") {
      if (val.institution_name === "") {
        ctx.addIssue({
          path: ["institution_name"],
          code: z.ZodIssueCode.custom,
          message: "University name is required",
        });
      }
      if (val.major === "") {
        ctx.addIssue({
          path: ["major"],
          code: z.ZodIssueCode.custom,
          message: "Major is required",
        });
      }
    }

    if (val.studentType !== "undergrad") {
      let errors = [];
      if (val.institution_name === "") {
        errors.push("institution_name");
        ctx.addIssue({
          path: ["institution_name"],
          code: z.ZodIssueCode.custom,
          message: "School name is required",
        });
      }
      if (val.parentName === "") {
        errors.push("parentName");
        ctx.addIssue({
          path: ["parentName"],
          code: z.ZodIssueCode.custom,
          message: "Parent's name is required",
        });
      }
      if (val.parentEmail === "") {
        ctx.addIssue({
          path: ["parentEmail"],
          code: z.ZodIssueCode.custom,
          message: "Parent's email is required",
        });
      } else {
        // Email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val.parentEmail)) {
          errors.push("parentEmail");
          ctx.addIssue({
            path: ["parentEmail"],
            code: z.ZodIssueCode.custom,
            message: "Invalid email address",
          });
        }
      }
      if (errors.length > 0) {
        return false;
      }
    }

    return true;
  });

type FormValues = z.infer<typeof formSchema>;

type FormFieldProps<T extends keyof FormValues> = {
  field: ControllerRenderProps<FormValues, T>;
};

const defaultValues: FormValues = {
  studentType: undefined,
  grade: "",
  institution_name: "",
  parentName: "",
  parentEmail: "",
  major: "",
  country: "",
};

const getValues = (profile: any, defaultValues: FormValues) => {
  const payload = {
    studentType: profile.student_type || undefined,
    grade: profile.grade ?? defaultValues.grade,
    institution_name:
      profile.institution_name ?? defaultValues.institution_name,
    parentName: profile.parent_name ?? defaultValues.parentName,
    parentEmail: profile.parent_email ?? defaultValues.parentEmail,
    major: profile.major ?? defaultValues.major,
    country: profile.country ?? defaultValues.country,
  };
  return payload;
};

export default function StudentProfileEdit({
  profile,
  userId,
}: {
  profile: any;
  userId: string;
}) {
  const supabase = createClient();
  profile = profile || {};
  const [open, setOpen] = useState(!profile.institution_name);
  const { toast } = useToast();
  const values = profile ? getValues(profile, defaultValues) : undefined;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: values || defaultValues,
  });

  const onClose = (open: boolean) => {
    if (!profile.institution_name) return;
    setOpen(open);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // TODO: Implement form submission to your backend
      const { data: updatedProfile, error } = await supabase
        .from("student_profiles")
        .upsert({
          id: userId,
          ...profile,
          student_type: data.major
            ? "undergrad"
            : [6, 7, 8].some((grade) => data.grade.includes(grade.toString()))
              ? "middle_school"
              : "high_school",
          institution_name: data.institution_name,
          major: data.major,
          grade: data.major ? undefined : data.grade,
          parent_name: data.parentName,
          parent_email: data.parentEmail,
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

  const studentType = form.watch("studentType");
  const grade = form.watch("grade");

  const _getCountry = async () => {
    const defaultCountry = await getCountry();
    form.setValue("country", defaultCountry);
  };

  useEffect(() => {
    _getCountry();
  }, []);

  return (
    <div
      className={cn(
        "absolute inset-0 outline-none p-0 transition-all duration-300 min-w-screen max-w-none sm:max-w-none w-screen"
      )}
    >
      <div className="flex flex-col gap-4 p-3 h-screen bg-gradient-primary">
        <div className="flex flex-row gap-2">
          <Image src={mascot} alt="logo" width={88} height={88} />
          <div className="flex flex-col gap-2 flex-1">
            <div className="relative bg-white rounded-2xl p-4 shadow-sm">
              <div
                className="absolute left-[-10px] top-4 w-0 h-0 
                border-t-[10px] border-t-transparent
                border-r-[10px] border-r-white
                border-b-[10px] border-b-transparent"
              ></div>
              <p className="text-gray-700">
                {!studentType
                  ? "First, tell us what type of student you are"
                  : "Now, let's get to know you better"}
              </p>
            </div>
          </div>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 flex-1 w-full max-w-[640px] mx-auto"
          >
            <FormField
              control={form.control}
              name="studentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What type of student are you?</FormLabel>
                  <FormControl>
                    <div className="flex flex-row gap-2">
                      {studentTypes.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant={
                            field.value === type.value ? "default" : "outline"
                          }
                          className="flex-1"
                          onClick={() => field.onChange(type.value)}
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {studentType && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {studentType !== "undergrad" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="institution_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter your school name"
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
                              <Combobox
                                items={countries.map((country) => ({
                                  value: country.code,
                                  label: country.name,
                                }))}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Select country"
                                searchPlaceholder="Search country..."
                                emptyText="No country found."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Which grade are you in?</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a grade" />
                              </SelectTrigger>
                              <SelectContent>
                                {studentType === "middle_school" &&
                                  middleSchoolGrades.map((grade) => (
                                    <SelectItem key={grade} value={grade}>
                                      {grade}
                                    </SelectItem>
                                  ))}
                                {studentType === "high_school" &&
                                  highSchoolGrades.map((grade) => (
                                    <SelectItem key={grade} value={grade}>
                                      {grade}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent's Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter parent's name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parentEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent's Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter parent's email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="institution_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>University Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter your university name"
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
                              <Combobox
                                items={countries.map((country) => ({
                                  value: country.code,
                                  label: country.name,
                                }))}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Select country"
                                searchPlaceholder="Search country..."
                                emptyText="No country found."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="major"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Major</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your major" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="flex-1" />
                <div className="flex flex-row gap-2">
                  <Button
                    loading={form.formState.isSubmitting}
                    type="submit"
                    className="mt-4"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
