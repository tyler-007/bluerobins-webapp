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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/utils/supabase/client";
import { useLayoutData } from "../../useLayoutData";
import { defaultValues } from "@/app/(private)/home/types";
import dayjs from "dayjs";
import { redirect, useRouter } from "next/navigation";

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

// Define the type for your project object
type Project = {
  id: number;
  deleted: boolean;
  filled_spots: number;
  start_date: string;
  session_time: string;
  sessions_count: number;
  spots: number;
  title: string;
  type_of_project?: string;
};

export default function EditPage() {
  const project = useLayoutData() as Project | undefined;
  const router = useRouter();
  const [pricingData, setPricingData] = useState<PricingData[]>([]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [sessionOptions, setSessionOptions] = useState<string[]>([]);
  const [filteredSessionOptions, setFilteredSessionOptions] = useState<string[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [isLoadingProjectTypes, setIsLoadingProjectTypes] = useState(true);
  const [isLoadingSessionOptions, setIsLoadingSessionOptions] = useState(true);
  const supabase = createClient();

  // Dynamic form schema based on fetched project types and session options
  const createFormSchema = (projectTypes: string[], sessionOptions: string[]) => {
    return z.object({
      id: z.number().min(1, "Project id is required"),
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
    });
  };

  type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

  const getValues = (project: any) => {
    const payload = {
      id: project.id,
      title: project.title,
      category: project.categories?.join(", ") || "",
      description: project.description,
      typeOfProject: project.type_of_project || "Other",
      sessions: project.sessions_count.toString(),
      spots: project.spots,
      startDate: dayjs(project.start_date).format("YYYY-MM-DD"),
      dayOfWeek: project.session_day,
      time: dayjs(project.session_time).format("HH:mm"),
    };
    return payload;
  };

  const values = project ? getValues(project) : undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(projectTypes, filteredSessionOptions.length > 0 ? filteredSessionOptions : sessionOptions)),
    defaultValues: {
      id: 0,
      title: "",
      category: "",
      description: "",
      typeOfProject: "Other",
      sessions: "8",
      spots: 1,
      startDate: "",
      dayOfWeek: "",
      time: "",
    },
    values,
  });

  // Fetch pricing data from database
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const { data, error } = await supabase
          .from("pricing_config")
          .select("*")
          .order("type_of_project")
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

  const onSubmit = async (values: FormValues) => {
    // Handle form submission
    const selling_price = getPricing(values.typeOfProject, values.sessions);

    const { data, error } = await supabase
      .from("projects")
      .update({
        title: values.title,
        description: values.description,
        categories: values.category.split(","),
        type_of_project: values.typeOfProject,
        sessions_count: values.sessions,
        spots: values.spots,
        start_date: dayjs(
          `${values.startDate} ${values.time}`,
          "YYYY-MM-DD HH:mm"
        ).toDate(),
        session_time: dayjs(
          `${values.startDate} ${values.time}`,
          "YYYY-MM-DD HH:mm"
        ).toDate(),
        session_day: values.dayOfWeek,
        selling_price: selling_price,
      })
      .eq("id", values.id);

    redirect(`/project-hub/${values.id}/edit-details`);
  };

  const onDelete = async () => {
    if (!project?.id) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .update({
        deleted: true,
      })
      .eq("id", project?.id);
    if (error) {
      console.error("Error deleting project:", error);
    } else {
      console.log("Project deleted successfully");
    }
    redirect(`/project-hub/`);
  };

  // Show loading state while fetching data
  if (isLoadingPricing || isLoadingProjectTypes || isLoadingSessionOptions) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (project?.deleted) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-2">
        <div>This project has been deleted</div>
        <Button
          onClick={() => router.replace("/project-hub")}
          variant="outline"
          className="border-blue-300 text-blue-600 px-5 py-2 ml-2"
        >
          Go to Project Hub
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-[1fr] items-center">
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
          <h1 className="text-2xl font-bold flex-1">Edit project details</h1>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              type="button"
            >
              Cancel
            </Button>
            <Button
              loading={form.formState.isSubmitting}
              type="submit"
              className="px-8"
              onClick={form.handleSubmit(onSubmit)}
            >
              Next
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
                    <Input placeholder="AI in education" {...field} />
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
                    <Input placeholder="Survey Project" {...field} />
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
                    <Textarea rows={3} {...field} />
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
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <div className="text-gray-400 text-sm mt-1">
                      What type of project is this?
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
                      <Select
                        onValueChange={(value) => field.onChange(value)}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of sessions" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredSessionOptions.map((session) => (
                            <SelectItem key={session} value={session}>
                              {session} Sessions
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                    <div className="text-gray-400 text-sm mt-1">
                      How many sessions will this project require?
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
                        placeholder="1"
                        min={1}
                        max={10}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-gray-400 text-sm mt-1">
                      How many students can join this project? (1-10)
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
                      <Input type="date" {...field} />
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
                render={({ field }) => {
                  return (
                    <FormItem className="flex-1">
                      <FormLabel className="font-semibold text-lg">
                        Day of the week
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          if (!value) return;
                          field.onChange(value);
                        }}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <div className="text-gray-400 text-sm mt-1">
                        Which day will sessions take place?
                      </div>
                    </FormItem>
                  );
                }}
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

              {!(project?.filled_spots || 0) && (
                <div className="flex flex-1 justify-end items-center">
                  <Button
                    onClick={onDelete}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-5 py-2 ml-2"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete project
                  </Button>
                </div>
              )}
            </div>
          </form>
        </Form>
      </div>
      {/* <div className="bg-white h-full "></div> */}
    </div>
  );
}
