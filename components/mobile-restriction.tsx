"use client";

import { useEffect, useState } from "react";

export function MobileRestriction({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const mobileDevices =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileDevices.test(userAgent));
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold mb-4">Mobile Access Restricted</h1>
          <p className="text-muted-foreground">
            This application is currently optimized for desktop use only. Please
            access it from a desktop computer for the best experience.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
