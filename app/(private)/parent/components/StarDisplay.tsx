"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarDisplayProps {
  rating: number;
  maxRating?: number;
}

export function StarDisplay({ rating, maxRating = 5 }: StarDisplayProps) {
  const stars = Array(maxRating).fill(0);

  return (
    <div className="flex items-center gap-1">
      {stars.map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={index}
            className={cn(
              "h-5 w-5",
              rating >= starValue
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            )}
          />
        );
      })}
    </div>
  );
} 