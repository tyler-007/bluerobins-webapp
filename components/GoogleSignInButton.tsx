"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface GoogleSignInButtonProps {
  onSuccess?: (token: string) => void;
  userType: "student" | "parent" | "mentor";
  className?: string;
}

export default function GoogleSignInButton({
  onSuccess,
  userType,
  className = "",
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            user_type: userType,
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;

      // The redirect will be handled by the callback route
      // No need to call onSuccess here as the redirect will happen
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className={`
          flex items-center justify-center gap-3 w-full px-4 py-2.5
          bg-white border border-gray-300 rounded-lg
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          transition-all duration-200 ease-in-out
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <Image
          src="/google-logo.svg"
          alt="Google logo"
          width={18}
          height={18}
          className="w-[18px] h-[18px]"
        />
        <span className="text-[#3c4043] font-medium text-sm">
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </span>
      </button>
      {error && (
        <p className="text-red-500 text-sm text-center mt-1">{error}</p>
      )}
    </div>
  );
}
