import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | "busy";
  className?: string;
  fallback?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Avatar",
  size = "md",
  status,
  className,
  fallback,
}) => {
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
  };

  const statusClasses = {
    online: "bg-green-500",
    offline: "bg-neutral-400",
    away: "bg-amber-500",
    busy: "bg-red-500",
  };

  const getFallbackInitials = () => {
    if (fallback) return fallback;
    if (!alt || alt === "Avatar") return "RH";

    const words = alt.split(" ");
    if (words.length === 1) return alt.substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          "rounded-full overflow-hidden flex items-center justify-center bg-secondary text-primary-foreground font-medium border-2 border-white dark:border-neutral-800",
          sizeClasses[size],
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span>{getFallbackInitials()}</span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            "absolute block rounded-full ring-2 ring-white dark:ring-neutral-800",
            statusClasses[status],
            {
              "w-2 h-2 bottom-0 right-0": size === "xs" || size === "sm",
              "w-3 h-3 -bottom-0.5 -right-0.5": size === "md",
              "w-3.5 h-3.5 -bottom-0.5 -right-0.5":
                size === "lg" || size === "xl",
            }
          )}
        />
      )}
    </div>
  );
};

export default Avatar;
