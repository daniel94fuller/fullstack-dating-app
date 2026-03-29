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
          {/* LOGO */}
          <Logo />

          {user ? (
            <div className="flex items-center gap-6 text-white/70">
              {/* HOME */}
              <Link href="/" className="hover:text-white">
                <svg width="22" height="22" fill="none" stroke="currentColor">
                  <path
                    d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              {/* HANGOUTS → FIXED */}
              <Link href="/rooms" className="hover:text-white">
                <svg width="22" height="22" fill="none" stroke="currentColor">
                  <rect
                    x="3"
                    y="5"
                    width="15"
                    height="12"
                    rx="2"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 9l4-2v10l-4-2"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              {/* PROFILE */}
              <Link href="/profile" className="hover:text-white">
                <svg width="22" height="22" fill="none" stroke="currentColor">
                  <circle cx="11" cy="7" r="4" strokeWidth="2" />
                  <path d="M5 21c0-3.5 3-6 6-6s6 2.5 6 6" strokeWidth="2" />
                </svg>
              </Link>

              {/* SIGN OUT */}
              <button
                onClick={signOut}
                className="text-red-500 hover:text-red-400"
              >
                <svg width="22" height="22" fill="none" stroke="currentColor">
                  <path
                    d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                    strokeWidth="2"
                  />
                  <path d="M16 17l5-5-5-5M21 12H9" strokeWidth="2" />
                </svg>
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 text-white shadow text-sm"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
