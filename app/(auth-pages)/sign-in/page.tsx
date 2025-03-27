"use client";

import { useState } from "react";
import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import OneTapComponent from "@/components/google-one-tap";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function Login(props: { searchParams: Promise<Message> }) {
  const [showOneTap, setShowOneTap] = useState(false);
  return (
    <>
      <Button onClick={() => setShowOneTap(true)}>Sign in with Google</Button>
      {showOneTap && <OneTapComponent />}
    </>
  );
}

// export default async function Login(props: { searchParams: Promise<Message> }) {
//   const searchParams = await props.searchParams;
//   return (
//     <form className="flex-1 flex flex-col min-w-64">
//       <h1 className="text-2xl font-medium">Sign in</h1>
//       <p className="text-sm text-foreground">
//         Don't have an account?{" "}
//         <Link className="text-foreground font-medium underline" href="/sign-up">
//           Sign up
//         </Link>
//       </p>
//       <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
//         <Label htmlFor="email">Email</Label>
//         <Input name="email" placeholder="you@example.com" required />
//         <div className="flex justify-between items-center">
//           <Label htmlFor="password">Password</Label>
//           <Link
//             className="text-xs text-foreground underline"
//             href="/forgot-password"
//           >
//             Forgot Password?
//           </Link>
//         </div>
//         <Input
//           type="password"
//           name="password"
//           placeholder="Your password"
//           required
//         />
//         <SubmitButton pendingText="Signing In..." formAction={signInAction}>
//           Sign in with
//         </SubmitButton>
//         <FormMessage message={searchParams} />
//       </div>
//     </form>
//   );
// }
