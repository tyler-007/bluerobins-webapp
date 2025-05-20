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

export default function EditPage() {
  return (
    <div className="min-h-screen flex flex-col items-center ">
      <div className="w-full  p-8 relative">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">Edit project details</h1>
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" type="button">
              Cancel
            </Button>
            <Button type="submit" className="px-8">
              Next
            </Button>
          </div>
        </div>
        <form className="space-y-6">
          <div>
            <label className="font-semibold text-lg">Project title</label>
            <Input className="mt-1" placeholder="AI in education" />
            <div className="text-gray-400 text-sm mt-1">
              Enter a short, clear title of the research/passion project
            </div>
          </div>
          <div>
            <label className="font-semibold text-lg">Project category</label>
            <Input className="mt-1" placeholder="Survey Project" />
            <div className="text-gray-400 text-sm mt-1">
              Enter the broad topic or interdisciplinary area the project
              belongs to
            </div>
          </div>
          <div>
            <label className="font-semibold text-lg">Project Description</label>
            <Textarea
              className="mt-1"
              placeholder="Explore how artificial intelligence is transforming learning experiences, personalizing education."
              rows={3}
            />
            <div className="text-gray-400 text-sm mt-1">
              Enter a quick summary to attract students and help them understand
              the project's focus.
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-semibold text-lg">
                Number of Sessions
              </label>
              <Input
                className="mt-1"
                type="number"
                placeholder="8"
                min={4}
                max={12}
              />
              <div className="text-gray-400 text-sm mt-1">
                How many sessions will this project require? (4-12)
              </div>
            </div>
            <div className="flex-1">
              <label className="font-semibold text-lg">Available spots</label>
              <Input
                className="mt-1"
                type="number"
                placeholder="1"
                min={1}
                max={10}
              />
              <div className="text-gray-400 text-sm mt-1">
                How many students can join this project? (1-10)
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-semibold text-lg">Start date</label>
              <Input className="mt-1" type="date" />
              <div className="text-gray-400 text-sm mt-1">
                When will the project begin?
              </div>
            </div>
            <div className="flex-1">
              <label className="font-semibold text-lg">Day of the week</label>
              <Select>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
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
              <div className="text-gray-400 text-sm mt-1">
                Which day will sessions take place?
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-semibold text-lg">Time</label>
              <Input className="mt-1" type="time" />
              <div className="text-gray-400 text-sm mt-1">
                What time will the session start?
              </div>
            </div>
            <div className="flex-1 justify-end items-center">
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-5 py-2 ml-2"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete project
              </Button>
            </div>
          </div>

          {/* <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" type="button">
              Cancel
            </Button>
            <Button type="submit" className="px-8">
              Next
            </Button>
          </div> */}
        </form>
      </div>
    </div>
  );
}
