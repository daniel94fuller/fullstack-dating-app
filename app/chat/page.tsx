"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserAvatarSquare from "@/components/UserAvatarSquare";
import { getIncomingLikes } from "@/lib/actions/matches";

export default function InboxPage() {
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLikes() {
      try {
        const data = await getIncomingLikes();

        // ✅ NO formatting needed anymore
        setLikes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadLikes();
  }, []);

  function formatTime(timestamp: string) {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diff < 1) return "Just now";
    if (diff < 24)
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (diff < 48) return "Yesterday";

    return date.toLocaleDateString();
  }

  // 🔄 LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* HEADER */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Inbox</h1>
          <p>
            {likes.length} like{likes.length !== 1 ? "s" : ""}
          </p>
        </header>

        {likes.length === 0 ? (
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔥</span>
            </div>

            <h2 className="text-2xl font-bold mb-4">No likes yet</h2>

            <p className="mb-6">
              When someone likes you, they’ll show up here.
            </p>

            <Link href="/matches" className="match-button">
              Start Swiping
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="card overflow-hidden">
              {likes.map((like) => (
                <Link
                  key={like.id}
                  href={`/profile/${like.username}`}
                  className="block"
                >
                  <div className="flex items-center p-6 border-b last:border-b-0 hover:bg-zinc-800/40 transition">
                    {/* AVATAR */}
                    <div className="w-16 h-16 flex-shrink-0">
                      <UserAvatarSquare
                        src={like.avatar_url}
                        username={like.username}
                        className="!rounded-full"
                      />
                    </div>

                    {/* INFO */}
                    <div className="flex-1 min-w-0 ml-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-semibold truncate">
                          {like.full_name}
                        </h3>

                        <span className="text-sm flex-shrink-0">
                          {formatTime(like.created_at)}
                        </span>
                      </div>

                      <p className="text-sm text-pink-500">Liked you ❤️</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
