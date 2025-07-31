"use client";

import { useEffect } from "react";

export const UpdateTimezone = ({ type }: { type: "student" | "mentor" }) => {
  const updateTimezone = async () => {
    await fetch("/api/update_timezone", {
      method: "POST",
      body: JSON.stringify({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        type: type,
      }),
    });
  };

  useEffect(() => {
    updateTimezone();
  }, []);

  return null;
};
