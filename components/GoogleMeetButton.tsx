"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const TOKEN_KEY = "google_meet_token";
const TOKEN_EXPIRY_KEY = "google_meet_token_expiry";

export function GoogleMeetButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [meetLink, setMeetLink] = useState<string | null>(null);

  const createMeetWithToken = async (accessToken: string) => {
    try {
      const response = await fetch("/api/auth/google/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      const { meetLink } = await response.json();
      setMeetLink(meetLink);
      setIsLoading(false);
    } catch (error) {
      console.error("Error creating Meet link:", error);
      setIsLoading(false);
      // If token is invalid, clear it and trigger new auth
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      handleCreateMeet();
    }
  };

  const handleCreateMeet = async () => {
    try {
      setIsLoading(true);

      // Check for existing valid token
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

      if (storedToken && tokenExpiry && new Date(tokenExpiry) > new Date()) {
        await createMeetWithToken(storedToken);
        return;
      }

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
      window.addEventListener("message", async (event) => {
        if (event.data?.type === "GOOGLE_AUTH_CODE") {
          const { code } = event.data;

          // Step 4: Exchange code for Meet link
          const response = await fetch("/api/auth/google/callback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
          });

          const { meetLink, accessToken, expiresIn } = await response.json();

          // Store the token and its expiry
          if (accessToken && expiresIn) {
            const expiryDate = new Date();
            expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
            localStorage.setItem(TOKEN_KEY, accessToken);
            localStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.toISOString());
          }

          setMeetLink(meetLink);
          setIsLoading(false);
          popup?.close();
        }
      });
    } catch (error) {
      console.error("Error creating Meet link:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={handleCreateMeet} disabled={isLoading}>
        {isLoading ? "Creating Meet..." : "Create Google Meet"}
      </Button>

      {meetLink && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Meet Link:</p>
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {meetLink}
          </a>
        </div>
      )}
    </div>
  );
}
