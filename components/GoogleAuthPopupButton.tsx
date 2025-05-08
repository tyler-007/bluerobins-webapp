"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const TOKEN_KEY = "google_meet_token";
const TOKEN_EXPIRY_KEY = "google_meet_token_expiry";

export default function GoogleAuthPopupButton({
  onSuccess,
}: {
  onSuccess?: (token: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Step 1: Get the auth URL
      const authResponse = await fetch("/api/auth/google");
      const { authUrl } = await authResponse.json();

      // Step 2: Open Google OAuth popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        "Google Auth",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Step 3: Listen for the auth code from the popup
      const listener = async (event: MessageEvent) => {
        if (event.data?.type === "GOOGLE_AUTH_CODE") {
          const { code } = event.data;

          // Step 4: Exchange code for token
          const response = await fetch("/api/auth/google/callback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
          });

          const {
            accessToken,
            expiresIn,
            error: apiError,
          } = await response.json();

          if (apiError) {
            setError(apiError);
            setIsLoading(false);
            popup?.close();
            window.removeEventListener("message", listener);
            return;
          }

          // Store the token and its expiry
          if (accessToken && expiresIn) {
            const expiryDate = new Date();
            expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
            localStorage.setItem(TOKEN_KEY, accessToken);
            localStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.toISOString());
            if (onSuccess) onSuccess(accessToken);
          }

          setIsLoading(false);
          popup?.close();
          window.removeEventListener("message", listener);
        }
      };
      window.addEventListener("message", listener);
    } catch (err: any) {
      setError("Google Auth failed");
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      <Button
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Signing in with Google..." : "Sign in with Google Popup"}
      </Button>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </div>
  );
}
