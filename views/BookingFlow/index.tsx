"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import Chip from "./components/Chip";
import ScheduleCalendar from "@/app/components/ScheduleCalendar";
//10:00 + slot duration
// filter out new slot if start time of booked slot  is between start time  and end time of new slot
// filter out new slot if end time of booked slot  is between start time  and end time of new slot

export const BookingFlow = ({ mentor }: { mentor: any }) => {
  const [slots, setSlots] = useState([]);
  // Get slot config
  // Get booked slots
  // map slots to calendar
  // get mentor details (name, image, bio, pricing)
  // get pricing (student to mentor pair?)
  //   console.log(response);

  const fetchSlots = async () => {
    const response = await fetch(
      `/api/get_slots?from=${new Date().toISOString()}&to=${new Date(
        new Date().setDate(new Date().getDate() + 7)
      ).toISOString()}`
    );
    const data = await response.json();
    console.log(data);
    setSlots(data);
  };

  const onOpenChange = (open: boolean) => {
    if (open) {
      fetchSlots();
    }
  };

  // generate next 7 days in the format { date: 25, day: "Sun", slots: 15, isToday: true },
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      date: date.getDate(),
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      isToday: date.toDateString() === new Date().toDateString(),
    };
  });

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger>
        <Button className="w-full">Book a session</Button>
      </DialogTrigger>
      <DialogContent className="flex w-3/4 max-w-screen">
        <div className="grid gap-3 w-1/4 z-10">
          <DialogTitle>Select duration</DialogTitle>
          <Chip leftText="15 mins">
            <span className="text-xs my-1 text-white bg-green-500 self-center px-3 py-1">
              FREE TRIAL
            </span>
          </Chip>
          <Chip leftText="30 mins" rightText="$100" />
          <Chip leftText="45 mins" rightText="$150" />
          <Chip leftText="1 hour" rightText="$200" />
          <Chip leftText="1 hour 15 mins" rightText="$250" />
          <Chip leftText="1 hour 30 mins" rightText="$300" />

          {/* <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription> */}
        </div>
        <div className=" w-[1px] bg-input"></div>

        <div className="flex-1 flex flex-col">
          <DialogTitle>Select Slot</DialogTitle>
          {slots && <ScheduleCalendar days={days} slots={slots} />}
        </div>
      </DialogContent>
    </Dialog>
  );
};
