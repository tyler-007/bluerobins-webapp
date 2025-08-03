"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { useEffect, useState } from "react";
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

// Type for pricing data from database
type PricingData = {
  type_of_project: string;
  number_of_sessions: number;
  selling_price: number;
};

// Type for project types from database
type ProjectType = {
  type_of_project: string;
};

export default function CreatePage() {
  const supabase = createClient();
  const router = useRouter();
  const { data: user } = useUser();
  const userId = user?.id;
  const [pricingData, setPricingData] = useState<PricingData[]>([]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [sessionOptions, setSessionOptions] = useState<string[]>([]);
  const [filteredSessionOptions, setFilteredSessionOptions] = useState<string[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [isLoadingProjectTypes, setIsLoadingProjectTypes] = useState(true);
  const [isLoadingSessionOptions, setIsLoadingSessionOptions] = useState(true);

  // Dynamic form schema based on fetched project types and session options
  const createFormSchema = (projectTypes: string[], sessionOptions: string[]) => {
    return z.object({
      title: z.string().min(1, "Project title is required"),
      category: z.string().min(1, "Project category is required"),
      description: z.string().min(1, "Project description is required"),
      typeOfProject: z.enum(projectTypes as [string, ...string[]], {
        required_error: "Please select project type",
      }),
      sessions: z.enum(sessionOptions as [string, ...string[]], {
        required_error: "Please select number of sessions",
      }),
      spots: z
        .number()
        .min(1, "Minimum 1 spot required")
        .max(3, "Maximum 3 spots allowed"),
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
          (arr) => sessionOptions.includes(arr.length.toString()),
          `Must have ${sessionOptions.join(" or ")} sessions`
        ),
      tools: z.array(
        z.object({
          title: z.string().min(1, "Required"),
          url: z.string().url("Invalid URL").or(z.literal("")),
        })
      ),
      prereqs: z.array(
        z.object({
          title: z.string().min(1, "Required"),
          url: z.string().url("Invalid URL").or(z.literal("")),
        })
      ),
    });
  };

  type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(projectTypes, filteredSessionOptions.length > 0 ? filteredSessionOptions : sessionOptions)),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      typeOfProject: projectTypes[0] || "Other",
      sessions: sessionOptions[0] || "8",
      spots: 1,
      startDate: "",
      dayOfWeek: "",
      time: "",
      sessionDescriptions: Array(parseInt(sessionOptions[0]) || 8).fill(""),
      tools: [],
      prereqs: [],
    },
  });

  // Fetch pricing data from database
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const { data, error } = await supabase
          .from("pricing_config")
          .select("*")
          .order("number_of_sessions");

        if (error) {
          console.error("Error fetching pricing data:", error);
        } else {
          setPricingData(data || []);
        }
      } catch (error) {
        console.error("Error fetching pricing data:", error);
      } finally {
        setIsLoadingPricing(false);
      }
    };

    fetchPricingData();
  }, [supabase]);

  // Fetch project types from database
  useEffect(() => {
    const fetchProjectTypes = async () => {
      try {
        const { data, error } = await supabase
          .from("pricing_config")
          .select("type_of_project")
          .order("type_of_project");

        if (error) {
          console.error("Error fetching project types:", error);
        } else {
          const types = Array.from(new Set(data?.map(item => item.type_of_project) || []));
          setProjectTypes(types);
          
          // Update form default values if project types are loaded
          if (types.length > 0 && form.getValues("typeOfProject") === "Other") {
            form.setValue("typeOfProject", types[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching project types:", error);
      } finally {
        setIsLoadingProjectTypes(false);
      }
    };

    fetchProjectTypes();
  }, [supabase, form]);

  // Fetch session options from database
  useEffect(() => {
    const fetchSessionOptions = async () => {
      try {
        const { data, error } = await supabase
          .from("pricing_config")
          .select("number_of_sessions")
          .order("number_of_sessions");

        if (error) {
          console.error("Error fetching session options:", error);
        } else {
          const sessions = Array.from(new Set(data?.map(item => item.number_of_sessions.toString()) || []));
          setSessionOptions(sessions);
          
          // Update form default values if session options are loaded
          if (sessions.length > 0 && form.getValues("sessions") === "8") {
            form.setValue("sessions", sessions[0]);
            form.setValue("sessionDescriptions", Array(parseInt(sessions[0])).fill(""));
          }
        }
      } catch (error) {
        console.error("Error fetching session options:", error);
      } finally {
        setIsLoadingSessionOptions(false);
      }
    };

    fetchSessionOptions();
  }, [supabase, form]);

  // Get available sessions for a specific project type
  const getAvailableSessionsForProjectType = (projectType: string): string[] => {
    const availableSessions = pricingData
      .filter(p => p.type_of_project === projectType)
      .map(p => p.number_of_sessions.toString());
    return Array.from(new Set(availableSessions));
  };

  // Get pricing for current selection
  const getPricing = (typeOfProject: string, sessions: string) => {
    const sessionsNum = parseInt(sessions);
    const pricing = pricingData.find(
      (p) => p.type_of_project === typeOfProject && p.number_of_sessions === sessionsNum
    );
    return pricing?.selling_price || 0;
  };

  // Effect to update filtered sessions and price when project type changes
  useEffect(() => {
    const selectedProjectType = form.watch("typeOfProject");
    if (selectedProjectType && pricingData.length > 0) {
      const availableSessions = getAvailableSessionsForProjectType(selectedProjectType);
      setFilteredSessionOptions(availableSessions);
      
      // Auto-select the first available session if current session is not available
      const currentSession = form.watch("sessions");
      if (availableSessions.length > 0 && !availableSessions.includes(currentSession)) {
        form.setValue("sessions", availableSessions[0]);
        const newPrice = getPricing(selectedProjectType, availableSessions[0]);
        setCurrentPrice(newPrice);
      } else if (availableSessions.includes(currentSession)) {
        const newPrice = getPricing(selectedProjectType, currentSession);
        setCurrentPrice(newPrice);
      }
    }
  }, [form.watch("typeOfProject"), pricingData, form]);

  // Effect to update price when sessions change
  useEffect(() => {
    const selectedProjectType = form.watch("typeOfProject");
    const selectedSessions = form.watch("sessions");
    if (selectedProjectType && selectedSessions && pricingData.length > 0) {
      const newPrice = getPricing(selectedProjectType, selectedSessions);
      setCurrentPrice(newPrice);
    }
  }, [form.watch("sessions"), pricingData, form]);

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
  useEffect(() => {
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

  // Update session descriptions when sessions count changes
  useEffect(() => {
    const currentDescriptions = form.watch("sessionDescriptions");
    const newLength = parseInt(form.watch("sessions"));
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
      typeOfProject,
      sessions,
      spots,
      startDate,
      dayOfWeek,
      time,
      sessionDescriptions,
      tools,
      prereqs,
    } = values;

    const selling_price = getPricing(typeOfProject, sessions);

    const { data, error } = await supabase.from("projects").insert({
      title,
      description,
      categories: category.split(","),
      type_of_project: typeOfProject,
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
      prerequisites: prereqs,
      mentor_user: userId,
    });
    console.log("SUBMITTED", data, error);
    router.replace("/project-hub");
  };

  console.log("Errors:", form.formState.errors);

  // Show loading state while fetching data
  if (isLoadingPricing || isLoadingProjectTypes || isLoadingSessionOptions) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

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
                name="typeOfProject"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-semibold text-lg">
                      Project Type
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                    <div className="text-gray-400 text-sm mt-1">
                      Select the type of project you're creating
                    </div>
                  </FormItem>
                )}
              />

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
                        {filteredSessionOptions.map((session) => (
                          <FormItem key={session} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={session} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {session} Sessions
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    <div className="text-gray-400 text-sm mt-1">
                      Choose the number of sessions for your project
                    </div>
                    {currentPrice > 0 && (
                      <div className="text-green-600 font-semibold text-sm mt-2">
                        Price: ${currentPrice.toFixed(2)}
                      </div>
                    )}
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
