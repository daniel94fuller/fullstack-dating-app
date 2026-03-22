"use client";

import { UserProfile } from "@/app/profile/page";
import { getUserMatches } from "@/lib/actions/matches";
import { useEffect, useState } from "react";
import Link from "next/link";
import { calculateAge } from "@/lib/helpers/calculate-age";
import UserAvatarSquare from "@/components/UserAvatarSquare";

export default function MatchesListPage() {
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatches() {
      try {
        const userMatches = await getUserMatches();
        setMatches(userMatches);
      } catch (error) {
        setError("Failed to load matches.");
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);

  // 🔄 LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-zinc-400">Loading your matches...</p>
        </div>
      </div>
    );
  }

  // ❌ ERROR
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-zinc-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* HEADER */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Matches</h1>
          <p className="text-zinc-400">
            {matches.length} match{matches.length !== 1 ? "es" : ""}
          </p>
        </header>

        {/* EMPTY STATE */}
        {matches.length === 0 ? (
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">💕</span>
            </div>

            <h2 className="text-2xl font-bold mb-4">No matches yet</h2>

            <p className="text-zinc-400 mb-6">
              Start swiping to find your perfect match!
            </p>

            <Link
              href="/matches"
              className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-6 rounded-full hover:opacity-90 transition"
            >
              Start Swiping
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="grid gap-4">
              {matches.map((match, key) => (
                <Link
                  key={key}
                  href={`/chat/${match.id}`}
                  className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 shadow hover:bg-zinc-700 transition"
                >
                  <div className="flex items-center space-x-4">
                    {/* AVATAR */}
                    <div className="w-16 h-16 flex-shrink-0">
                      <UserAvatarSquare
                        src={match.avatar_url}
                        username={match.username}
                        className="!rounded-full"
                      />
                    </div>

                    {/* INFO */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold">
                        {match.full_name}, {calculateAge(match.birthdate)}
                      </h3>

                      <p className="text-sm text-zinc-400 mb-1">
                        @{match.username}
                      </p>

                      <p className="text-sm text-zinc-400 line-clamp-2">
                        {match.bio}
                      </p>
                    </div>

                    {/* ONLINE DOT */}
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
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
