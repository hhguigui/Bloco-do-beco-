import { useState } from "react";
import { initials } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  picture?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export default function UserAvatar({ name, picture, className, fallbackClassName }: UserAvatarProps) {
  const [error, setError] = useState(false);

  if (picture && !error) {
    return (
      <img
        src={picture}
        alt={name}
        className={cn("size-7 rounded-full object-cover", className)}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid size-7 place-items-center rounded-full bg-[#FFEDD5] text-xs font-bold text-[#C2410C]",
        className,
        fallbackClassName
      )}
    >
      {initials(name)}
    </span>
  );
}
