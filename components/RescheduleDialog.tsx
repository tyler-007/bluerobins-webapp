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
  start_time,
  eventId,
  bookingId,
}: {
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
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-black">Start Time</span>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button loading={loading} onClick={_onReschedule} type="submit">
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
