"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";

// Types
type PricingData = {
  type_of_project: string;
  number_of_sessions: number;
  selling_price: number;
};

type ProjectData = {
  title: string;
  description: string;
  category: string;
  typeOfProject: string;
  sessions: string;
  spots: number;
  startDate: string;
  dayOfWeek: string;
  time: string;
  sessionDescriptions: string[];
  tools: { title: string; url: string }[];
  prereqs: { title: string; url: string }[];
  duplicated_from_project_id?: number;
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
  "Others",
];

export default function CreatePage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user } = useUser();
  
  // Mode detection
  const isDuplicating = searchParams.get('duplicate');
  const isEditing = searchParams.get('edit');
  const projectId = searchParams.get('id');
  
  // State
  const [pricingData, setPricingData] = useState<PricingData[]>([]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [sessionOptions, setSessionOptions] = useState<string[]>([]);
  const [filteredSessionOptions, setFilteredSessionOptions] = useState<string[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [otherCategory, setOtherCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [existingProject, setExistingProject] = useState<ProjectData | null>(null);

  // Get initial data from URL params (for duplicate/edit)
  const getInitialData = useMemo(() => {
    if (!isDuplicating && !isEditing) return null;
    
    try {
      const agenda = JSON.parse(searchParams.get('agenda') || '[]');
      const tools = JSON.parse(searchParams.get('tools') || '[]');
      const prerequisites = JSON.parse(searchParams.get('prerequisites') || '[]');
      
      return {
        title: searchParams.get('title') || '',
        description: searchParams.get('description') || '',
        category: searchParams.get('categories') || '',
        typeOfProject: searchParams.get('typeOfProject') || '',
        sessions: searchParams.get('sessions') || '',
        spots: parseInt(searchParams.get('spots') || '1'),
        startDate: searchParams.get('startDate') || '',
        dayOfWeek: searchParams.get('dayOfWeek') || '',
        time: searchParams.get('time') || '',
        sessionDescriptions: agenda.map((item: any) => item.description || ''),
        tools: tools,
        prereqs: prerequisites,
        duplicated_from_project_id: isDuplicating ? parseInt(searchParams.get('duplicate') || '0') : undefined,
      };
    } catch (error) {
      console.error('Error parsing initial data:', error);
      return null;
    }
  }, [isDuplicating, isEditing, searchParams]);

  // Form schema
  const formSchema = useMemo(() => {
    return z.object({
      title: z.string().min(1, "Project title is required"),
      category: z.string().min(1, "Project category is required"),
      description: z.string().min(1, "Project description is required"),
      typeOfProject: z.string().min(1, "Project type is required"),
      sessions: z.string().min(1, "Number of sessions is required"),
      spots: z.number().min(1, "Minimum 1 spot required").max(3, "Maximum 3 spots allowed"),
      startDate: z.string().min(1, "Start date is required"),
      dayOfWeek: z.string().min(1, "Day of week is required"),
      time: z.string().min(1, "Time is required"),
      sessionDescriptions: z.array(z.string().min(8, "Session description is required")),
      tools: z.array(z.object({
        title: z.string().min(1, "Required"),
        url: z.string().url("Invalid URL").or(z.literal("")),
      })),
      prereqs: z.array(z.object({
        title: z.string().min(1, "Required"),
        url: z.string().url("Invalid URL").or(z.literal("")),
      })),
      duplicated_from_project_id: z.number().optional(),
    });
  }, []);

  type FormValues = z.infer<typeof formSchema>;

  // Default values
  const defaultValues = useMemo(() => {
    const baseDefaults = {
      title: "",
      category: "",
      description: "",
      typeOfProject: "",
      sessions: "",
      spots: 1,
      startDate: "",
      dayOfWeek: "",
      time: "",
      sessionDescriptions: [""],
      tools: [],
      prereqs: [],
          duplicated_from_project_id: undefined,
    };

    // Use initial data if available
    if (getInitialData) {
      return {
        ...baseDefaults,
        ...getInitialData,
        startDate: getInitialData.startDate
        ? String(dayjs(getInitialData.startDate).format("YYYY-MM-DD")) : "",
        sessionDescriptions: getInitialData.sessionDescriptions.length > 0 
          ? getInitialData.sessionDescriptions 
          : [""],
      };
    }

    return baseDefaults;
  }, [getInitialData]);

  // Form initialization
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange", // Enable real-time validation
  });

  // Field arrays
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

  // Fetch pricing data
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
          
          // Extract project types and session options
          const types = Array.from(new Set(data?.map(item => item.type_of_project) || []));
          const sessions = Array.from(new Set(data?.map(item => item.number_of_sessions.toString()) || []));
          
          setProjectTypes(types);
          setSessionOptions(sessions);
        }
      } catch (error) {
        console.error("Error fetching pricing data:", error);
        setPricingData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricingData();
  }, [supabase]);

  // Set initial form values after form is created and data is loaded
  useEffect(() => {
    if (!isLoading && projectTypes.length > 0 && sessionOptions.length > 0 && !getInitialData) {
      // Only set initial form values if we don't have initial data and form is empty
      if (!form.getValues("typeOfProject")) {
        const firstType = projectTypes[0];
        if (firstType) {
          form.setValue("typeOfProject", firstType, { shouldValidate: false });
        }
      }
      if (!form.getValues("sessions")) {
        const firstSession = sessionOptions[0];
        if (firstSession) {
          form.setValue("sessions", firstSession, { shouldValidate: false });
          form.setValue("sessionDescriptions", Array(parseInt(firstSession)).fill(""), { shouldValidate: false });
        }
      }
    }
  }, [isLoading, projectTypes, sessionOptions, getInitialData, form]);

  // Apply initial data to form when it changes
  useEffect(() => {
    if (getInitialData && !isLoading) {
      console.log('🎯 Applying initial data to form:', getInitialData);
      
      // Set form values efficiently without validation
      Object.entries(getInitialData).forEach(([key, value]) => {
        console.log(`Setting ${key}:`, value);
        
        if (key === 'sessionDescriptions') {
          form.setValue('sessionDescriptions', value as string[], { shouldValidate: false });
        } else if (key === 'tools') {
          form.setValue('tools', value as { title: string; url: string }[], { shouldValidate: false });
        } else if (key === 'prereqs') {
          form.setValue('prereqs', value as { title: string; url: string }[], { shouldValidate: false });
        } else {
          form.setValue(key as any, value, { shouldValidate: false });
        }
      });
      
      // Debug: Check what was actually set
      setTimeout(() => {
        console.log('✅ Form values after setting:', form.getValues());
        console.log('📅 StartDate specifically:', form.getValues('startDate'));
      }, 100);

      // Update selected categories
      if (getInitialData.category) {
        const categories = getInitialData.category.split(',').map(c => c.trim());
        setSelectedCategories(categories);
      }

      // Handle field arrays separately for better control
      if (getInitialData.tools && getInitialData.tools.length > 0) {
        // Clear existing tools
        form.setValue('tools', getInitialData.tools, { shouldValidate: false });
      }

      if (getInitialData.prereqs && getInitialData.prereqs.length > 0) {
        // Clear existing prereqs
        form.setValue('prereqs', getInitialData.prereqs, { shouldValidate: false });
      }
    }
  }, [getInitialData, isLoading, form]);

  // Fetch existing project data for editing
  useEffect(() => {
    if (isEditing && projectId) {
      const fetchExistingProject = async () => {
        try {
          const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single();

          if (error) {
            console.error("Error fetching project:", error);
          } else if (data) {
            const projectData = {
              title: data.title || "",
              description: data.description || "",
              category: Array.isArray(data.categories) ? data.categories.join(", ") : "",
              typeOfProject: data.type_of_project || "",
              sessions: data.sessions_count?.toString() || "",
              spots: data.spots || 1,
              startDate: data.session_time ? dayjs(data.session_time).format("YYYY-MM-DD") : "",
              dayOfWeek: data.session_day || "",
              time: data.session_time ? dayjs(data.session_time).format("HH:mm") : "",
              sessionDescriptions: Array.isArray(data.agenda) ? data.agenda.map((item: any) => item.description || "") : [""],
              tools: Array.isArray(data.tools) ? data.tools : [],
              prereqs: Array.isArray(data.prerequisites) ? data.prerequisites : [],
            };
            
            setExistingProject(projectData);
            
            // Set form values
            Object.entries(projectData).forEach(([key, value]) => {
              if (key === 'sessionDescriptions') {
                form.setValue('sessionDescriptions', value as string[], { shouldValidate: false });
              } else if (key === 'tools') {
                form.setValue('tools', value as { title: string; url: string }[], { shouldValidate: false });
              } else if (key === 'prereqs') {
                form.setValue('prereqs', value as { title: string; url: string }[], { shouldValidate: false });
              } else {
                form.setValue(key as any, value, { shouldValidate: false });
              }
            });

            // Set categories
            if (projectData.category) {
              const categories = projectData.category.split(',').map((c: string) => c.trim());
              setSelectedCategories(categories);
            }
          }
        } catch (error) {
          console.error("Error fetching existing project:", error);
        }
      };

      fetchExistingProject();
    }
  }, [isEditing, projectId, supabase, form]);

  // Update filtered sessions when project type changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "typeOfProject" && value.typeOfProject && pricingData.length > 0) {
        const availableSessions = pricingData
          .filter(p => p.type_of_project === value.typeOfProject)
          .map(p => p.number_of_sessions.toString());
        
        setFilteredSessionOptions(availableSessions);
        
        // Update price based on current sessions
        if (value.sessions && value.typeOfProject) {
          const price = pricingData.find(
            p => p.type_of_project === value.typeOfProject && 
                 p.number_of_sessions === parseInt(value.sessions!)
          );
          setCurrentPrice(price?.selling_price || 0);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, pricingData]);

  // CRITICAL FIX: Ensure filtered sessions are set when form is initially populated
  useEffect(() => {
    if (!isLoading && pricingData.length > 0 && form) {
      const currentType = form.getValues("typeOfProject");
      if (currentType && typeof currentType === 'string') {
        const availableSessions = pricingData
          .filter(p => p.type_of_project === currentType)
          .map(p => p.number_of_sessions.toString());
        
        setFilteredSessionOptions(availableSessions);
      }
    }
  }, [isLoading, pricingData, form]);

  // Update price when sessions change
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "sessions" && value.typeOfProject && value.sessions && pricingData.length > 0) {
        const price = pricingData.find(
          p => p.type_of_project === value.typeOfProject && 
               p.number_of_sessions === parseInt(value.sessions!)
        );
        setCurrentPrice(price?.selling_price || 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, pricingData]);

  // Update day of week when start date changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "startDate" && value.startDate) {
        const dayOfWeek = dayjs(value.startDate).format("dddd");
        form.setValue("dayOfWeek", dayOfWeek, { shouldValidate: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Update session descriptions when sessions change
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "sessions" && value.sessions) {
        const sessionCount = parseInt(value.sessions!);
        const currentDescriptions = form.getValues("sessionDescriptions") || [];
        
        // Preserve existing descriptions and add empty ones for new sessions
        const newDescriptions = Array(sessionCount).fill("").map((_, index) => 
          currentDescriptions[index] || ""
        );
        
        form.setValue("sessionDescriptions", newDescriptions, { shouldValidate: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Category management
  const handleCategorySelect = useCallback((category: string) => {
    if (selectedCategories.includes(category)) {
      const updatedCategories = selectedCategories.filter(c => c !== category);
      setSelectedCategories(updatedCategories);
      
      const categoryString = updatedCategories.length > 0
        ? updatedCategories.join(", ")
        : otherCategory ? `Others: ${otherCategory}` : "";
      form.setValue("category", categoryString);
    } else if (selectedCategories.length < 3) {
      const updatedCategories = [...selectedCategories, category];
      setSelectedCategories(updatedCategories);
      
      const categoryString = updatedCategories.join(", ");
      form.setValue("category", categoryString);
    }
  }, [selectedCategories, otherCategory, form]);

  const handleOtherCategoryChange = useCallback((value: string) => {
    setOtherCategory(value);
    
    const otherCategories = selectedCategories.filter(c => c !== "Others");
    const categoryString = otherCategories.length > 0
      ? `${otherCategories.join(", ")}, Others: ${value}`
      : `Others: ${value}`;
    form.setValue("category", categoryString);
  }, [selectedCategories, form]);

  const removeCategory = useCallback((categoryToRemove: string) => {
    const updatedCategories = selectedCategories.filter(c => c !== categoryToRemove);
    setSelectedCategories(updatedCategories);
    
    const categoryString = updatedCategories.length > 0
      ? updatedCategories.join(", ")
      : otherCategory ? `Others: ${otherCategory}` : "";
    form.setValue("category", categoryString);
  }, [selectedCategories, otherCategory, form]);

  const handleCustomCategoryAdd = useCallback(() => {
    if (customCategory.trim() && selectedCategories.length < 3) {
      const newCategory = customCategory.trim();
      const updatedCategories = [...selectedCategories, newCategory];
      setSelectedCategories(updatedCategories);
      setCustomCategory("");
      
      const categoryString = updatedCategories.join(", ");
      form.setValue("category", categoryString);
    }
  }, [customCategory, selectedCategories, form]);

  // Form submission
  const onSubmit = useCallback(async (values: FormValues) => {
    try {
      if (!user?.id) {
        alert("Error: User authentication required. Please sign in again.");
        return;
      }

      if (!values.category || values.category.trim().length === 0) {
        alert("Error: Please select at least one category for your project.");
        return;
      }

      if (!values.time || !values.time.includes(":")) {
        alert("Error: Please select a valid time for your project.");
        return;
      }

      const selling_price = pricingData.find(
        p => p.type_of_project === values.typeOfProject && 
             p.number_of_sessions === parseInt(values.sessions)
      )?.selling_price || 0;

      const categoryArray = values.category
        .split(", ")
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0);

      if (categoryArray.length === 0) {
        alert("Error: Please select at least one category for your project.");
        return;
      }

      const timeString = values.time;
      const timeParts = timeString.split(":");
      const [hours, minutes] = timeParts.map(Number);

      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        alert("Error: Please select a valid time for your project.");
        return;
      }

      const sessionTime = dayjs(values.startDate)
        .hour(hours)
        .minute(minutes)
        .second(0)
        .millisecond(0)
        .toISOString();

      const projectData = {
        title: values.title,
        categories: categoryArray,
        description: values.description,
        type_of_project: values.typeOfProject,
        sessions_count: parseInt(values.sessions),
        spots: values.spots,
        start_date: sessionTime,
        session_day: values.dayOfWeek,
        session_time: sessionTime,
        selling_price: selling_price,
        mentor_user: user.id,
        agenda: values.sessionDescriptions.map(description => ({ description })),
        tools: values.tools,
        prerequisites: values.prereqs,
                        duplicated_from_project_id: isDuplicating && searchParams.get('duplicate') ? 
                  parseInt(searchParams.get('duplicate')!) : undefined,
      };

      let result;
      if (isEditing && projectId) {
        // Update existing project
        result = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", projectId);
      } else {
        // Create new project
        result = await supabase
          .from("projects")
          .insert(projectData);
      }

      if (result.error) {
        console.error("Error saving project:", result.error);
        alert(`Error saving project: ${result.error.message}`);
      } else {
        console.log("Project saved successfully:", result.data);
        router.push("/project-hub");
      }
    } catch (error) {
      console.error("Unexpected error saving project:", error);
      alert("An unexpected error occurred while saving the project. Please try again.");
    }
  }, [user?.id, pricingData, isEditing, projectId, supabase, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div>Loading...</div>
          <div className="text-sm text-gray-500 mt-2">Loading project data...</div>
        </div>
      </div>
    );
  }

  // Helper functions for dynamic UI
  const getPageTitle = () => {
    if (isEditing) return "Edit Project";
    if (isDuplicating) return "Duplicate Project";
    return "Create New Project";
  };

  const getSubmitButtonText = () => {
    if (form.formState.isSubmitting) {
      if (isEditing) return "Updating...";
      if (isDuplicating) return "Creating Duplicate...";
      return "Creating...";
    }
    
    if (isEditing) return "Update Project";
    if (isDuplicating) return "Create Duplicate";
    return "Create Project";
  };

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
                      <h1 className="text-2xl font-bold flex-1">{getPageTitle()}</h1>
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
                              {getSubmitButtonText()}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-6">
            {/* Project Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-lg">Project title</FormLabel>
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

            {/* Project Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-lg">Project category</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {PREDEFINED_CATEGORIES.map((category, index) => (
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

                      {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedCategories.map((category) => (
                            <Badge
                              key={category}
                              variant="secondary"
                              className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              {category}
                              <button
                                type="button"
                                onClick={() => removeCategory(category)}
                                className="ml-1 hover:text-red-500"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

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

                      {selectedCategories.length < 3 && (
                        <div className="mt-2 flex gap-2">
                          <Input
                            placeholder="Add custom category..."
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
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

                      <input type="hidden" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="text-gray-400 text-sm mt-1">
                    Select up to 3 categories that best describe your project.
                  </div>
                </FormItem>
              )}
            />

            {/* Project Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-lg">Project Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="eg. Explore how artificial intelligence is transforming learning experiences, personalizing education."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-gray-400 text-sm mt-1">
                    Enter a quick summary to attract students and help them understand the project's focus.
                  </div>
                </FormItem>
              )}
            />

            {/* Project Type, Sessions, and Spots */}
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="typeOfProject"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-semibold text-lg">Project Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectTypes.map((type, index) => (
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
                    <FormLabel className="font-semibold text-lg">Number of Sessions</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                        {(filteredSessionOptions.length > 0 ? filteredSessionOptions : sessionOptions).map((session, index) => (
                          <FormItem key={`${session}-${index}`} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={session} />
                            </FormControl>
                            <FormLabel className="font-normal">{session} Sessions</FormLabel>
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
                    <FormLabel className="font-semibold text-lg">Available spots</FormLabel>
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

            {/* Start Date and Day of Week */}
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-semibold text-lg">Start date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? dayjs(field.value).format("YYYY-MM-DD") : ""}
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
                    <FormLabel className="font-semibold text-lg">Day of the week</FormLabel>
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

            {/* Time */}
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-semibold text-lg">Time</FormLabel>
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

            {/* Session Descriptions */}
            <div className="rounded-2xl bg-white p-6 mb-6 shadow">
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-lg">Session Descriptions</label>
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

            {/* Tools & Resources */}
            <div className="rounded-2xl bg-white p-6 mb-6 shadow">
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-lg">Tool & Resources</label>
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

            {/* Prerequisites */}
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

      {/* Sample Project Sidebar */}
      <div className="bg-white h-full flex flex-col p-6 pt-12">
        <h1 className="text-2xl font-bold">Sample project</h1>

        <h2 className="text-xl mt-8">Project title</h2>
        <span className="text-gray-500 mt-2">AI in education</span>

        <h2 className="text-xl mt-[72px]">Project category</h2>
        <span className="text-gray-500 mt-2">AI, Healthcare</span>

        <h2 className="text-xl mt-[72px]">Project description</h2>
        <span className="text-gray-500 mt-2">
          Explore how artificial intelligence is transforming learning experiences, personalizing education.
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