"use client";

import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function GoogleAuthPopupButton({
  onSuccess,
  userType,
}: {
  onSuccess?: (token: string) => void;
  userType: "student" | "parent" | "mentor";
}) {
  return (
    <div className="flex flex-col gap-2 items-center w-full">
      <GoogleSignInButton userType={userType} onSuccess={onSuccess} />
    </div>
  );
}
