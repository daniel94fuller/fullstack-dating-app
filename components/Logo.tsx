"use client";

import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      aria-label="Go to homepage"
      className="group flex items-center gap-2 select-none"
    >
      {/* LOGO WRAPPER */}
      <div className="relative flex items-center justify-center">
        {/* 🔥 glow (behind image) */}
        <div
          className="
            absolute h-8 w-24
            rounded-full blur-md
            opacity-0 group-hover:opacity-40
            bg-blue-500/50   /* ✅ add color so glow actually shows */
            transition-opacity duration-300
            z-0
          "
        />

        {/* LOGO IMAGE */}
        <Image
          src="/logo.png"
          alt="Popcircle"
          width={140}
          height={40}
          priority
          className="
            relative z-10
            h-8 w-auto object-contain
            transition-all duration-300
            group-hover:scale-105
          "
        />
      </div>
    </Link>
  );
}
