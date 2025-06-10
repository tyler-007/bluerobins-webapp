"use client";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 w-full">
      {/* Avatar skeleton */}
      <span>Fetching messages...</span>
    </div>
  );
}
