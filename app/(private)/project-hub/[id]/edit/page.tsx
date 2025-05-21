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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
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
});

type FormValues = z.infer<typeof formSchema>;

export default function EditPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      sessions: 8,
      spots: 1,
      startDate: "",
      dayOfWeek: "",
      time: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log(values);
    // Handle form submission
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="w-full p-8 relative">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">Edit project details</h1>
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" type="button">
              Cancel
            </Button>
            <Button
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
                    <Textarea
                      placeholder="Explore how artificial intelligence is transforming learning experiences, personalizing education."
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
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="font-semibold text-lg">
                      Day of the week
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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

              <div className="flex flex-1 justify-end items-center">
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-5 py-2 ml-2"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete project
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
