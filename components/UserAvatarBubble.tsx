"use client";

import Image from "next/image";
import Link from "next/link";

export default function UserAvatarBubble({
  src,
  size = 80,
  href,
  variant = "none",
}: {
  src?: string | null;
  size?: number;
  href?: string;
  variant?: "none" | "ring" | "gradient" | "glow";
}) {
  const finalSrc = src
    ? `${src}?v=${src.split("/").pop()}`
    : "/default-avatar.png";

  function getWrapperStyle() {
    switch (variant) {
      case "ring":
        return "p-[2px] bg-white/10";
      case "gradient":
        return "p-[2px] bg-gradient-to-tr from-pink-500 to-yellow-400";
      case "glow":
        return "p-[2px] bg-white/10 shadow-[0_0_10px_rgba(255,0,100,0.4)]";
      default:
        return "";
    }
  }

  const avatar = (
    <div
      className={`
        relative rounded-full overflow-hidden
        transition-all duration-200
        hover:scale-105 active:scale-95
        ${variant !== "none" ? getWrapperStyle() : ""}
      `}
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full rounded-full overflow-hidden bg-black">
        <Image
          src={finalSrc}
          alt="User avatar"
          fill
          sizes={`${size * 2}px`}
          quality={100}
          className="object-cover"
        />
      </div>
    </div>
  );

  // ✅ If href → clickable
  if (href) {
    return (
      <Link href={href} className="inline-block">
        {avatar}
      </Link>
    );
  }

  // ✅ Otherwise just render (NO CLICK / NO EXPAND)
  return <div className="inline-block">{avatar}</div>;
}
