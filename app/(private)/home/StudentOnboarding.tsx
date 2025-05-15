"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Image from "next/image";
import mascot from "./mascot.png";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";

import { getCountry } from "@/lib/timezone";

import { FormValues, defaultValues, formSchema } from "./types";
import { StudentTypeSelector } from "./components/StudentTypeSelector";
import { InstitutionAndCountry } from "./components/InstitutionAndCountry";
import { GradeSelector } from "./components/GradeSelector";
import { ParentInfo } from "./components/ParentInfo";
import { MajorField } from "./components/MajorField";

export default function StudentProfileEdit({
  profile,
  userId,
}: {
  profile: any;
  userId: string;
}) {
  const supabase = createClient();
  profile = profile || {};
  const [show, setShow] = useState(!profile.institution_name);
  const { toast } = useToast();

  const values = profile
    ? {
        studentType: profile.student_type || undefined,
        grade: profile.grade ?? defaultValues.grade,
        institution_name:
          profile.institution_name ?? defaultValues.institution_name,
        parentName: profile.parent_name ?? defaultValues.parentName,
        parentEmail: profile.parent_email ?? defaultValues.parentEmail,
        major: profile.major ?? defaultValues.major,
        country: profile.country ?? defaultValues.country,
      }
    : undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: values || defaultValues,
  });

  const studentType = form.watch("studentType");
  const isUndergrad = studentType === "undergrad";

  const onSubmit = async (data: FormValues) => {
    try {
      const { error } = await supabase.from("student_profiles").upsert({
        id: userId,
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
        country: data.country,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const setDefaultCountry = async () => {
      const defaultCountry = await getCountry();
      form.setValue("country", defaultCountry);
    };
    setDefaultCountry();
  }, [form]);

  if (!show) {
    return null;
  }

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
              render={({ field }) => <StudentTypeSelector field={field} />}
            />

            {studentType && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <InstitutionAndCountry
                  control={form.control}
                  isUndergrad={isUndergrad}
                />

                {!isUndergrad && (
                  <>
                    <GradeSelector
                      control={form.control}
                      studentType={studentType}
                    />
                    <ParentInfo control={form.control} />
                  </>
                )}

                {isUndergrad && <MajorField control={form.control} />}

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
