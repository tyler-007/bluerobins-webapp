"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import dayjs from "dayjs";

interface DaySlot {
  date: number;
  day: string;
  slots?: number | "Booked";
  isToday?: boolean;
}

const timeSlots = ["10:30 AM", "12:00 PM", "3:00 PM", "5:00 PM", "6:00 PM"];

const weekDays: DaySlot[] = [
  { date: 25, day: "Sun", slots: 15, isToday: true },
  { date: 26, day: "Mon", slots: 30 },
  { date: 27, day: "Tue", slots: 15 },
  { date: 28, day: "Wed", slots: 15 },
  { date: 29, day: "Thurs", slots: "Booked" },
  { date: 30, day: "Fri", slots: 3 },
  { date: 1, day: "Sat", slots: 9 },
];

export default function ScheduleCalendar(props: { slots: any }) {
  const [selectedDay, setSelectedDay] = useState(Object.keys(props.slots)[0]);

  console.log("SLOTS", selectedDay, props.slots[selectedDay]);

  useEffect(() => {
    setSelectedDay(Object.keys(props.slots)[0]);
  }, [Object.keys(props.slots)[0]]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {Object.values(props.slots ?? {}).map((day: any) => (
          <div
            key={day.date}
            onClick={() => setSelectedDay(day.full_date)}
            className={cn(
              "cursor-pointer rounded-lg p-4 text-center",
              day.full_date === selectedDay
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200"
            )}
          >
            <div className="text-lg font-medium">{day.day}</div>
            <div className="text-2xl font-bold mb-2">{day.date}</div>
            <div
              className={cn(
                "text-sm",
                !!day.slots.length ? "text-green-600" : "text-red-500",
                day.full_date === selectedDay && "text-white"
              )}
            >
              {!!day.slots.length ? `${day.slots.length} Slots` : "Booked"}
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 col-span-7 mt-4">
          {/* Time Slots */}
          {props.slots[selectedDay]?.slots?.map((slot: any, index: any) => (
            <button
              key={`${index}`}
              className={cn(
                "py-3 px-6 rounded-full text-center transition-colors bg-white border border-gray-200 hover:bg-gray-50"
              )}
            >
              {dayjs(`${selectedDay}T${slot.start}:00`).format("h:mm A")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
