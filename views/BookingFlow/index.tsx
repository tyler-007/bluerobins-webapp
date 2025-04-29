"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCallback, useState, useEffect, useRef } from "react";
import Chip from "./components/Chip";
import ScheduleCalendar from "@/app/components/ScheduleCalendar";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";
//10:00 + slot duration
// filter out new slot if start time of booked slot  is between start time  and end time of new slot
// filter out new slot if end time of booked slot  is between start time  and end time of new slot

const fetchSlotsAPI = async ({
  forUser,
  interval,
  from,
  to,
}: {
  forUser: string;
  interval: number;
  from: string;
  to: string;
  enabled?: boolean;
}) => {
  const res = await fetch(
    `/api/get_slots?from=${from}&to=${to}&interval=${interval}&mentor=${forUser}`
  );

  return res.json();
};

const intervals = [
  {
    canBeFree: true,
    length: 15,
  },
  {
    canBeFree: false,
    length: 30,
  },
  {
    canBeFree: false,
    length: 45,
  },
  {
    canBeFree: false,
    length: 60,
  },
  {
    canBeFree: false,
    length: 75,
  },
  {
    canBeFree: false,
    length: 90,
  },
];

export const BookingFlow = ({ mentor }: { mentor: any }) => {
  const [slots, setSlots] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const selectedDate = useRef<string | null>(null);
  const selectedTime = useRef<string | null>(null);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [slotInterval, setSlotInterval] = useState(15);
  const { toast } = useToast();

  const from = new Date().toISOString();
  const to = new Date(
    new Date().setDate(new Date().getDate() + 7)
  ).toISOString();
  const interval = slotInterval;
  const forUser = mentor.id;

  const fetchSlots = useCallback(async () => {
    setIsSlotsLoading(true);
    const data = await fetchSlotsAPI({
      forUser: mentor.id,
      interval: slotInterval,
      from: new Date().toISOString(),
      to: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    });
    setSlots(data);
    setIsSlotsLoading(false);
  }, [mentor.id, slotInterval]);

  useEffect(() => {
    if (isOpen) {
      fetchSlots();
    }
  }, [isOpen, slotInterval]);

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

  const handleBookSlot = async () => {
    const date = selectedDate.current;
    const time = selectedTime.current;
    const start_time = dayjs(`${date}T${time}:00`);
    const end_time = dayjs(`${date}T${time}:00`).add(slotInterval, "minutes");

    setIsBooking(true);
    const res = await fetch("/api/book_slot", {
      method: "POST",
      body: JSON.stringify({
        for_user: mentor.id,
        start_time,
        end_time,
      }),
    });
    toast({
      description: "Slot booked successfully",
    });
    setIsBooking(false);
    setIsOpen(false);
  };

  const handleSlotChange = (slot: { date: string; time: string | null }) => {
    selectedDate.current = slot.date;
    selectedTime.current = slot.time;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} className="w-full">
          Book a session
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col w-3/4 max-w-screen min-h-[80vh] max-h-[80vh] overflow-hidden">
        <div className="flex flex-1 overflow-y-auto gap-4">
          {/* Interval selector */}
          <div className="grid gap-3 w-1/4 z-10 auto-rows-max">
            <DialogTitle>Select duration</DialogTitle>

            {intervals.map((interval) => (
              <Chip
                selected={slotInterval === interval.length}
                key={interval.length}
                onClick={() => setSlotInterval(interval.length)}
                leftText={`${interval.length} mins`}
                rightText={
                  interval.canBeFree ? "" : `$${(100 * interval.length) / 15}`
                }
              >
                {interval.canBeFree && (
                  <span className="text-xs my-1 text-white bg-green-500 self-center px-3 py-1">
                    FREE TRIAL
                  </span>
                )}
              </Chip>
            ))}
          </div>

          <div className=" w-[1px] bg-input"></div>
          {/* Schedules */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <DialogTitle>Select Slot</DialogTitle>
            {isSlotsLoading ? (
              <div>Loading...</div>
            ) : (
              <ScheduleCalendar slots={slots} onChange={handleSlotChange} />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button loading={isBooking} onClick={handleBookSlot}>
            Book
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
