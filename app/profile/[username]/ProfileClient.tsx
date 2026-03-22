"use client";

import { useState } from "react";
import UserAvatarBubble from "@/components/UserAvatarBubble";
import MatchFeedItem from "@/components/MatchFeedItem";
import Link from "next/link";

export default function ProfileClient({ user, matchCount, feed }: any) {
  const [showCircle, setShowCircle] = useState(false);

  return (
    <div className="w-full px-6 py-10">
      {/* HEADER */}
      <div className="flex items-center gap-5 mb-6">
        {/* AVATAR */}
        <div className="w-20 h-20 rounded-full p-[3px]">
          <div className="w-20 h-20">
            <UserAvatarBubble src={user.avatar_url} size={80} />
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex items-center gap-10">
          {/* NAME + INSTAGRAM */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{user.full_name}</span>

            {user.username && (
              <a
                href={`https://instagram.com/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 hover:scale-110 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17" cy="7" r="1" />
                </svg>
              </a>
            )}
          </div>

          {/* CIRCLE BUTTON */}
          <button
            onClick={() => setShowCircle(true)}
            className="
              flex flex-col items-center justify-center
              px-4 py-2 rounded-lg cursor-pointer
              transition-all duration-200
              hover:bg-zinc-800/60
              hover:scale-105
              hover:shadow-[0_0_10px_rgba(255,0,100,0.25)]
              active:scale-95
            "
          >
            <p className="text-lg font-semibold">{matchCount}</p>
            <p className="text-xs opacity-70">Circle</p>
          </button>
        </div>
      </div>

      {/* FEED */}
      <div className="mt-6">
        {feed.length === 0 ? (
          <p className="opacity-60">No activity yet</p>
        ) : (
          feed.map((item: any) => (
            <MatchFeedItem
              key={item.id}
              userA={item.user1}
              userB={item.user2}
              created_at={item.created_at}
              currentUserId={user.id} // ✅ FIXED
            />
          ))
        )}
      </div>

      {/* CIRCLE MODAL */}
      {showCircle && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowCircle(false)}
        >
          <div
            className="w-full max-w-md max-h-[70vh] overflow-y-auto p-4 bg-zinc-900 rounded-xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              Circle ({matchCount})
            </h2>

            {feed.length === 0 ? (
              <p className="opacity-60">No matches yet</p>
            ) : (
              feed.map((item: any) => {
                const otherUser =
                  item.user1.id === user.id ? item.user2 : item.user1;

                return (
                  <Link
                    key={item.id}
                    href={`/profile/${otherUser.username}`}
                    className="flex items-center gap-3 py-2 border-b border-white/10 hover:bg-zinc-800/40 rounded-lg px-2 transition"
                  >
                    <UserAvatarBubble src={otherUser.avatar_url} size={50} />

                    <span className="font-semibold text-white">
                      {otherUser.username}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
