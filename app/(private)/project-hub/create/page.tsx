"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/utils/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import dayjs from "dayjs";
import { useUser } from "@/app/hooks/useUser";
import { useRouter } from "next/navigation";

const SELLING_PRICE_COST_MAP = {
  "8": {
    selling_price: 1089,
    cost_price: 839,
  },
  "12": {
    selling_price: 1289,
    cost_price: 900,
  },
};

const formSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  category: z.string().min(1, "Project category is required"),
  description: z.string().min(1, "Project description is required"),
  sessions: z.enum(["8", "12"], {
    required_error: "Please select number of sessions",
  }),
  spots: z
    .number()
    .min(1, "Minimum 1 spot required")
    .max(10, "Maximum 10 spots allowed"),
  startDate: z
    .string()
    .min(1, "Start date is required")
    .refine(
      (date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)),
      "Start date cannot be in the past"
    ),
  dayOfWeek: z.string().min(1, "Day of week is required"),
  time: z.string().min(1, "Time is required"),
  sessionDescriptions: z
    .array(z.string().min(8, "Session description is required"))
    .refine(
      (arr) => arr.length === 8 || arr.length === 12,
      "Must have either 8 or 12 sessions"
    ),
  tools: z
    .array(
      z.object({
        title: z.string().min(1, "Required"),
        url: z.string().url("Invalid URL").or(z.literal("")),
      })
    )
    .min(1, "At least one tool is required"),
  prereqs: z
    .array(
      z.object({
        title: z.string().min(1, "Required"),
        url: z.string().url("Invalid URL").or(z.literal("")),
      })
    )
    .min(1, "At least one prerequisite is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreatePage() {
  const supabase = createClient();
  const router = useRouter();
  const { data: user } = useUser();
  const userId = user?.id;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      sessions: "8",
      spots: 1,
      startDate: "",
      dayOfWeek: "",
      time: "",
      sessionDescriptions: Array(12).fill(""),
      tools: [
        { title: "SAM Platform + SAM Paper", url: "" },
        { title: "Python", url: "" },
        { title: "Kaggle brain tumor dataset", url: "" },
        { title: "Jupyter Notebooks", url: "" },
      ],
      prereqs: [
        { title: "CNN basics", url: "" },
        { title: "Image data handling", url: "" },
        { title: "Python programming", url: "" },
      ],
    },
  });

  const {
    fields: toolFields,
    append: appendTool,
    remove: removeTool,
  } = useFieldArray({
    control: form.control,
    name: "tools",
  });

  const {
    fields: prereqFields,
    append: appendPrereq,
    remove: removePrereq,
  } = useFieldArray({
    control: form.control,
    name: "prereqs",
  });

  // Add effect to update day of week when date changes
  React.useEffect(() => {
    const startDate = form.watch("startDate");
    if (startDate) {
      const date = new Date(startDate);
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const dayOfWeek = days[date.getDay()];
      form.setValue("dayOfWeek", dayOfWeek);
    }
  }, [form.watch("startDate")]);

  // Add effect to update session descriptions when sessions count changes
  React.useEffect(() => {
    const sessions = form.watch("sessions");
    const currentDescriptions = form.getValues("sessionDescriptions");
    const newLength = parseInt(sessions);

    if (currentDescriptions.length !== newLength) {
      const newDescriptions = Array(newLength)
        .fill("")
        .map((_, i) => currentDescriptions[i] || "");
      form.setValue("sessionDescriptions", newDescriptions);
    }
  }, [form.watch("sessions")]);

  const onSubmit = async (values: FormValues) => {
    const {
      title,
      category,
      description,
      sessions,
      spots,
      startDate,
      dayOfWeek,
      time,
      sessionDescriptions,
      tools,
      prereqs,
    } = values;

    const selling_price = SELLING_PRICE_COST_MAP[sessions].selling_price;
    const cost_price = SELLING_PRICE_COST_MAP[sessions].cost_price;

    const { data, error } = await supabase.from("projects").insert({
      title,
      description,
      categories: category.split(","),
      sessions_count: sessions,
      spots,
      start_date: dayjs(`${startDate} ${time}`, "YYYY-MM-DD HH:mm").toDate(),
      session_time: dayjs(`${startDate} ${time}`, "YYYY-MM-DD HH:mm").toDate(),
      session_day: dayOfWeek,
      agenda: sessionDescriptions.map((description) => ({
        description,
      })),
      tools,
      selling_price: selling_price,
      cost_price: cost_price,
      prerequisites: prereqs,
      mentor_user: userId,
    });
    console.log("SUBMITTED", data, error);
    router.replace("/project-hub");
  };

  console.log("Errors:", form.formState.errors);

  return (
    <div className="min-h-screen w-full grid grid-cols-[1fr_300px] items-center">
      <div className="w-full p-8 relative">
        <div className="flex items-center mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="icon"
            className="mr-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">Create project</h1>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              loading={form.formState.isSubmitting}
              type="submit"
              className="px-8"
              onClick={form.handleSubmit(onSubmit)}
            >
              Create
            </Button>
          </div>
        </div>
        <Form {...form}>
          <form className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-lg">
                    Project title
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                  <div className="text-gray-400 text-sm mt-1">
                    Enter a short, clear title of the research/passion project
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-lg">
                    Project category
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                  <div className="text-gray-400 text-sm mt-1">
                    Enter the broad topic or interdisciplinary area the project
                    belongs to
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-lg">
                    Project Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="eg. Explore how artificial intelligence is transforming learning experiences, personalizing education."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-gray-400 text-sm mt-1">
                    Enter a quick summary to attract students and help them
                    understand the project's focus.
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="sessions"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-semibold text-lg">
                      Number of Sessions
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="8" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            8 Sessions
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="12" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            12 Sessions
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    <div className="text-gray-400 text-sm mt-1">
                      Choose between 8 or 12 sessions for your project
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spots"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-semibold text-lg">
                      Available spots
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={3}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-gray-400 text-sm mt-1">
                      How many students can join this project? (1-3)
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-semibold text-lg">
                      Start date
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-gray-400 text-sm mt-1">
                      When will the project begin?
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-semibold text-lg">
                      Day of the week
                    </FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    <div className="text-gray-400 text-sm mt-1">
                      Day is automatically set based on the selected date
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-semibold text-lg">
                      Time
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                    <div className="text-gray-400 text-sm mt-1">
                      What time will the session start?
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-2xl bg-white p-6 mb-6 shadow">
              <label className="font-semibold text-lg block mb-3">
                Write a description for each sessions
              </label>
              <div className="space-y-3">
                {Array.from({
                  length: parseInt(form.watch("sessions") ?? 8),
                }).map((_, i) => (
                  <FormField
                    key={i}
                    control={form.control}
                    name={`sessionDescriptions.${i}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={`Information about session ${i + 1}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 mb-6 shadow">
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-lg">
                  Tool & Resources
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => appendTool({ title: "", url: "" })}
                >
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {toolFields.map((field, i) => (
                  <div key={field.id} className="flex gap-3 items-center">
                    <FormField
                      control={form.control}
                      name={`tools.${i}.title`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder="Title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`tools.${i}.url`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder="URL" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => removeTool(i)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 mb-6 shadow">
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-lg">Prerequisites</label>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => appendPrereq({ title: "", url: "" })}
                >
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {prereqFields.map((field, i) => (
                  <div key={field.id} className="flex gap-3 items-center">
                    <FormField
                      control={form.control}
                      name={`prereqs.${i}.title`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder="Title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`prereqs.${i}.url`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder="URL" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => removePrereq(i)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </Form>
      </div>
      <div className="bg-white h-full flex flex-col p-6 pt-12">
        <h1 className="text-2xl font-bold">Sample project</h1>

        <h2 className="text-xl mt-8">Project title</h2>
        <span className="text-gray-500 mt-2">AI in education</span>

        <h2 className="text-xl mt-[72px]">Project category</h2>
        <span className="text-gray-500 mt-2">AI, Healthcare</span>

        <h2 className="text-xl mt-[72px]">Project description</h2>
        <span className="text-gray-500 mt-2">
          Explore how artificial intelligence is transforming learning
          experiences, personalizing education.
        </span>

        <h2 className="text-xl mt-16">Number of sessions</h2>
        <span className="text-gray-500 mt-2">8 sessions</span>

        <h2 className="text-xl mt-4">Available spots</h2>
        <span className="text-gray-500 mt-2">2 spots</span>
        <h2 className="text-xl mt-4">Start Date</h2>
        <span className="text-gray-500 mt-2">10/06/2025</span>

        <h2 className="text-xl mt-4">Time</h2>
        <span className="text-gray-500 mt-2">10:00 AM</span>
        <h2 className="text-xl mt-16">Session Descriptions</h2>
        <div className="flex flex-col gap-7">
          <span className="text-gray-500 mt-6">
            Introduction to Brain Anatomy & Medical Imaging
          </span>
          <span className="text-gray-500">Python & Jupyter Notebooks</span>
          <span className="text-gray-500">Image Data & Preprocessing</span>
          <span className="text-gray-500">Data Exploration & Labeling</span>
          <span className="text-gray-500">Machine Learning Basics</span>
          <span className="text-gray-500">Building a Simple Classifier</span>
          <span className="text-gray-500">Model Evaluation & Improvement</span>
          <span className="text-gray-500">Final Project & Presentation</span>
        </div>
      </div>
    </div>
  );
}
