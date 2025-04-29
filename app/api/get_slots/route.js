import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
// import { createAdminClient } from '@/utils/supabase/admin'
// import fetch from 'node-fetch'

function getTimeSlots(start = "10:00", end = "17:00", interval = 15) {
  const slots = [];
  let [startHour, startMinute] = start.split(":").map(Number);
  let [endHour, endMinute] = end.split(":").map(Number);

  let current = new Date();
  current.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date();
  endTime.setHours(endHour, endMinute, 0, 0);

  while (current < endTime) {
    const slotStart = current.toTimeString().slice(0, 5); // "HH:MM"
    current = new Date(current.getTime() + interval * 60000);
    const slotEnd = current.toTimeString().slice(0, 5);
    slots.push({ start: slotStart, end: slotEnd });
  }

  return slots;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const interval = searchParams.get("interval");
  const adminBase = createAdminClient();
  const start_time = "10:00";
  const end_time = "23:00";

  console.log("INTERVAL:", interval, from, to);
  //   const booked_slots = [];
  const for_user = "f9f39868-8211-4118-8284-4d1b1cc1a322";

  const { data: booked_slots, error } = await adminBase
    .from("bookings")
    .select("*")
    .eq("for", for_user)
    .gte("start_time", from)
    .lte("end_time", to);
  // Add date filter laters

  // get array of slots of 15 minutes each between start_time and end_time. Start time is 10:00 and end time is 17:00
  const slots = getTimeSlots(start_time, end_time, +interval ?? 15);

  // loop through all dates between from and to
  const allSlots = {};
  for (let i = 0; i < 7; i++) {
    const date = dayjs(from).add(i, "day").format("YYYY-MM-DD");

    const filteredSlots = slots.filter((slot) => {
      const slotStart = dayjs(`${date}T${slot.start}:00`);
      const slotEnd = dayjs(`${date}T${slot.end}:00`);
      // Exclude slot if it overlaps with any booked slot
      return !booked_slots.some((booked) => {
        const bookedStart = dayjs(booked.start_time);
        const bookedEnd = dayjs(booked.end_time);
        return (
          (bookedStart.isSameOrAfter(slotStart) &&
            bookedStart.isBefore(slotEnd)) ||
          (bookedEnd.isSameOrBefore(slotEnd) && bookedEnd.isAfter(slotStart))
        );
      });
    });

    allSlots[date] = {
      full_date: date,
      day: dayjs(date).format("ddd"),
      date: dayjs(date).format("D"),
      isToday: dayjs(date).isSame(dayjs(), "day"),
      slots: filteredSlots,
    };
  }
  // You may want to pass the date as a parameter
  console.log("ALL SLOTS:", allSlots);
  return NextResponse.json(allSlots);
}
