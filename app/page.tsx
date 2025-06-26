"use client";

import { useState } from "react";
import Image from "next/image";
import GoogleLogo from "@/app/Google.png";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";
import { parseAsBoolean, useQueryState } from "nuqs";
// import OneTapComponent from "@/components/google-one-tap";

const carouselSlides = [
  {
    image: "/sign-in-img.png",
    title: "Wild Card Activities",
    subtitle: "Get mentored by college undergrads, grads, and professors on:",
    description:
      "Explore quirky, offbeat, and genius-level projects guided by brilliant minds across campuses.",
    dots: [0],
  },
  {
    image: "/sign-in-img-2.png",
    title: "Research & Passion Projects",
    subtitle: "Get mentored by college undergrads, grads, and professors on:",
    description:
      "Fuel your research and passion projects with expert insights from students, grads and mentors",
    dots: [1],
  },
  {
    image: "/sign-in-img-3.png",
    title: "Research & Passion Projects",
    subtitle: "Get mentored by college undergrads, grads, and professors on:",
    description:
      "Fuel your research and passion projects with expert insights from students, grads and mentors",
    dots: [2],
  },
  // Add more slides as needed
];

export default function Login() {
  const [current, setCurrent] = useState(1); // Start on the second slide
  const [userType, setUserType] = useState<
    "student" | "parent" | "mentor" | undefined
  >("mentor");
  const supabase = createClient();
  const total = carouselSlides.length;
  const slide = carouselSlides[current];

  const goTo = (idx: number) => setCurrent((idx + total) % total);

  const onGoogleSignIn = async () => {
    if (!userType) {
      toast({
        title: "Please select a user type",
        description:
          "Choose whether you're a student or mentor before signing in.",
        variant: "destructive",
      });
      return;
    }

    console.log(
      "REDIRECT:",
      `${window.location.origin}/auth/callback?user_type=${userType}`
    );

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?user_type=${userType}`,
          skipBrowserRedirect: false,
        },
      });

      console.log("DATA:", Object.keys(data));

      if (error) throw error;
    } catch (error: any) {
      console.error("OAuth error:", error);
      toast({
        title: "Google Sign In Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-row bg-[#7B7B7B] w-screen">
      {/* Left column - Carousel */}
      <div className="flex flex-col justify-between w-1/2 bg-[#2953BE] p-8 relative">
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="BlueRobins Logo"
          width={200}
          height={100}
          className="mb-8"
        />
        {/* <div className="mb-8">
          <div className="bg-white rounded-md px-4 py-2 inline-block">
            <span className="text-[#2953BE] font-bold text-2xl">
              bluerobins
            </span>
          </div>
        </div> */}
        {/* Carousel content */}
        <div className="flex flex-col items-center flex-1 justify-center relative">
          {/* Left arrow */}
          <button
            aria-label="Previous"
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
            onClick={() => goTo(current - 1)}
          >
            <span className="text-2xl">&#60;</span>
          </button>
          {/* Right arrow */}
          <button
            aria-label="Next"
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
            onClick={() => goTo(current + 1)}
          >
            <span className="text-2xl">&#62;</span>
          </button>
          <div className="text-white text-center text-xl font-medium mb-8">
            {slide.subtitle}
          </div>
          <div className="rounded-full overflow-hidden w-64 h-64 mb-6 border-4 border-white">
            <Image
              src={slide.image}
              alt="Feature"
              width={256}
              height={256}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="text-white text-lg font-semibold flex items-center gap-2 mb-2">
            <span>✨</span> <span>{slide.title}</span>
          </div>
          <div className="text-white text-center text-base mb-6 max-w-md">
            {slide.description}
          </div>
          {/* Carousel dots */}
          <div className="flex gap-2 mt-2">
            {carouselSlides.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full bg-white ${
                  idx === current ? "opacity-80" : "opacity-40"
                }`}
              />
            ))}
          </div>
        </div>
        <div />
      </div>
      {/* Right column */}
      <div className="flex flex-col justify-center items-center w-1/2 bg-white">
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-2 mt-4 text-center">Sign Up</h1>
          <p className="text-lg text-gray-500 mb-8 text-center">
            Join blurobins for free as a
          </p>
          <div className="flex flex-col gap-4 w-full mb-6">
            <button
              onClick={() => setUserType("student")}
              className={`border border-gray-300 rounded-full py-3 text-lg font-medium transition ${userType === "student" ? "bg-[#2953BE] text-white border-[#2953BE]" : "hover:bg-gray-100"}`}
            >
              Student
            </button>
            <button
              onClick={() => setUserType("parent")}
              className={`border border-gray-300 rounded-full py-3 text-lg font-medium transition ${userType === "parent" ? "bg-[#2953BE] text-white border-[#2953BE]" : "hover:bg-gray-100"}`}
            >
              Parent
            </button>
            <button
              onClick={() => setUserType("mentor")}
              className={`border border-gray-300 rounded-full py-3 text-lg font-medium transition ${userType === "mentor" ? "bg-[#2953BE] text-white border-[#2953BE]" : "hover:bg-gray-100"}`}
            >
              Mentor
            </button>
          </div>

          <button
            onClick={() => {
              console.log("clicked");
              onGoogleSignIn();
            }}
            className="flex items-center justify-center w-full bg-gray-100 rounded-full py-3 text-lg font-medium text-gray-700 hover:bg-gray-200 transition border border-gray-200"
          >
            <Image
              src={GoogleLogo}
              alt="Google"
              width={24}
              height={24}
              className="mr-4"
            />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
