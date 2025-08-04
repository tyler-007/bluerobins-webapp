"use client";

import { ArrowLeft, Trash2, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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

// Predefined categories
const PREDEFINED_CATEGORIES = [
  "AI & Data Science",
  "Health",
  "App&Tools", 
  "Design",
  "Finance/Econ",
  "Hardware",
  "Competitions",
  "Sports",
  "Others"
];

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [otherCategory, setOtherCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");

  // Dynamic form schema based on fetched project types and session options
  const createFormSchema = (projectTypes: string[], sessionOptions: string[]) => {
    return z.object({
      title: z.string().min(1, "Project title is required"),
      category: z.string().min(1, "Project category is required")
        .refine((value) => {
          // Allow any non-empty string for categories
          // This allows both predefined categories and custom strings
          return value.trim().length > 0;
        }, "Project category is required"),
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
    resolver: zodResolver(createFormSchema(
      projectTypes.length > 0 ? projectTypes : ["Other"], 
      filteredSessionOptions.length > 0 ? filteredSessionOptions : sessionOptions.length > 0 ? sessionOptions : ["8"]
    )),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      typeOfProject: projectTypes.length > 0 ? projectTypes[0] : "Other",
      sessions: sessionOptions.length > 0 ? sessionOptions[0] : "8",
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
          .order("type_of_project")
          .order("number_of_sessions");

        if (error) {
          console.error("Error fetching pricing data:", error);
          setPricingData([]);
        } else {
          setPricingData(data || []);
        }
      } catch (error) {
        console.error("Error fetching pricing data:", error);
        setPricingData([]);
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
          setProjectTypes([]);
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
          setSessionOptions([]);
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

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    if (selectedCategories.includes(category)) {
      // Remove category if already selected
      const updatedCategories = selectedCategories.filter(c => c !== category);
      setSelectedCategories(updatedCategories);
      
      // Update form field
      const categoryString = updatedCategories.length > 0 
        ? updatedCategories.join(", ") 
        : (otherCategory ? `Others: ${otherCategory}` : "");
      form.setValue("category", categoryString);
    } else if (selectedCategories.length < 3) {
      // Add category if under limit
      const updatedCategories = [...selectedCategories, category];
      setSelectedCategories(updatedCategories);
      
      // Update form field
      const categoryString = updatedCategories.join(", ");
      form.setValue("category", categoryString);
    }
  };

  // Handle other category input
  const handleOtherCategoryChange = (value: string) => {
    setOtherCategory(value);
    
    // Update form field with other categories
    const otherCategories = selectedCategories.filter(c => c !== "Others");
    const categoryString = otherCategories.length > 0 
      ? `${otherCategories.join(", ")}, Others: ${value}`
      : `Others: ${value}`;
    form.setValue("category", categoryString);
  };

  // Remove category
  const removeCategory = (categoryToRemove: string) => {
    const updatedCategories = selectedCategories.filter(c => c !== categoryToRemove);
    setSelectedCategories(updatedCategories);
    
    // Update form field
    const categoryString = updatedCategories.length > 0 
      ? updatedCategories.join(", ") 
      : (otherCategory ? `Others: ${otherCategory}` : "");
    form.setValue("category", categoryString);
  };

  // Handle custom category input
  const handleCustomCategoryAdd = () => {
    if (customCategory.trim() && selectedCategories.length < 3) {
      const newCategory = customCategory.trim();
      const updatedCategories = [...selectedCategories, newCategory];
      setSelectedCategories(updatedCategories);
      setCustomCategory("");
      
      // Update form field
      const categoryString = updatedCategories.join(", ");
      form.setValue("category", categoryString);
    }
  };

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

  // Update day of week when start date changes
  useEffect(() => {
    const startDate = form.watch("startDate");
    if (startDate) {
      const dayOfWeek = dayjs(startDate).format("dddd");
      form.setValue("dayOfWeek", dayOfWeek);
    }
  }, [form.watch("startDate"), form]);

  // Update session descriptions when sessions change
  useEffect(() => {
    const sessions = form.watch("sessions");
    if (sessions) {
      const sessionCount = parseInt(sessions);
      form.setValue("sessionDescriptions", Array(sessionCount).fill(""));
    }
  }, [form.watch("sessions"), form]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Validate required data
      if (!userId) {
        console.error("Error: User ID is required");
        alert("Error: User authentication required. Please sign in again.");
        return;
      }

      if (!values.category || values.category.trim().length === 0) {
        console.error("Error: Category is required");
        alert("Error: Please select at least one category for your project.");
        return;
      }

      if (!values.time || !values.time.includes(':')) {
        console.error("Error: Invalid time format");
        alert("Error: Please select a valid time for your project.");
        return;
      }

      const selling_price = getPricing(values.typeOfProject, values.sessions);
      
      // Convert category string to array format for database
      const categoryArray = values.category
        .split(", ")
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0);

      if (categoryArray.length === 0) {
        console.error("Error: No valid categories found");
        alert("Error: Please select at least one category for your project.");
        return;
      }

      // Convert time string to proper timestamp format
      const timeString = values.time;
      const timeParts = timeString.split(':');
      
      if (timeParts.length !== 2) {
        console.error("Error: Invalid time format");
        alert("Error: Please select a valid time for your project.");
        return;
      }

      const [hours, minutes] = timeParts.map(Number);
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.error("Error: Invalid time values");
        alert("Error: Please select a valid time for your project.");
        return;
      }

      const sessionTime = dayjs().hour(hours).minute(minutes).second(0).millisecond(0).toISOString();

      console.log("Creating project with data:", {
        title: values.title,
        categories: categoryArray,
        type_of_project: values.typeOfProject,
        sessions_count: parseInt(values.sessions),
        spots: values.spots,
        start_date: values.startDate,
        session_day: values.dayOfWeek,
        session_time: sessionTime,
        mentor_user: userId,
      });

      // Prepare insert data with only the columns that exist in the database
      const insertData = {
        title: values.title,
        categories: categoryArray,
        description: values.description,
        type_of_project: values.typeOfProject,
        sessions_count: parseInt(values.sessions),
        spots: values.spots,
        start_date: values.startDate,
        session_day: values.dayOfWeek,
        session_time: sessionTime,
        selling_price: selling_price,
        mentor_user: userId,
      };

      // Add optional columns only if they exist in the database schema
      // These will be added after running the database migration script
      if (values.sessionDescriptions && values.sessionDescriptions.length > 0) {
        (insertData as any).agenda = values.sessionDescriptions.map((description) => ({ description }));
      }
      if (values.tools && values.tools.length > 0) {
        (insertData as any).tools = values.tools;
      }
      if (values.prereqs && values.prereqs.length > 0) {
        (insertData as any).prerequisites = values.prereqs;
      }

      console.log("Attempting to insert project with data:", insertData);

      const { data, error } = await supabase.from("projects").insert(insertData);

      if (error) {
        console.error("Error creating project:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Error creating project: ${error.message}\n\nDetails: ${error.details || 'No additional details'}\nCode: ${error.code || 'No error code'}`);
      } else {
        console.log("Project created successfully:", data);
        router.push("/project-hub");
      }
    } catch (error) {
      console.error("Unexpected error creating project:", error);
      alert("An unexpected error occurred while creating the project. Please try again.");
    }
  };

  // Show loading state while fetching data
  if (isLoadingPricing || isLoadingProjectTypes || isLoadingSessionOptions) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div>Loading...</div>
          <div className="text-sm text-gray-500 mt-2">
            {isLoadingPricing && "Loading pricing data..."}
            {isLoadingProjectTypes && "Loading project types..."}
            {isLoadingSessionOptions && "Loading session options..."}
          </div>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log("Create page state:", {
    projectTypes,
    sessionOptions,
    filteredSessionOptions,
    pricingData: pricingData.length,
    userId,
    formState: form.formState.isValid
  });

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
                    <div className="space-y-3">
                      {/* Category Selection */}
                      <div className="grid grid-cols-3 gap-2">
                        {PREDEFINED_CATEGORIES.length > 0 && PREDEFINED_CATEGORIES.map((category, index) => (
                          <Button
                            key={`${category}-${index}`}
                            type="button"
                            variant={selectedCategories.includes(category) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCategorySelect(category)}
                            disabled={selectedCategories.length >= 3 && !selectedCategories.includes(category)}
                            className="justify-start text-xs"
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                      
                      {/* Selected Categories Display */}
                      {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedCategories.map((category) => (
                            <Badge key={category} variant="secondary" className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200">
                              {category}
                              <button
                                type="button"
                                onClick={() => removeCategory(category)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Other Category Input */}
                      {selectedCategories.includes("Others") && (
                        <div className="mt-2">
                          <Input
                            placeholder="Specify other category..."
                            value={otherCategory}
                            onChange={(e) => handleOtherCategoryChange(e.target.value)}
                            className="max-w-xs"
                          />
                        </div>
                      )}

                      {/* Custom Category Input */}
                      {selectedCategories.length < 3 && (
                        <div className="mt-2 flex gap-2">
                          <Input
                            placeholder="Add custom category..."
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCustomCategoryAdd();
                              }
                            }}
                            className="max-w-xs"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCustomCategoryAdd}
                            disabled={!customCategory.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      )}

                      {/* Hidden input for form validation */}
                      <input type="hidden" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="text-gray-400 text-sm mt-1">
                    Select up to 3 categories that best describe your project. You can choose from predefined categories or add custom ones.
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
                          {projectTypes.length > 0 && projectTypes.map((type, index) => (
                            <SelectItem key={`${type}-${index}`} value={type}>
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
                        {filteredSessionOptions.length > 0 && filteredSessionOptions.map((session, index) => (
                          <FormItem key={`${session}-${index}`} className="flex items-center space-x-3 space-y-0">
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
                      What time will the sessions be held?
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-2xl bg-white p-6 mb-6 shadow">
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-lg">
                  Session Descriptions
                </label>
              </div>
              <div className="space-y-3">
                {form.watch("sessionDescriptions").map((_, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`sessionDescriptions.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder={`Session ${index + 1} description`}
                            {...field}
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
