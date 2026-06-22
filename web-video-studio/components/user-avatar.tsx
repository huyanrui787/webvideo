"use client";

import { useMemo } from "react";

interface UserInfo {
  name: string;
  email: string;
  avatarUrl?: string | null;
}

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-pink-500",
  "bg-amber-500", "bg-emerald-500", "bg-cyan-500",
  "bg-rose-500", "bg-blue-500",
];

const SIZES = {
  sm: { size: "w-7 h-7", text: "text-[11px]" },
  md: { size: "w-9 h-9", text: "text-sm" },
  lg: { size: "w-20 h-20", text: "text-2xl" },
  xl: { size: "w-24 h-24", text: "text-3xl" },
} as const;

interface Props {
  user: UserInfo;
  size?: keyof typeof SIZES;
  className?: string;
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  if (!name?.trim()) return "?";
  // Take first char — for Chinese names it's the surname, for English it's first letter
  const trimmed = name.trim();
  // If Chinese characters are present, take the last 1-2 chars (given name)
  const chineseChars = trimmed.match(/[一-鿿]/g);
  if (chineseChars && chineseChars.length >= 2) {
    return chineseChars.slice(-2).join("");
  }
  if (chineseChars && chineseChars.length === 1) {
    return chineseChars[0];
  }
  // For English names, take first letter (or first two words' initials)
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function UserAvatar({ user, size = "md", className = "" }: Props) {
  const bgColor = useMemo(
    () => AVATAR_COLORS[hashName(user.name) % AVATAR_COLORS.length],
    [user.name],
  );

  const initials = useMemo(() => getInitials(user.name), [user.name]);
  const sz = SIZES[size];

  // If user has an uploaded avatar, show it
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={`${sz.size} rounded-full object-cover border-2 border-bd shrink-0 ${className}`}
      />
    );
  }

  // Otherwise show initials with hash-based background color
  return (
    <div
      className={`${sz.size} rounded-full ${bgColor} flex items-center justify-center shrink-0 border-2 border-bd ${className}`}
      title={user.name}
    >
      <span className={`${sz.text} font-bold text-white leading-none`}>
        {initials}
      </span>
    </div>
  );
}
