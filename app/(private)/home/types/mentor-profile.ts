import { z } from "zod";

export const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  phone_number: z
    .string()
    .min(1, { message: "Phone number is required" })
    .min(10, { message: "Phone number must be at least 10 digits" }),
  address: z.string().min(1, { message: "Address is required" }),
  state: z.string().min(1, { message: "State is required" }),
  city: z.string().min(1, { message: "City is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  mentoring_type: z.enum(["pay_as_you_go", "research_packages", "both"], {
    required_error: "Please select a mentoring type",
  }),
  preferred_mentees: z
    .array(z.enum(["middle_school", "high_school", "undergrad"]))
    .min(1, {
      message: "Please select at least one student type",
    }),
  institution: z.string().min(1, { message: "Institution is required" }),
  major: z.string().min(1, { message: "Major is required" }),
  linkedin_url: z.string().trim().url().optional().nullable(),
  bio: z.string().min(1, { message: "Bio is required" }),
  hours_per_week: z
    .number()
    .min(1, { message: "Commitment hours is required" })
    .nullable(),
  hourly_rate: z
    .number()
    .min(1, { message: "Hourly rate is required" })
    .nullable(),
  availability: z
    .array(
      z.object({
        day: z.string(),
        start_time: z.string().optional(),
        end_time: z.string().optional(),
        enabled: z.boolean(),
      })
    )
    .optional(),
  expertise: z
    .array(z.string().min(1))
    .min(1, { message: "Mentoring areas are required" }),
  marketing_title: z
    .string()
    .min(1, { message: "Marketing title is required" }),
  photo_url: z.string(),
});

export type FormValues = z.infer<typeof formSchema>;

export const defaultValues: FormValues = {
  name: "",
  phone_number: "",
  address: "",
  state: "",
  country: "",
  mentoring_type: "pay_as_you_go",
  preferred_mentees: [],
  institution: "",
  major: "",
  linkedin_url: "",
  bio: "",
  hours_per_week: null,
  hourly_rate: null,
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
  expertise: [],
  marketing_title: "",
  photo_url: "",
};

export const steps = [
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
    fields: ["hours_per_week", "hourly_rate", "availability"],
  },
  {
    label: "Profile",
    fields: [
      "photo_url",
      "marketing_title",
      "linkedin_url",
      "bio",
      "expertise",
    ],
  },
];
