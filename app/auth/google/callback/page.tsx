"use client";

import { useEffect } from "react";

export default function GoogleCallback() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      // Send the code back to the opener window
      window.opener?.postMessage(
        { type: "GOOGLE_AUTH_CODE", code },
        window.location.origin
      );
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Processing authentication...</p>
    </div>
  );
}
