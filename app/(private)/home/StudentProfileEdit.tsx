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
    schoolName: z.string(),
    parentName: z.string(),
    parentEmail: z.string(),
    universityName: z.string(),
    major: z.string(),
  })
  .superRefine((val, ctx) => {
    console.log("SUPER REFINE", val, ctx);
    if (val.grade === "University") {
      if (val.universityName === "") {
        ctx.addIssue({
          path: ["universityName"],
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
      if (val.schoolName === "") {
        errors.push("schoolName");
        ctx.addIssue({
          path: ["schoolName"],
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
    // if (val.length > 3) {
    //   ctx.addIssue({
    //     code: z.ZodIssueCode.too_big,
    //     maximum: 3,
    //     type: "array",
    //     inclusive: true,
    //     message: "Too many items 😡",
    //   });
    // }

    // if (val.length !== new Set(val).size) {
    //   ctx.addIssue({
    //     code: z.ZodIssueCode.custom,
    //     message: `No duplicates allowed.`,
    //   });
    // }
  });

type FormValues = z.infer<typeof formSchema>;

type FormFieldProps<T extends keyof FormValues> = {
  field: ControllerRenderProps<FormValues, T>;
};

export default function StudentProfileEdit() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: undefined,
      schoolName: "",
      parentName: "",
      parentEmail: "",
      universityName: "",
      major: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    console.log("SUBMITTING");
    try {
      // TODO: Implement form submission to your backend
      console.log(data);
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
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
                        name="schoolName"
                        render={({ field }: FormFieldProps<"schoolName">) => (
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
                        name="universityName"
                        render={({
                          field,
                        }: FormFieldProps<"universityName">) => (
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
              <Button type="submit" className="mt-4">
                Save Changes
              </Button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
