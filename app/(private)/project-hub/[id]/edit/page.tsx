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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/utils/supabase/client";
import { useLayoutData } from "../../useLayoutData";
import { defaultValues } from "@/app/(private)/home/types";
import { Badge } from "@/components/ui/badge";
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
  id: number; // Changed to number for int8
  deleted: boolean;
  filled_spots: number;
  start_date: string;
  session_time: string;
  sessions_count: number;
  spots: number;
  title: string;
  type_of_project?: string;
  categories?: string[] | string;
  description?: string;
  session_day?: string;
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

export default function EditPage() {
  const project = useLayoutData() as Project | undefined;
  const router = useRouter();
  
  // Debug logging
  console.log("=== EDIT PAGE DEBUG ===");
  console.log("Project loaded:", project);
  console.log("Project ID:", project?.id, "Type:", typeof project?.id);
  console.log("Project categories:", project?.categories);
  console.log("Project type_of_project:", project?.type_of_project);
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
  const supabase = createClient();

  // Dynamic form schema based on fetched project types and session options
  const createFormSchema = (projectTypes: string[], sessionOptions: string[]) => {
    return z.object({
      id: z.number().min(1, "Project id is required"), // Changed to number for int8
      title: z.string().min(1, "Project title is required"),
      category: z.string().min(1, "Project category is required")
        .refine((value) => {
          // Allow any non-empty string for categories
          // This allows both predefined categories and custom strings
          return value.trim().length > 0;
        }, "Project category is required"),
      description: z.string().min(1, "Project description is required"),
      typeOfProject: z.string().min(1, "Please select project type"),
      sessions: z.string().min(1, "Please select number of sessions"),
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
    });
  };

  type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

  const getValues = (project: any) => {
    const payload = {
      id: Number(project.id), // Convert to number for int8
      title: project.title,
      category: project.categories?.join(", ") || "",
      description: project.description,
      typeOfProject: project.type_of_project,
      sessions: project.sessions_count.toString(),
      spots: project.spots,
      startDate: dayjs(project.start_date).format("YYYY-MM-DD"),
      dayOfWeek: project.session_day,
      time: dayjs(project.session_time).format("HH:mm"),
    };
    return payload;
  };

  const values = project ? getValues(project) : undefined;

  // Parse categories from project data when project changes
  useEffect(() => {
    if (project?.categories) {
      let categories: string[] = [];
      let otherCat = "";
      
      categories = Array.isArray(project.categories) 
        ? project.categories 
        : project.categories.split(", ").map((c: string) => c.trim());
      
      // Extract "Others" category if present
      const otherCategories = categories.filter(c => c.startsWith("Others:"));
      if (otherCategories.length > 0) {
        otherCat = otherCategories[0].replace("Others:", "").trim();
        categories = categories.filter(c => !c.startsWith("Others:"));
        // Add "Others" to the list if we have a custom category
        categories.push("Others");
      }
      
      setSelectedCategories(categories);
      setOtherCategory(otherCat);
    }
  }, [project]);

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(projectTypes, sessionOptions)),
    defaultValues: {
      id: 0,
      title: "",
      category: "",
      description: "",
      typeOfProject: "",
      sessions: "",
      spots: 1,
      startDate: "",
      dayOfWeek: "",
      time: "",
    },
    values,
  });

  // Set form values when project data is available
  useEffect(() => {
    if (project && projectTypes.length > 0 && sessionOptions.length > 0) {
      // Set the form values with the actual project data
      const categoryString = Array.isArray(project.categories) 
        ? project.categories.join(", ") 
        : project.categories || "";
        
             form.reset({
         id: Number(project.id), // Convert to number for int8
         title: project.title,
         category: categoryString,
         description: project.description || "",
         typeOfProject: project.type_of_project || projectTypes[0],
         sessions: project.sessions_count.toString(),
         spots: project.spots,
         startDate: dayjs(project.start_date).format("YYYY-MM-DD"),
         dayOfWeek: project.session_day || "",
         time: dayjs(project.session_time).format("HH:mm"),
       });
    }
  }, [project, projectTypes, sessionOptions, form]);

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

  // Initialize filtered session options when project data is loaded
  useEffect(() => {
    if (project && pricingData.length > 0) {
      const projectType = project.type_of_project || "Other";
      const availableSessions = getAvailableSessionsForProjectType(projectType);
      setFilteredSessionOptions(availableSessions);
    }
  }, [project, pricingData]);

  // Effect to update price when sessions change
  useEffect(() => {
    const selectedProjectType = form.watch("typeOfProject");
    const selectedSessions = form.watch("sessions");
    if (selectedProjectType && selectedSessions && pricingData.length > 0) {
      const newPrice = getPricing(selectedProjectType, selectedSessions);
      setCurrentPrice(newPrice);
    }
  }, [form.watch("sessions"), pricingData, form]);

  // Debug form state
  useEffect(() => {
    console.log("Form state changed:", {
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      isSubmitting: form.formState.isSubmitting,
      values: form.getValues()
    });
  }, [form.formState.isValid, form.formState.errors, form.formState.isSubmitting]);

  // Debug project ID
  useEffect(() => {
    if (project && form.getValues("id")) {
      const currentId = form.getValues("id");
      console.log("Project ID:", currentId, "Type:", typeof currentId);
    }
  }, [project, form]);

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

  const onSubmit = async (values: FormValues) => {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form submitted with values:", values);
    console.log("Form errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    console.log("Project ID type:", typeof values.id, "Value:", values.id);
    
    // Check if project exists
    if (!project) {
      console.error("No project data available");
      alert("Error: No project data available");
      return;
    }
    
    const selling_price = getPricing(values.typeOfProject, values.sessions);
    console.log("Calculated selling price:", selling_price);
    
    // Convert category string to array format for database
    const categoryArray = values.category
      .split(", ")
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);

    // Convert time string to proper timestamp format
    const timeString = values.time;
    const [hours, minutes] = timeString.split(':').map(Number);
    const sessionTime = dayjs().hour(hours).minute(minutes).second(0).millisecond(0).toISOString();

    // Prepare update data - start with basic fields first
    const updateData = {
      title: values.title,
      categories: categoryArray,
      description: values.description,
      type_of_project: values.typeOfProject,
      sessions_count: parseInt(values.sessions),
      spots: values.spots,
      start_date: values.startDate,
      session_day: values.dayOfWeek,
      session_time: sessionTime,
      // selling_price: selling_price, // Comment out temporarily to test
    };
    
    console.log("Update data structure:", Object.keys(updateData));
    
    console.log("Update data being sent:", updateData);
    console.log("Project ID for update:", values.id);
    console.log("Original project ID:", project.id);
    
    // First, verify the project exists
    console.log("Verifying project exists with ID:", values.id, "Type:", typeof values.id);
    const { data: existingProject, error: fetchError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", values.id)
      .single();
    
    if (fetchError) {
      console.error("Error fetching project for verification:", fetchError);
      console.error("Fetch error details:", {
        message: fetchError.message,
        code: fetchError.code,
        details: fetchError.details
      });
      alert(`Error: Project not found (ID: ${values.id})\nError: ${fetchError.message}`);
      return;
    }
    
    console.log("Project exists, proceeding with update...");
    console.log("Existing project data:", existingProject);
    
    console.log("Attempting to update project with data:", updateData);
    console.log("Project ID for update:", values.id, "Type:", typeof values.id);
    
    const { data, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", values.id);

    if (error) {
      console.error("Error updating project:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      // Show error to user
      alert(`Error updating project: ${error.message}\nCode: ${error.code}\nDetails: ${error.details}`);
    } else {
      console.log("Project updated successfully, navigating to edit-details");
      router.push(`/project-hub/${values.id}/edit-details`);
    }
  };

  const onDelete = async () => {
    if (!project) return;

    const { error } = await supabase
      .from("projects")
      .update({ deleted: true })
      .eq("id", project.id);

    if (error) {
      console.error("Error deleting project:", error);
    } else {
      router.push("/project-hub");
    }
  };

  if (!project) {
    redirect("/project-hub");
  }

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
          <h1 className="text-2xl font-bold flex-1">Edit project details</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-end gap-4 pt-4 mb-6">
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
                onClick={() => {
                  console.log("=== NEXT BUTTON CLICKED ===");
                  console.log("Form state:", form.formState);
                  console.log("Form values:", form.getValues());
                  console.log("Form errors:", form.formState.errors);
                  console.log("Form is valid:", form.formState.isValid);
                  
                  // Test manual submission
                  setTimeout(() => {
                    console.log("Testing manual form submission...");
                    form.handleSubmit(onSubmit)();
                  }, 100);
                }}
              >
                Next
              </Button>
            </div>
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
                      <Select
                        onValueChange={(value) => field.onChange(value)}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of sessions" />
                        </SelectTrigger>
                                                                       <SelectContent>
                          {(filteredSessionOptions.length > 0 ? filteredSessionOptions : sessionOptions).length > 0 && 
                            (filteredSessionOptions.length > 0 ? filteredSessionOptions : sessionOptions).map((session, index) => (
                              <SelectItem key={`${session}-${index}`} value={session}>
                                {session} Sessions
                              </SelectItem>
                            ))
                          }
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
      </div>
    </div>
  );
}
