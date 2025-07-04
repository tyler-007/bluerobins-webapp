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
import React, { Fragment } from "react";
import { useLayoutData } from "../../useLayoutData";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  sessions_count: number;
  agenda: Array<{ description: string }>;
  tools: Array<{ title: string; url: string }>;
  prerequisites: Array<{ title: string; url: string }>;
}

const resourceSchema = z.object({
  title: z.string().min(1, "Required"),
  url: z.string().url("Invalid URL").or(z.literal("")),
});
const prereqSchema = z.object({
  title: z.string().min(1, "Required"),
  url: z.string().url("Invalid URL").or(z.literal("")),
});

const formSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
  sessionDescriptions: z
    .array(z.string())
    .min(1, "At least one session description is required"),
  tools: z.array(resourceSchema),
  prereqs: z.array(prereqSchema),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  id: "",
  sessionDescriptions: Array(12).fill(""),
  tools: [
    { title: "", url: "" },
    { title: "", url: "" },
    { title: "", url: "" },
  ],
  prereqs: [
    { title: "", url: "" },
    { title: "", url: "" },
    { title: "", url: "" },
  ],
};

const getValues = (project: any) => {
  return {
    id: project?.id ?? "",
    sessionDescriptions:
      project?.agenda?.map((agenda: any) => agenda.description) ?? [],
    tools: project?.tools ?? [],
    prereqs: project?.prerequisites ?? [],
  };
};

export default function EditPage() {
  const project = useLayoutData() as Project | null;
  const router = useRouter();
  const values = project ? getValues(project) : undefined;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    values,
    mode: "onChange",
  });

  console.log("PROJECT:", project);

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

  const onInvalid = (errors: any) => {
    console.error("Form validation failed:", errors);
    alert("Form has errors. Please check the console for details.");
  };

  const onSubmit = async (values: FormValues) => {
    // handle form submission
    console.log("Submitting values:", values);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .update({
        agenda: values.sessionDescriptions.map((desc) => ({ description: desc })),
        tools: values.tools,
        prerequisites: values.prereqs,
      })
      .eq("id", values.id);

    if (error) {
      console.error("Failed to update project details:", error);
      alert(`Error updating project: ${error.message}`);
      return;
    }

    router.push(`/project-hub`);
  };

  return (
    <div className="min-h-screen grid grid-cols-[1fr] w-full items-center">
      <div className="w-full p-8 relative">
        <Form {...form}>
          <div className="flex items-center mb-6">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="icon"
              className="mr-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold flex-1">Edit Session details</h1>
          </div>
          <form
            className="space-y-8"
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            autoComplete="off"
          >
            <div className="flex justify-end gap-4">
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
              >
                Save
              </Button>
            </div>
            {/* Session Descriptions */}
            <div className="rounded-2xl bg-white p-6 mb-6 shadow">
              <label className="font-semibold text-lg block mb-3">
                Write a description for each sessions
              </label>
              <div className="space-y-3 grid grid-cols-[auto_1fr] gap-4 items-center">
                {Array.from({ length: project?.sessions_count ?? 12 }).map(
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
          </form>
        </Form>
      </div>
      {/* <div className="bg-white h-full "></div> */}
    </div>
  );
}
