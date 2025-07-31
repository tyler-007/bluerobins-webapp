"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PayPalPayment } from "@/components/PayPalPayment";
import { Button } from "@/components/ui/button";
import { useCallback, useMemo, useState } from "react";
import { Form, useForm } from "react-hook-form";
import { updateEvent } from "@/lib/actions";
import { z } from "zod";
import { Input } from "./ui/input";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

dayjs.extend(utc);
dayjs.extend(timezone);

type FormValues = z.infer<typeof formSchema>;

const formSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
});

interface RescheduleDialogProps {
  open: boolean;
  amount: number;
  summary?: React.ReactNode;
}

export const RescheduleDialog = ({
  studentId,
  start_time,
  eventId,
  bookingId,
}: {
  studentId: string;
  start_time: string;
  eventId: string;
  bookingId: string;
}) => {
  const supabase = createClient();
  const [date, setDate] = useState(dayjs(start_time).format("YYYY-MM-DD"));
  const [time, setTime] = useState(dayjs(start_time).format("HH:mm"));
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const _onReschedule = useCallback(async () => {
    setLoading(true);
    try {
      const startDateTime = dayjs(`${date}T${time}`)
        .utc()
        .format("YYYY-MM-DDTHH:mm:ss[Z]");
      const endDateTime = dayjs(`${date}T${time}`)
        .utc()
        .add(1, "hour")
        .format("YYYY-MM-DDTHH:mm:ss[Z]");

      const res = await updateEvent({
        eventId,
        startDateTime,
        endDateTime,
      });
      // update booking start_time
      const { data, error } = await supabase
        .from("bookings")
        .update({
          start_time: startDateTime,
        })
        .eq("id", bookingId);

      if (error) {
        console.error("Error updating booking:", error);
      }
      console.log("Booking updated:", bookingId, data);
      console.log("Update response:", res);
      setOpen(false); // Close the dialog after successful update
      window.location.reload();
    } catch (error) {
      console.error("Error updating booking:", error);
    } finally {
      setLoading(false);
    }
  }, [date, eventId, time, start_time]);

  console.log("Time:", start_time);

  // Get current timezone
  const currentTimezone = dayjs.tz.guess();
  const timezoneAbbr = dayjs().tz(currentTimezone).format("z");

  const { data: studentDetails } = useQuery({
    queryKey: ["studentDetails", studentId],
    queryFn: () =>
      fetch(`/api/get_student_details?studentId=${studentId}`).then((res) =>
        res.json()
      ),
  });

  const selectedTime = dayjs(`${date} ${time}`, "YYYY-MM-DD HH:mm");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Reschedule</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[400px] ml-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Session</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4 gap-y-1">
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-black">Start Date</span>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <span className="text-black -mt-1 text-sm ml-1">
              {dayjs(date).format("dddd")}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-black">Start Time</span>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <span className="text-black -mt-1 text-sm ml-1">
              {timezoneAbbr === "z" ? "" : timezoneAbbr} {currentTimezone}
            </span>
          </div>
        </div>
        <DialogFooter>
          <div className="w-full flex justify-between items-center gap-8">
            {studentDetails?.timezone && (
              <span className="text-black -mt-1 text-xs ml-1">
                Student Time: <br />
                <span className="text-sm">
                  {selectedTime
                    .tz(studentDetails.timezone)
                    .format("DD MMM, dddd, h:mm A")}
                </span>
              </span>
            )}
            <Button
              className="ml-auto"
              loading={loading}
              onClick={_onReschedule}
              type="submit"
            >
              Reschedule
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
