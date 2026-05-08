"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useGuestId } from "@/lib/hooks/useGuestId";

export default function Home() {
  const supabase = createClient();
  const guestId = useGuestId();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [guestName, setGuestName] = useState("");
  const [guestAvatar, setGuestAvatar] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // =========================
  // LOAD PLANS
  // =========================
  async function loadPlans() {
    const { data } = await supabase
      .from("dm_channels")
      .select(
        `
        *,
        dm_participants (
          user_id,
          guest_id,
          name,
          avatar_url
        )
      `,
      )
      .order("starts_at", { ascending: true })
      .limit(20);

    setPlans(data || []);
    setLoading(false);
  }

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    async function load() {
      const userPromise = supabase.auth.getUser();
      const plansPromise = loadPlans();

      const {
        data: { user },
      } = await userPromise;

      setUser(user);

      const storedName = localStorage.getItem("guest_name");
      const storedAvatar = localStorage.getItem("guest_avatar");

      if (storedName) setGuestName(storedName);
      if (storedAvatar) setGuestAvatar(storedAvatar);

      await plansPromise;
    }

    load();
  }, []);

  // =========================
  // SCROLL TRACKING
  // =========================
  function handleScroll() {
    if (!scrollRef.current) return;

    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.clientWidth;

    const index = Math.round(scrollLeft / width);
    setActiveIndex(index);
  }

  // =========================
  // JOIN PLAN
  // =========================
  async function joinPlan(planId: string) {
    const name = user?.user_metadata?.name || guestName || "Guest";
    const avatar = user?.user_metadata?.avatar_url || guestAvatar || null;

    await supabase.from("dm_participants").upsert({
      channel_id: planId,
      user_id: user?.id || null,
      guest_id: user ? null : guestId,
      name,
      avatar_url: avatar,
    });

    loadPlans();
  }

  // =========================
  // HELPERS
  // =========================
  function formatTime(date: string) {
    if (!date) return "No time set";

    return new Date(date).toLocaleString([], {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function isJoined(plan: any) {
    return plan.dm_participants?.some(
      (p: any) =>
        (user && p.user_id === user.id) || (!user && p.guest_id === guestId),
    );
  }

  function Avatar({ name, src }: any) {
    if (src) {
      return (
        <img
          src={src}
          className="w-16 h-16 rounded-full object-cover border border-white/20"
        />
      );
    }

    return (
      <div className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center text-lg border border-white/10">
        {name?.[0]}
      </div>
    );
  }

  // =========================
  // LOADING
  // =========================
  if (loading && plans.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-white/10 h-40 rounded-xl animate-pulse" />
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="p-4">
      {/* CAROUSEL */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 scrollbar-hide"
      >
        {plans.map((plan) => {
          const joined = isJoined(plan);
          const mainAvatar = plan.dm_participants?.find(
            (p: any) => p.avatar_url,
          );

          return (
            <div
              key={plan.id}
              className="min-w-full snap-center rounded-[28px] border border-white/10 bg-[#121418] px-5 py-6 text-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
            >
              {/* TOP */}
              <div>
                <h2 className="text-4xl font-bold tracking-tight">
                  {plan.title || "Plan"}
                </h2>

                <p className="mt-3 text-lg text-gray-400">
                  📅 {formatTime(plan.starts_at)}
                </p>
              </div>

              <div className="my-6 h-px bg-white/10" />

              {/* PARTICIPANTS */}
              <div className="grid grid-cols-3 items-center gap-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={mainAvatar?.name || plan.dm_participants?.[0]?.name}
                    src={
                      mainAvatar?.avatar_url ||
                      plan.dm_participants?.[0]?.avatar_url
                    }
                  />

                  <div>
                    <p className="text-sm text-gray-400">Hosted by</p>
                    <p className="text-xl font-semibold">
                      {mainAvatar?.name ||
                        plan.dm_participants?.[0]?.name ||
                        "Guest"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center border-x border-white/10 px-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {plan.dm_participants?.length || 0}
                    </p>
                    <p className="text-sm text-gray-400">going</p>
                  </div>
                </div>

                {/* ACTION */}
                <div className="flex justify-end">
                  {!joined ? (
                    <button
                      onClick={() => joinPlan(plan.id)}
                      className="rounded-full bg-black px-10 py-4 text-lg font-semibold text-white border border-white/10"
                    >
                      Join
                    </button>
                  ) : (
                    <Link
                      href={`/dm/${plan.slug || plan.id}`}
                      className="rounded-full bg-black px-10 py-4 text-lg font-semibold text-white border border-white/10"
                    >
                      Enter
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DOT INDICATORS */}
      <div className="flex justify-center mt-4 gap-2">
        {plans.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition ${
              i === activeIndex ? "bg-white" : "bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
