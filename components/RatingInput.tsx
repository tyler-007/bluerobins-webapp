"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

export function RatingInput({ value, onChange }: RatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const stars = Array(5).fill(0);

  const handleClick = (value: number) => {
    onChange(value);
  };

  const handleMouseOver = (value: number) => {
    setHoverValue(value);
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  return (
    <div className="flex items-center gap-1">
      {stars.map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={index}
            className={cn(
              "h-6 w-6 cursor-pointer",
              (hoverValue || value) >= starValue
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            )}
            onClick={() => handleClick(starValue)}
            onMouseOver={() => handleMouseOver(starValue)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
    </div>
  );
} 