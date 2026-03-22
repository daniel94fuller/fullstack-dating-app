"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function UserAvatarSquare({
  src,
  username,
  label,
  className = "",
}: {
  src?: string | null;
  username?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  const finalSrc = src
    ? `${src}?v=${src.split("/").pop()}`
    : "/default-avatar.png";

  const handleClick = () => {
    if (username) {
      router.push(`/profile/${username}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative w-full aspect-square overflow-hidden rounded-2xl cursor-pointer ${className}`}
    >
      {/* IMAGE */}
      <Image
        src={finalSrc}
        alt="User avatar"
        fill
        sizes="(max-width: 768px) 100vw, 800px"
        quality={100}
        priority
        className="object-cover transition duration-300 group-hover:scale-[1.05]"
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition duration-300" />

      {/* LABEL (optional) */}
      {label && (
        <div className="absolute bottom-2 left-2 right-2 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition">
          {label}
        </div>
      )}
    </div>
  );
}
