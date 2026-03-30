"use client";

import { getPotentialMatches, likeUser } from "@/lib/actions/matches";
import { useEffect, useState } from "react";
// ❌ removed bad import
// import { UserProfile } from "../profile/page";
import { useRouter } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import MatchButtons from "@/components/MatchButtons";
import MatchNotification from "@/components/MatchNotification";

// ✅ added local type (ONLY addition)
type UserProfile = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
};

export default function MatchesPage() {
  const [potentialMatches, setPotentialMatches] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function loadUsers() {
      try {
        const potentialMatchesData = await getPotentialMatches();
        setPotentialMatches(potentialMatchesData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  async function handleLike() {
    if (currentIndex < potentialMatches.length) {
      const likedUser = potentialMatches[currentIndex];

      try {
        const result = await likeUser(likedUser.id);

        if (result.isMatch) {
          setMatchedUser(result.matchedUser!);
          setShowMatchNotification(true);
        }

        setCurrentIndex((prev) => prev + 1);
      } catch (err) {
        console.error(err);
      }
    }
  }

  function handlePass() {
    if (currentIndex < potentialMatches.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function handleCloseMatchNotification() {
    setShowMatchNotification(false);
  }

  function handleStartChat() {
    if (matchedUser) {
      router.push(`/chat/${matchedUser.id}`);
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4">Finding your matches...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= potentialMatches.length) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💕</span>
          </div>

          <h2 className="text-2xl font-bold mb-4">No more profiles to show</h2>

          <p className="mb-6">Check back later or adjust your preferences</p>

          <button
            onClick={() => setCurrentIndex(0)}
            className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-6 rounded-full hover:opacity-90 transition"
          >
            Refresh
          </button>
        </div>

        {showMatchNotification && matchedUser && (
          <MatchNotification
            match={matchedUser}
            onClose={handleCloseMatchNotification}
            onStartChat={handleStartChat}
          />
        )}
      </div>
    );
  }

  const currentPotentialMatch = potentialMatches[currentIndex];

  return (
    <div className="h-screen overflow-y-auto">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-zinc-800 transition"
              title="Go back"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex-1" />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Discover Matches</h1>

            <p>
              {currentIndex + 1} of {potentialMatches.length}
            </p>
          </div>
        </header>

        <div className="max-w-md mx-auto">
          <MatchCard user={currentPotentialMatch} />

          <div className="mt-8">
            <MatchButtons onLike={handleLike} onPass={handlePass} />
          </div>
        </div>

        {showMatchNotification && matchedUser && (
          <MatchNotification
            match={matchedUser}
            onClose={handleCloseMatchNotification}
            onStartChat={handleStartChat}
          />
        )}
      </div>
    </div>
  );
}
