"use client";

import Script from "next/script";
import { createClient } from "@/utils/supabase/client";
import { CredentialResponse } from "google-one-tap";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const TOKEN_KEY = "google_meet_token";
const TOKEN_EXPIRY_KEY = "google_meet_token_expiry";

const OneTapComponent = (props: {
  userType: "student" | "parent" | "mentor";
}) => {
  const supabase = createClient();
  const router = useRouter();

  // generate nonce to use for google id token sign-in
  const generateNonce = async (): Promise<string[]> => {
    const nonce = btoa(
      String.fromCharCode.apply(
        null,
        Array.from(crypto.getRandomValues(new Uint8Array(32)))
      )
    );
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(nonce);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return [nonce, hashedNonce];
  };

  const initializeGoogleOneTap = async () => {
    console.log("Initializing Google One Tap");

    console.log("Initializing 2");
    const [nonce, hashedNonce] = await generateNonce();
    console.log("Nonce: ", nonce, hashedNonce);

    // check if there's already an existing session before initializing the one-tap UI
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session", error);
    }
    if (data.session) {
      router.push("/");
      return;
    }

    console.log("Initializing 3", data, error);

    /* global google */
    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
      callback: async (response: CredentialResponse) => {
        try {
          console.log("Initializing Started Google One Tap");
          // send id token returned in response.credential to supabase
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
            nonce,
          });

          if (error) throw error;
          console.log("Session data: ", data);
          console.log("Successfully logged in with Google One Tap");

          await supabase.auth.updateUser({
            data: {
              user_type: props.userType || "student",
            },
          });
          // Store the token and its expiry
          if (data.session?.provider_token) {
            const expiryDate = new Date();
            expiryDate.setSeconds(expiryDate.getSeconds() + 3600); // 1 hour expiry
            localStorage.setItem(TOKEN_KEY, data.session.provider_token);
            localStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.toISOString());
          }

          // redirect to protected page
          router.push("/");
        } catch (error) {
          console.error("Error logging in with Google One Tap", error);
        }
      },
      nonce: hashedNonce,
      // with chrome's removal of third-party cookiesm, we need to use FedCM instead (https://developers.google.com/identity/gsi/web/guides/fedcm-migration)
      use_fedcm_for_prompt: true,
    });
    console.log("Initializing 4");
    google.accounts.id.prompt(); // Display the One Tap UI
  };

  useEffect(() => {
    // initializeGoogleOneTap();
    // return () => window.removeEventListener("load", initializeGoogleOneTap);
  }, []);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={initializeGoogleOneTap}
      />
      <div id="oneTap" className="fixed top-0 right-0 z-[100]" />
    </>
  );
};

export default OneTapComponent;
