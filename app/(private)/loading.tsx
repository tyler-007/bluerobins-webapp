"use client";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 w-full">
      {/* Avatar skeleton */}
      <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse mb-6" />
      {/* Title skeleton */}
      <div className="w-48 h-6 rounded bg-gray-200 animate-pulse mb-8" />
      {/* Card skeletons */}
      <div className="flex flex-col gap-6 w-full">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-row gap-4 p-6 bg-white rounded-xl shadow animate-pulse w-full"
          >
            <div className="w-16 h-16 rounded-lg bg-gray-200" />
            <div className="flex-1 flex flex-col gap-3">
              <div className="w-1/2 h-4 bg-gray-200 rounded" />
              <div className="w-1/3 h-4 bg-gray-200 rounded" />
              <div className="w-3/4 h-3 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
