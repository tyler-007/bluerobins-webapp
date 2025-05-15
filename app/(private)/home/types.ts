import { z } from "zod";
import { ControllerRenderProps } from "react-hook-form";

export const STUDENT_TYPES = [
  { value: "middle_school", label: "Middle School" },
  { value: "high_school", label: "High School" },
  { value: "undergrad", label: "Undergraduate" },
] as const;

export const MIDDLE_SCHOOL_GRADES = ["Grade 6", "Grade 7", "Grade 8"] as const;
export const HIGH_SCHOOL_GRADES = [
  "Grade 9 (Freshman)",
  "Grade 10 (Sophomore)",
  "Grade 11 (Junior)",
  "Grade 12 (Senior)",
] as const;

export type StudentType = (typeof STUDENT_TYPES)[number]["value"];

export const formSchema = z
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

export type FormValues = z.infer<typeof formSchema>;

export type FormFieldProps<T extends keyof FormValues> = {
  field: ControllerRenderProps<FormValues, T>;
};

export const defaultValues: FormValues = {
  studentType: undefined,
  grade: "",
  institution_name: "",
  parentName: "",
  parentEmail: "",
  major: "",
  country: "",
};
