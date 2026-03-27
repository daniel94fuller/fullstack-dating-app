"use client";

import Image from "next/image";

export default function UserAvatarBubble({
  src,
  size = 60,
}: {
  src?: string | null;
  size?: number;
}) {
  const finalSrc = src
    ? `${src}?v=${src.split("/").pop()}`
    : "/default-avatar.png";

  return (
    <div
      className="rounded-full overflow-hidden border border-white/20"
      style={{ width: size, height: size }}
    >
      <Image
        src={finalSrc}
        alt="avatar"
        width={size}
        height={size}
        className="object-cover w-full h-full"
      />
    </div>
  );
}
