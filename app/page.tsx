"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState, useMemo } from "react";
// ❌ removed broken import
// import { UserProfile } from "@/app/profile/page";
import UserAvatarBubble from "@/components/UserAvatarBubble";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getGlobalActivity } from "@/lib/actions/activity";
import ActivityCard from "@/components/ActivityCard";
import ProfilePostCard from "@/components/ProfilePostCard";
import {
  getPotentialMatches,
  getAllUsers,
  likeUser,
  skipUser,
} from "@/lib/actions/matches";
import { createClient } from "@/lib/supabase/client";

// ✅ ONLY addition
type UserProfile = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
};

export default function Home() {
  const { user, loading } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [discoverUsers, setDiscoverUsers] = useState<UserProfile[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [circleUsers, setCircleUsers] = useState<UserProfile[]>([]);
  const [incomingLikes, setIncomingLikes] = useState<UserProfile[]>([]);
  const [skippedUsers, setSkippedUsers] = useState<UserProfile[]>([]);
  const [showSkipped, setShowSkipped] = useState(false);

  const [sentLikes, setSentLikes] = useState<UserProfile[]>([]);
  const [showSentLikes, setShowSentLikes] = useState(false);

  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  // ===============================
  // LOAD DATA
  // ===============================
  useEffect(() => {
    async function loadAll() {
      try {
        const users = await getAllUsers();

        // GUEST MODE
        if (!user) {
          setDiscoverUsers(users.slice(0, 10));
          setActivity([]);
          setReady(true);
          return;
        }

        // ===== ORIGINAL LOGIC =====

        const { data: matchData } = await supabase
          .from("matches")
          .select("user1_id, user2_id")
          .eq("is_active", true);

        const matchIds = new Set<string>();
        matchData?.forEach((m) => {
          if (m.user1_id === user.id) matchIds.add(m.user2_id);
          if (m.user2_id === user.id) matchIds.add(m.user1_id);
        });

        setMatchedIds(matchIds);

        setCircleUsers(users.filter((u) => matchIds.has(u.id)));

        const { data: likes } = await supabase
          .from("likes")
          .select("from_user_id")
          .eq("to_user_id", user.id);

        const likeIds = likes?.map((l) => l.from_user_id) || [];

        const { data: likeUsers } = await supabase
          .from("users")
          .select("*")
          .in("id", likeIds);

        const filteredIncoming = (likeUsers || []).filter(
          (u) => !matchIds.has(u.id),
        );

        setIncomingLikes(filteredIncoming);

        const { data: sent } = await supabase
          .from("likes")
          .select("to_user_id")
          .eq("from_user_id", user.id);

        const sentIds = sent?.map((l) => l.to_user_id) || [];

        const { data: sentUsers } = await supabase
          .from("users")
          .select("*")
          .in("id", sentIds);

        setSentLikes((sentUsers || []).filter((u) => !matchIds.has(u.id)));

        const { data: skipped } = await supabase
          .from("skipped")
          .select("to_user_id")
          .eq("from_user_id", user.id);

        const skippedIds = skipped?.map((s) => s.to_user_id) || [];

        const { data: skippedUsers } = await supabase
          .from("users")
          .select("*")
          .in("id", skippedIds);

        setSkippedUsers(skippedUsers || []);

        const discover = await getPotentialMatches();

        setDiscoverUsers(
          discover.filter(
            (u) =>
              u.id !== user.id &&
              !matchIds.has(u.id) &&
              !filteredIncoming.find((l) => l.id === u.id) &&
              !sentIds.includes(u.id) &&
              !skippedIds.includes(u.id),
          ),
        );

        const act = await getGlobalActivity();
        setActivity(act);

        setReady(true);
      } catch (err) {
        console.error(err);
      }
    }

    loadAll();
  }, [user]);

  // ===============================
  // SORT: MOST IN CIRCLE → LEAST
  // ===============================
  const sortedDiscover = useMemo(() => {
    if (!user) return discoverUsers;

    return [...discoverUsers].sort((a, b) => {
      const aScore = matchedIds.has(a.id) ? 1 : 0;
      const bScore = matchedIds.has(b.id) ? 1 : 0;
      return bScore - aScore;
    });
  }, [discoverUsers, matchedIds, user]);

  // ===============================
  // AUTH CHECK
  // ===============================
  function requireAuth() {
    if (!user) {
      router.push("/auth");
      return false;
    }
    return true;
  }

  async function handleLike(id: string) {
    if (!requireAuth()) return;

    const res = await likeUser(id);

    setIncomingLikes((prev) => prev.filter((u) => u.id !== id));
    setDiscoverUsers((prev) => prev.filter((u) => u.id !== id));

    if (res?.isMatch) {
      setMatchedIds((prev) => new Set(prev).add(id));
    }
  }

  async function handlePass(id: string) {
    if (!requireAuth()) return;

    const passed = discoverUsers.find((u) => u.id === id);

    if (passed) {
      await skipUser(id);
      setSkippedUsers((prev) => [passed, ...prev]);
    }

    setDiscoverUsers((prev) => prev.filter((u) => u.id !== id));
  }

  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-20 w-20 border-b-2 border-pink-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* YOUR CIRCLE */}
      {user && (
        <>
          <div className="px-4 pt-4">
            <h2 className="text-lg font-semibold mb-2">Your circle</h2>
          </div>

          <div className="overflow-x-auto border-b border-white/5">
            <div className="flex gap-4 px-4 py-3">
              {circleUsers.map((u) => (
                <Link
                  key={u.id}
                  href={`/profile/${u.username}`}
                  className="flex flex-col items-center min-w-[70px]"
                >
                  <UserAvatarBubble
                    src={u.avatar_url}
                    username={u.username}
                    size={80}
                  />
                  <p className="text-xs mt-1 text-center truncate w-full">
                    {u.full_name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* INCOMING */}
      {user && incomingLikes.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold mb-3">
            Interested in meeting you
          </h2>

          {incomingLikes.map((u) => (
            <ProfilePostCard
              key={u.id}
              user={u}
              onLike={handleLike}
              onPass={() =>
                setIncomingLikes((prev) => prev.filter((x) => x.id !== u.id))
              }
            />
          ))}
        </div>
      )}

      {/* ACTIVITY */}
      {user && activity.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold mb-3">Activity</h2>
          {activity.slice(0, 3).map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* DISCOVER */}
      {sortedDiscover.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold mb-4">
            Meet people in San Francisco
          </h2>

          <div className="space-y-6">
            {sortedDiscover.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  if (!user) router.push("/auth");
                }}
                className={!user ? "cursor-pointer" : ""}
              >
                <ProfilePostCard
                  user={u}
                  onLike={handleLike}
                  onPass={handlePass}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHOW INTERESTED */}
      {user && sentLikes.length > 0 && (
        <div className="px-4 mt-6">
          <button
            onClick={() => setShowSentLikes((prev) => !prev)}
            className="text-sm text-gray-500 underline mb-3"
          >
            {showSentLikes ? "Hide interested" : "Show interested"}
          </button>

          {showSentLikes &&
            sentLikes.map((u) => (
              <ProfilePostCard
                key={u.id}
                user={u}
                onLike={() => {}}
                onPass={() =>
                  setSentLikes((prev) => prev.filter((x) => x.id !== u.id))
                }
              />
            ))}
        </div>
      )}

      {/* NOT INTERESTED */}
      {user && skippedUsers.length > 0 && (
        <div className="px-4 mt-6 pb-20">
          <button
            onClick={() => setShowSkipped((prev) => !prev)}
            className="text-sm text-gray-500 underline mb-3"
          >
            {showSkipped ? "Hide not interested" : "Show not interested"}
          </button>

          {showSkipped &&
            skippedUsers.map((u) => (
              <ProfilePostCard
                key={u.id}
                user={u}
                onLike={handleLike}
                onPass={() =>
                  setSkippedUsers((prev) => prev.filter((x) => x.id !== u.id))
                }
              />
            ))}
        </div>
      )}
    </div>
  );
}
