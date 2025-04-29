import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);
// import { createAdminClient } from '@/utils/supabase/admin'
// import fetch from 'node-fetch'

// function getTimeSlots(configs: { start: string, end: string }[], interval: number) {
function getTimeSlots(configs, interval) {
  const slots = [];

  configs.forEach((config) => {
    let [startHour, startMinute] = config.start.split(":").map(Number);
    let [endHour, endMinute] = config.end.split(":").map(Number);

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
  });

  return slots;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const interval = searchParams.get("interval");
  const mentor = searchParams.get("mentor");
  const adminBase = createAdminClient();
  const start_time = "10:00";
  const end_time = "23:00";

  console.log("INTERVAL:", interval, from, to);
  //   const booked_slots = [];
  const for_user = mentor;

  const { data: booked_slots, error } = await adminBase
    .from("bookings")
    .select("*")
    .eq("for", for_user)
    .gte("start_time", from)
    .lte("end_time", to);

  const { data: booking_config, error: booking_config_error } = await adminBase
    .from("booking_configs")
    .select("*")
    .eq("user_id", for_user)
    .single();

  console.log("MENTOR DATA:", booking_config, booking_config_error);
  // Add date filter laters

  // get array of slots of 15 minutes each between start_time and end_time. Start time is 10:00 and end time is 17:00

  // loop through all dates between from and to
  const allSlots = {};
  for (let i = 0; i < 7; i++) {
    const date = dayjs(from).add(i, "day").format("YYYY-MM-DD");
    const dayName = dayjs(date).format("dddd").toLowerCase();
    const booking_config_for_day = booking_config.availability[dayName];
    const slots = getTimeSlots(booking_config_for_day, +interval ?? 15);

    const filteredSlots = slots.filter((slot) => {
      const slotStart = dayjs(`${date}T${slot.start}:00`);
      const slotEnd = dayjs(`${date}T${slot.end}:00`);

      // This logic is buggy if booked slot is longer than interval.
      // Exclude slot if it overlaps with any booked slot
      return !booked_slots.some((booked) => {
        const bookedStart = dayjs(booked.start_time).subtract(1, "minute");
        const bookedEnd = dayjs(booked.end_time);

        return (
          slotStart.isBetween(bookedStart, bookedEnd, "minute", "[]") ||
          slotEnd.isBetween(bookedStart, bookedEnd, "minute", "[]")
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
  //   console.log("ALL SLOTS:", allSlots);
  return NextResponse.json(allSlots);
}
