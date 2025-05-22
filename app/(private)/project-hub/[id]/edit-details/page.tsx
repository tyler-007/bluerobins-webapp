"use client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useLayoutData } from "../../useLayoutData";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
const sessionCount = 8;

const resourceSchema = z.object({
  title: z.string().min(1, "Required"),
  url: z.string().url("Invalid URL").or(z.literal("")),
});
const prereqSchema = z.object({
  title: z.string().min(1, "Required"),
  url: z.string().url("Invalid URL").or(z.literal("")),
});

const formSchema = z.object({
  id: z.number().min(1, "Project id is required"),
  sessionDescriptions: z
    .array(z.string())
    .length(sessionCount, `Must have ${sessionCount} sessions`),
  tools: z.array(resourceSchema),
  prereqs: z.array(prereqSchema),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  id: 0,
  sessionDescriptions: Array(sessionCount).fill(""),
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
};

const getValues = (project: any) => {
  return {
    id: project.id,
    sessionDescriptions: project?.agenda?.map(
      (agenda: any) => agenda.description
    ),
    tools: project?.tools,
    prereqs: project?.prerequisites,
  };
};

export default function EditPage() {
  const project = useLayoutData();
  const values = project ? getValues(project) : undefined;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    values,
    mode: "onChange",
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
    // handle form submission
    console.log("Values", values);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .update({
        agenda: values.sessionDescriptions,
        tools: values.tools,
        prerequisites: values.prereqs,
      })
      .eq("id", values.id);
    redirect(`/project-hub`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-3xl p-8 relative">
        <Form {...form}>
          <div className="flex items-center mb-6">
            <Button
              onClick={() => redirect(`/project-hub`)}
              variant="ghost"
              size="icon"
              className="mr-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold flex-1">Edit Session details</h1>
            <div className="flex gap-4">
              <Button
                onClick={() => redirect(`/project-hub`)}
                variant="outline"
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" className="px-8">
                Save
              </Button>
            </div>
          </div>
          <form
            className="space-y-8"
            onSubmit={form.handleSubmit(onSubmit)}
            autoComplete="off"
          >
            {/* Session Descriptions */}
            <div className="rounded-2xl bg-white p-6 mb-6 shadow">
              <label className="font-semibold text-lg block mb-3">
                Write a description for each sessions
              </label>
              <div className="space-y-3">
                {Array.from({ length: sessionCount }).map((_, i) => (
                  <FormField
                    key={i}
                    control={form.control}
                    name={`sessionDescriptions.${i}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder={`Session ${i + 1}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
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

            {/* Move the buttons inside the form */}
          </form>
        </Form>
      </div>
    </div>
  );
}
