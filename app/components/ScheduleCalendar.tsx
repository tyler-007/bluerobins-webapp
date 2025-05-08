"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import dayjs from "dayjs";

export default function ScheduleCalendar(props: {
  slots: any;
  onChange: (slot: { date: string; time: string | null }) => void;
}) {
  const [selectedDay, setSelectedDay] = useState(
    Object.keys(props.slots ?? {})?.[0] ?? {}
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDay(Object.keys(props.slots ?? {})?.[0] ?? {});
  }, [Object.keys(props.slots ?? {})?.[0]]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDay]);

  useEffect(() => {
    props.onChange({ date: selectedDay, time: selectedSlot });
  }, [selectedSlot]);

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
                "py-3 px-6 rounded-full text-center transition-colors bg-white border border-gray-200 hover:bg-gray-50",
                selectedSlot === slot.start && "bg-blue-600 text-white"
              )}
              onClick={() => setSelectedSlot(slot.start)}
            >
              {dayjs(`${selectedDay}T${slot.start}:00`).format("h:mm A")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
