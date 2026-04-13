"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import Logo from "./Logo";

export default function Navbar() {
  const { signOut, user, loading } = useAuth();

  if (loading) return null;

  return (
    <nav className="z-50 backdrop-blur-md border-b border-white/10">
      <div className="w-full px-3 sm:px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {user ? (
            <div className="flex items-center gap-6 text-white/70">
              {/* HOME */}
              <Link href="/" className="hover:text-white">
                Home
              </Link>

              {/* 🔥 INBOX */}
              <Link href="/messages" className="hover:text-white">
                Inbox
              </Link>

              {/* 🔥 START SESSION */}
              <Link href="/start" className="hover:text-white">
                Start
              </Link>

              {/* PROFILE */}
              <Link href="/profile" className="hover:text-white">
                Profile
              </Link>

              {/* SIGN OUT */}
              <button
                onClick={signOut}
                className="text-red-500 hover:text-red-400"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
