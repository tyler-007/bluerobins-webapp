import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";

export const TimeSlots = ({
  availability,
  day,
}: {
  availability: {
    start: string;
    end: string;
  }[];
  day: string;
}) => {
  return (
    <>
      <span>{day}</span>
      {!availability?.length ? (
        <span className="text-sm text-gray-500">Unavailable</span>
      ) : (
        (availability ?? []).map((item: any, index: number) => (
          <React.Fragment key={item.start || index}>
            {index > 0 && <div />}
            <span>
              {dayjs(`2024-01-01T${item.start}`).format("h:mm A")} -{" "}
              {dayjs(`2024-01-01T${item.end}`).format("h:mm A")}
            </span>
          </React.Fragment>
        ))
      )}
      <div className="flex col-span-2 h-1"></div>
    </>
  );
};
