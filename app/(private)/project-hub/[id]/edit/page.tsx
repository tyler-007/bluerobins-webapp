"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { Fragment } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MentorNotesClient } from "../components/MentorNotesClient";
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
import { useLayoutData } from "../../useLayoutData";
import { defaultValues } from "@/app/(private)/home/types";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";

const resourceSchema = z.object({
  title: z.string().min(1, "Required"),
  url: z.string().url("Invalid URL").or(z.literal("")),
});

const formSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
  title: z.string().min(1, "Project title is required"),
  category: z.string().min(1, "Project category is required"),
  description: z.string().min(1, "Project description is required"),
  sessions: z
    .number()
    .min(4, "Minimum 4 sessions required")
    .max(12, "Maximum 12 sessions allowed"),
  spots: z
    .number()
    .min(1, "Minimum 1 spot required")
    .max(10, "Maximum 10 spots allowed"),
  startDate: z.string().min(1, "Start date is required"),
  dayOfWeek: z.string().min(1, "Day of week is required"),
  time: z.string().min(1, "Time is required"),
  sessionDescriptions: z
    .array(z.string())
    .min(1, "At least one session description is required"),
  tools: z.array(resourceSchema),
  prereqs: z.array(resourceSchema),
});

type FormValues = z.infer<typeof formSchema>;

const getValues = (project: any) => {
  const payload = {
    id: project?.id ?? "",
    title: project?.title ?? "",
    category: project?.categories?.join(", ") ?? "",
    description: project?.description ?? "",
    sessions: project?.sessions_count ?? 8,
    spots: project?.spots ?? 1,
    startDate: project?.start_date
      ? dayjs(project.start_date).format("YYYY-MM-DD")
      : "",
    dayOfWeek: project?.session_day ?? "Sunday",
    time: project?.session_time
      ? dayjs(project.session_time, "HH:mm:ss").format("HH:mm")
      : "",
    sessionDescriptions:
      project?.agenda?.map((item: any) => item.description) ?? [],
    tools: project?.tools ?? [],
    prereqs: project?.prerequisites ?? [],
  };
  return payload;
};

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

export default function EditPage() {
  const layoutData = useLayoutData();
  const { user } = useUser();
  const router = useRouter();

  if (!layoutData) {
    return <div>Loading...</div>;
  }

  const { notes, ...project } = layoutData;
  const values = project ? getValues(project) : undefined;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: values || {
      title: "",
      category: "",
      description: "",
      dayOfWeek: "",
      sessions: 8,
      spots: 1,
    },
    values,
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

  const onSubmit = async (values: FormValues) => {
    const pricingInfo =
      SELLING_PRICE_COST_MAP?.[
        `${values.sessions}` as keyof typeof SELLING_PRICE_COST_MAP
      ];

    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .update({
        title: values.title,
        description: values.description,
        categories: values.category.split(","),
        sessions_count: values.sessions,
        spots: values.spots,
        start_date: dayjs(
          `${values.startDate} ${values.time}`,
          "YYYY-MM-DD HH:mm"
        ).toDate(),
        session_time: values.time,
        session_day: values.dayOfWeek,
        selling_price: pricingInfo?.selling_price,
        cost_price: pricingInfo?.cost_price,
        agenda: values.sessionDescriptions.map((desc) => ({ description: desc })),
        tools: values.tools,
        prerequisites: values.prereqs,
      })
      .eq("id", values.id);

    if (error) {
      console.error("Failed to update project:", error);
      alert(`Error updating project: ${error.message}`);
      return;
    }

    router.push(`/project-hub`);
  };

  return (
    <div className="min-h-screen w-full p-8 relative">
      <div className="flex items-center mb-6">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="icon"
          className="mr-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold flex-1">{project.title}</h1>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="details">Project Details</TabsTrigger>
          <TabsTrigger value="notes">Student Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-lg">Project title</FormLabel>
                    <FormControl><Input placeholder="AI in education" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-lg">Project category</FormLabel>
                    <FormControl><Input placeholder="Survey Project" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-lg">Project Description</FormLabel>
                    <FormControl><Textarea rows={3} {...field} /></FormControl>
                    <FormMessage />
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
                        <Input
                          type="number"
                          placeholder="8"
                          min={4}
                          max={12}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                      <div className="text-gray-400 text-sm mt-1">
                        How many sessions will this project require? (4-12)
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
                          placeholder="1"
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

                <div className="flex flex-1 justify-end items-center">
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-5 py-2 ml-2"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete project
                  </Button>
                </div>
              </div>

              {/* Session Descriptions */}
              <div className="rounded-2xl bg-white p-6 mb-6 shadow">
                <label className="font-semibold text-lg block mb-3">
                  Write a description for each sessions
                </label>
                <div className="space-y-3 grid grid-cols-[auto_1fr] gap-4 items-center">
                  {Array.from({ length: form.watch("sessions") ?? 8 }).map(
                    (_, i) => (
                      <Fragment key={i}>
                        <span className="text-lg text-black mt-2">
                          Session {i + 1} :
                        </span>
                        <FormField
                          control={form.control}
                          name={`sessionDescriptions.${i}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={`Session ${i + 1}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </Fragment>
                    )
                  )}
                </div>
              </div>

              {/* Tool & Resources */}
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

              <div className="flex justify-end gap-4 pt-4">
                <Button onClick={() => router.back()} variant="outline" type="button">Cancel</Button>
                <Button loading={form.formState.isSubmitting} type="submit" className="px-8">Save Changes</Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="notes">
          <MentorNotesClient project={project} notes={notes || []} userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
