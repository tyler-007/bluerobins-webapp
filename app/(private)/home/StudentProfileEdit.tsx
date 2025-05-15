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

const gradeOptions = [
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "University",
] as const;

const formSchema = z
  .object({
    grade: z.enum(gradeOptions),
    parentName: z.string(),
    parentEmail: z.string(),
    institution_name: z.string(),
    major: z.string(),
  })
  .superRefine((val, ctx) => {
    if (val.grade === "University") {
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

    if (val.grade !== "University") {
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
  grade: "Grade 6",
  institution_name: "",
  parentName: "",
  parentEmail: "",
  major: "",
};

const getValues = (profile: any, defaultValues: FormValues) => {
  const payload = {
    grade:
      profile.student_type === "undergrad"
        ? "University"
        : (profile.grade ?? defaultValues.grade),
    institution_name:
      profile.institution_name ?? defaultValues.institution_name,
    parentName: profile.parent_name ?? defaultValues.parentName,
    parentEmail: profile.parent_email ?? defaultValues.parentEmail,
    major: profile.major ?? defaultValues.major,
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
    defaultValues,
    values,
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

  const grade = form.watch("grade");
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
          <div className="flex flex-row gap-2">
            <Image src={mascot} alt="logo" width={48} height={48} />
            <div className="flex flex-col gap-2 flex-1">
              <span>A few details before we proceed</span>
            </div>
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="grade"
                render={({ field }: FormFieldProps<"grade">) => (
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
                          {gradeOptions.map((grade) => (
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
              {grade && (
                <>
                  {grade !== "University" ? (
                    <>
                      <FormField
                        control={form.control}
                        name="institution_name"
                        render={({
                          field,
                        }: FormFieldProps<"institution_name">) => (
                          <FormItem>
                            <FormLabel>School Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="parentName"
                        render={({ field }: FormFieldProps<"parentName">) => (
                          <FormItem>
                            <FormLabel>Parent's Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="parentEmail"
                        render={({ field }: FormFieldProps<"parentEmail">) => (
                          <FormItem>
                            <FormLabel>Parent's Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="institution_name"
                        render={({
                          field,
                        }: FormFieldProps<"institution_name">) => (
                          <FormItem>
                            <FormLabel>University Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="major"
                        render={({ field }: FormFieldProps<"major">) => (
                          <FormItem>
                            <FormLabel>Major</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </>
              )}
              <Button
                loading={form.formState.isSubmitting}
                type="submit"
                className="mt-4"
              >
                Save Changes
              </Button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
