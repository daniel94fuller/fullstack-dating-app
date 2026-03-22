"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getIncomingLikes } from "@/lib/actions/matches";
import Logo from "./Logo";

export default function Navbar() {
  const { signOut, user, loading } = useAuth();

  const [newLikesCount, setNewLikesCount] = useState(0);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  if (loading) return null;

  // ✅ ONLY LOAD ONCE (NO POLLING → fixes ngrok spam)
  useEffect(() => {
    if (!user) return;

    async function loadLikes() {
      try {
        const likes = await getIncomingLikes();

        if (!likes || likes.length === 0) {
          setNewLikesCount(0);
          return;
        }

        const lastSeen = localStorage.getItem("lastSeenLike");

        // first time baseline
        if (!lastSeen) {
          localStorage.setItem("lastSeenLike", likes[0].created_at);
          setNewLikesCount(0);
          return;
        }

        const newLikes = likes.filter(
          (l) => new Date(l.created_at) > new Date(lastSeen),
        );

        setNewLikesCount(newLikes.length);
      } catch (err) {
        console.error(err);
      }
    }

    loadLikes();
  }, [user]);

  // 🔥 CLOSE MENU
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // 🔥 CLEAR NOTIFICATIONS
  function handleMessagesClick() {
    const now = new Date().toISOString();
    localStorage.setItem("lastSeenLike", now);
    setNewLikesCount(0);
  }

  return (
    <nav className="relative z-50 backdrop-blur-md border-b border-white/10">
      <div className="w-full px-3 sm:px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />

          <div className="flex items-center gap-4 mr-1">
            {user && (
              <>
                <Link
                  href="/chat"
                  onClick={handleMessagesClick}
                  className={`relative transition ${
                    newLikesCount > 0
                      ? "text-red-500"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                  </svg>

                  {newLikesCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded-full animate-pulse shadow">
                      {newLikesCount}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => setOpen((prev) => !prev)}
                  className="text-white/80 hover:text-white transition"
                >
                  <svg width="26" height="26" fill="none" stroke="currentColor">
                    <path d="M4 7h18M4 13h18M4 19h18" strokeWidth="2" />
                  </svg>
                </button>

                {open && (
                  <div
                    ref={menuRef}
                    className="absolute right-6 top-16 w-52 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden text-white"
                  >
                    <Link
                      href="/matches"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-zinc-800 transition"
                    >
                      Discover
                    </Link>

                    <Link
                      href="/matches/list"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-zinc-800 transition"
                    >
                      Matches
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-zinc-800 transition"
                    >
                      Profile
                    </Link>

                    <div className="border-t border-white/10" />

                    <button
                      onClick={() => {
                        signOut();
                        setOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-zinc-800 text-red-500"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </>
            )}

            {!user && (
              <Link
                href="/auth"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 text-white shadow"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
