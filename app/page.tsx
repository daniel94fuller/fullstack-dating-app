"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGuestId } from "@/lib/hooks/useGuestId";
import QRCode from "react-qr-code";

export default function Home() {
  const supabase = createClient();
  const guestId = useGuestId();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [guestName, setGuestName] = useState("");
  const [guestAvatar, setGuestAvatar] = useState<string | null>(null);

  const [profileNameInput, setProfileNameInput] = useState("");
  const [profileAvatarPreview, setProfileAvatarPreview] = useState<
    string | null
  >(null);
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [chatExpanded, setChatExpanded] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [invitePlan, setInvitePlan] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  const activePlan = plans[activeIndex] || null;

  const currentName = user?.user_metadata?.name || guestName;
  const currentAvatar = user?.user_metadata?.avatar_url || guestAvatar;

  const profileComplete =
    Boolean(currentName?.trim()) && Boolean(currentAvatar);

  // =========================
  // HELPERS
  // =========================
  function parsePlanDate(value: string | number | null | undefined) {
    if (!value) return null;

    const numeric = Number(value);

    const date =
      !Number.isNaN(numeric) && String(value).trim() !== ""
        ? new Date(numeric)
        : new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return date;
  }

  function formatPlanDate(value: string | number | null | undefined) {
    const date = parsePlanDate(value);

    if (!date) {
      return {
        month: "TBD",
        day: "?",
        weekday: "Date TBD",
        time: "",
      };
    }

    return {
      month: date.toLocaleDateString([], {
        month: "short",
      }),
      day: date.toLocaleDateString([], {
        day: "numeric",
      }),
      weekday: date.toLocaleDateString([], {
        weekday: "long",
      }),
      time: date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  }

  function getPlanUrl(plan: any) {
    if (typeof window === "undefined") return "";

    return `${window.location.origin}/dm/${plan.slug || plan.id}`;
  }

  function isJoined(plan: any) {
    return plan.dm_participants?.some(
      (p: any) =>
        (user && p.user_id === user.id) || (!user && p.guest_id === guestId),
    );
  }

  function Avatar({
    name,
    src,
    size = "md",
  }: {
    name?: string;
    src?: string | null;
    size?: "sm" | "md" | "lg";
  }) {
    const sizeClass =
      size === "lg"
        ? "w-14 h-14 text-lg"
        : size === "sm"
          ? "w-9 h-9 text-sm"
          : "w-10 h-10 text-sm";

    if (src) {
      return (
        <img
          src={src}
          className={`${sizeClass} rounded-full object-cover border border-white/20`}
          alt={name || "Avatar"}
        />
      );
    }

    return (
      <div
        className={`${sizeClass} rounded-full bg-zinc-700 text-white flex items-center justify-center border border-white/10`}
      >
        {name?.[0] || "G"}
      </div>
    );
  }

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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      const storedName = localStorage.getItem("guest_name") || "";
      const storedAvatar = localStorage.getItem("guest_avatar");

      const validStoredAvatar =
        storedAvatar && !storedAvatar.startsWith("data:") ? storedAvatar : null;

      setGuestName(storedName);
      setGuestAvatar(validStoredAvatar);

      setProfileNameInput(storedName);
      setProfileAvatarPreview(validStoredAvatar);

      await loadPlans();
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
    setChatExpanded(false);
  }

  // =========================
  // LOAD ACTIVE PLAN MESSAGES
  // =========================
  useEffect(() => {
    if (!activePlan?.id || !isJoined(activePlan)) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      const { data } = await supabase
        .from("dm_messages")
        .select("*")
        .eq("channel_id", activePlan.id)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    }

    loadMessages();
  }, [activePlan?.id, guestId, user?.id]);

  // =========================
  // REALTIME FOR ACTIVE PLAN
  // =========================
  useEffect(() => {
    if (!activePlan?.id || !isJoined(activePlan)) return;

    const channel = supabase
      .channel(`home-room-${activePlan.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `channel_id=eq.${activePlan.id}`,
        },
        (payload) => {
          const newMsg = payload.new;

          setMessages((prev) => {
            if (
              newMsg.client_id &&
              prev.some((m) => m.client_id === newMsg.client_id)
            ) {
              return prev;
            }

            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePlan?.id, guestId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================
  // PROFILE PHOTO UPLOAD
  // =========================
  async function uploadGuestAvatar(file: File) {
    const ownerId = user?.id || guestId;

    if (!ownerId) {
      throw new Error("Missing guest ID");
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${ownerId}/${fileName}`;

    const { error } = await supabase.storage
      .from("guest-avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("guest-avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Please choose an image smaller than 5MB.");
      return;
    }

    setProfileAvatarFile(file);
    setProfileAvatarPreview(URL.createObjectURL(file));
  }

  async function saveProfileForJoin() {
    const cleanName = profileNameInput.trim() || currentName?.trim();

    if (!cleanName) {
      throw new Error("Please add your name.");
    }

    let avatarUrl = currentAvatar;

    if (profileAvatarFile) {
      avatarUrl = await uploadGuestAvatar(profileAvatarFile);
    }

    if (!avatarUrl) {
      throw new Error("Please add a photo.");
    }

    localStorage.setItem("guest_name", cleanName);
    localStorage.setItem("guest_avatar", avatarUrl);

    setGuestName(cleanName);
    setGuestAvatar(avatarUrl);
    setProfileNameInput(cleanName);
    setProfileAvatarPreview(avatarUrl);
    setProfileAvatarFile(null);

    return {
      name: cleanName,
      avatarUrl,
    };
  }

  // =========================
  // JOIN PLAN
  // =========================
  async function joinPlan(plan: any) {
    if (!guestId && !user?.id) {
      alert("Guest profile is still loading. Try again.");
      return;
    }

    setSavingProfile(true);

    try {
      const profile = await saveProfileForJoin();

      await supabase.from("dm_participants").upsert(
        {
          channel_id: plan.id,
          user_id: user?.id || null,
          guest_id: guestId,
          name: profile.name,
          avatar_url: profile.avatarUrl,
        },
        {
          onConflict: "channel_id,guest_id",
        } as any,
      );

      await loadPlans();
    } catch (error: any) {
      console.error("Could not join plan:", error);
      alert(error?.message || "Could not join plan. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  // =========================
  // CHAT
  // =========================
  async function sendMessage() {
    if (!activePlan?.id) return;

    if (!profileComplete) {
      alert("Please add your name and photo first.");
      return;
    }

    if (!input.trim() || !guestId) return;

    const clientId = crypto.randomUUID();

    const tempMessage = {
      id: clientId,
      client_id: clientId,
      content: input,
      guest_id: guestId,
      sender_name: currentName.trim(),
      avatar_url: currentAvatar,
      channel_id: activePlan.id,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInput("");

    await supabase.from("dm_messages").insert(tempMessage);
  }

  function isMe(msg: any) {
    return msg.guest_id === guestId;
  }

  // =========================
  // ACTIONS
  // =========================
  function addToCalendar(plan: any) {
    if (!plan?.starts_at) return;

    const start = parsePlanDate(plan.starts_at);
    if (!start) return;

    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const formatDate = (date: Date) =>
      date.toISOString().replace(/-|:|\.\d+/g, "");

    const url =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(plan.title || "Plan")}` +
      `&dates=${formatDate(start)}/${formatDate(end)}` +
      `&details=${encodeURIComponent("Join plan on Popcircle")}` +
      `&location=${encodeURIComponent(plan.location_name || "")}`;

    window.open(url, "_blank");
  }

  function openMaps(plan: any) {
    if (!plan?.location_name) return;

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        plan.location_name,
      )}`,
      "_blank",
    );
  }

  async function sharePlan(plan: any) {
    const planUrl = getPlanUrl(plan);
    const shareTitle = plan?.title || "Plan";

    const date = parsePlanDate(plan?.starts_at);

    const dateText = date
      ? date.toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "";

    const locationText = plan?.location_name ? `📍 ${plan.location_name}` : "";

    const details = [
      `Join my plan: ${shareTitle}`,
      dateText ? `🗓 ${dateText}` : "",
      locationText,
    ]
      .filter(Boolean)
      .join("\n");

    const message = `${details}\n\n${planUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${shareTitle} on Popcircle`,
          text: message,
        });

        return;
      }

      await navigator.clipboard.writeText(message);
      alert("Plan copied");
    } catch (error) {
      console.error("Share failed:", error);

      try {
        await navigator.clipboard.writeText(message);
        alert("Plan copied");
      } catch {
        alert("Could not copy plan");
      }
    }
  }

  async function addToHomeScreen() {
    alert(
      "On mobile:\n\nTap browser menu → 'Add to Home Screen' to save this plan.",
    );
  }

  // =========================
  // LOADING
  // =========================
  if (loading && plans.length === 0) {
    return (
      <div className="min-h-screen bg-black p-4 text-white">
        <div className="h-[520px] rounded-[32px] bg-white/10 animate-pulse" />
      </div>
    );
  }

  // =========================
  // EMPTY STATE
  // =========================
  if (!loading && plans.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">No plans yet</h1>
          <p className="text-zinc-400">Create a plan to get started.</p>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-screen overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {plans.map((plan) => {
          const joined = isJoined(plan);
          const dateParts = formatPlanDate(plan.starts_at);
          const planUrl = getPlanUrl(plan);

          return (
            <div
              key={plan.id}
              className="min-w-full h-screen snap-center overflow-y-auto bg-black"
            >
              {/* HERO / PLAN SCREEN */}
              <div className="border-b border-white/10">
                {plan.location_name && plan.lat && plan.lng ? (
                  <div className="relative h-60">
                    <img
                      className="w-full h-full object-cover"
                      src={`https://maps.googleapis.com/maps/api/staticmap?center=${plan.lat},${plan.lng}&zoom=13&size=1200x600&markers=color:red%7C${plan.lat},${plan.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                      alt={plan.location_name}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  </div>
                ) : (
                  <div className="relative h-48 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                  </div>
                )}

                <div className="p-5 space-y-5 -mt-20 relative z-10">
                  <div>
                    <h1 className="text-4xl font-bold leading-tight">
                      {plan.title || "Plan"}
                    </h1>

                    <div className="mt-5 space-y-3">
                      <div className="inline-flex items-center gap-4 rounded-3xl bg-white text-black px-5 py-4 shadow-lg">
                        <div className="text-center leading-none">
                          <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                            {dateParts.month}
                          </div>

                          <div className="text-4xl font-black tracking-tight">
                            {dateParts.day}
                          </div>
                        </div>

                        <div className="h-12 w-px bg-zinc-300" />

                        <div>
                          <div className="text-xl font-extrabold">
                            {dateParts.weekday}
                          </div>

                          <div className="text-lg font-semibold text-zinc-700">
                            {dateParts.time}
                          </div>
                        </div>
                      </div>

                      {plan.location_name && (
                        <p className="text-base font-medium text-zinc-300">
                          {plan.location_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* PEOPLE */}
                  <div>
                    <p className="text-green-400 font-semibold mb-3">
                      {plan.dm_participants?.length || 0} going
                    </p>

                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {plan.dm_participants?.length > 0 ? (
                        plan.dm_participants.map((p: any, i: number) => (
                          <Avatar
                            key={`${p.guest_id || p.user_id}-${i}`}
                            name={p.name}
                            src={p.avatar_url}
                            size="md"
                          />
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500">
                          Be the first to join.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* IF NOT JOINED: PREREQUISITE JOIN */}
                  {!joined && (
                    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5 space-y-5">
                      <div>
                        <h2 className="text-2xl font-bold">Join this plan</h2>
                        <p className="text-sm text-zinc-400 mt-1">
                          Add your name and photo so people know who is going.
                        </p>
                      </div>

                      {!profileComplete && (
                        <>
                          <div className="flex flex-col items-center gap-3">
                            <label className="cursor-pointer">
                              {profileAvatarPreview || currentAvatar ? (
                                <img
                                  src={profileAvatarPreview || currentAvatar}
                                  className="w-24 h-24 rounded-full object-cover border-2 border-white"
                                  alt="Profile preview"
                                />
                              ) : (
                                <div className="w-24 h-24 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 text-sm">
                                  Add Photo
                                </div>
                              )}

                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                              />
                            </label>

                            <p className="text-xs text-zinc-500">
                              Tap to upload a photo
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-zinc-300">
                              Your name
                            </label>

                            <input
                              value={profileNameInput}
                              onChange={(e) =>
                                setProfileNameInput(e.target.value)
                              }
                              className="mt-2 w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 outline-none text-white"
                              placeholder="Enter your name"
                            />
                          </div>
                        </>
                      )}

                      {profileComplete && (
                        <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 p-3 border border-white/10">
                          <Avatar
                            name={currentName}
                            src={currentAvatar}
                            size="lg"
                          />

                          <div>
                            <p className="text-sm text-zinc-400">Joining as</p>
                            <p className="text-lg font-semibold">
                              {currentName}
                            </p>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => joinPlan(plan)}
                        disabled={
                          savingProfile ||
                          (!profileComplete &&
                            !profileNameInput.trim() &&
                            !currentName?.trim()) ||
                          (!profileComplete &&
                            !profileAvatarFile &&
                            !currentAvatar)
                        }
                        className="w-full bg-blue-600 disabled:bg-zinc-700 disabled:text-zinc-400 text-white py-4 rounded-2xl font-semibold"
                      >
                        {savingProfile ? "Joining..." : "Join Plan"}
                      </button>
                    </div>
                  )}

                  {/* IF JOINED: FULL PLAN ACTIONS */}
                  {joined && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => addToCalendar(plan)}
                          className="bg-green-600 py-3 rounded-2xl font-semibold"
                        >
                          Add To Calendar
                        </button>

                        <button
                          onClick={addToHomeScreen}
                          className="bg-zinc-800 py-3 rounded-2xl font-semibold"
                        >
                          Add To Home Screen
                        </button>

                        <button
                          onClick={() => setChatExpanded(!chatExpanded)}
                          className="bg-blue-600 py-3 rounded-2xl font-semibold col-span-2"
                        >
                          {chatExpanded ? "Hide Chat" : "Open Chat"}
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => openMaps(plan)}
                          className="flex-1 bg-zinc-900 rounded-2xl overflow-hidden"
                        >
                          {plan.location_name && plan.lat && plan.lng ? (
                            <img
                              className="w-full h-32 object-cover"
                              src={`https://maps.googleapis.com/maps/api/staticmap?center=${plan.lat},${plan.lng}&zoom=15&size=600x300&markers=color:red%7C${plan.lat},${plan.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                              alt={plan.location_name}
                            />
                          ) : (
                            <div className="h-32 flex items-center justify-center text-zinc-500">
                              Open location
                            </div>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setInvitePlan(plan);
                            setShowInvite(true);
                          }}
                          className="w-32 bg-white rounded-2xl flex items-center justify-center"
                        >
                          <QRCode value={planUrl} size={90} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* CHAT */}
              {joined && chatExpanded && activePlan?.id === plan.id && (
                <>
                  <div className="px-4 py-5 space-y-4 pb-28">
                    {messages.map((msg) => {
                      const mine = isMe(msg);

                      return (
                        <div
                          key={msg.id || msg.client_id}
                          className={`flex ${
                            mine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div className="flex items-end gap-2 max-w-[85%]">
                            {!mine && (
                              <Avatar
                                name={msg.sender_name}
                                src={msg.avatar_url}
                              />
                            )}

                            <div
                              className={`px-4 py-3 rounded-3xl text-sm ${
                                mine
                                  ? "bg-blue-600 text-white"
                                  : "bg-zinc-800 text-white"
                              }`}
                            >
                              {msg.content}
                            </div>

                            {mine && (
                              <Avatar name={currentName} src={currentAvatar} />
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div ref={bottomRef} />
                  </div>

                  <div className="fixed bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-black">
                    <div className="flex gap-2">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-zinc-900 rounded-full px-5 py-3 outline-none text-white"
                        placeholder="Message..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") sendMessage();
                        }}
                      />

                      <button
                        onClick={sendMessage}
                        className="bg-blue-600 px-5 rounded-full font-semibold"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* DOT INDICATORS */}
      {plans.length > 1 && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
          {plans.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition ${
                i === activeIndex ? "bg-white" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      )}

      {/* INVITE MODAL */}
      {showInvite && invitePlan && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
          onClick={() => setShowInvite(false)}
        >
          <div
            className="bg-zinc-900 border border-white/10 p-6 rounded-3xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white p-3 rounded-2xl">
              <QRCode value={getPlanUrl(invitePlan)} size={200} />
            </div>

            <button
              onClick={() => sharePlan(invitePlan)}
              className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold"
            >
              Share Plan
            </button>

            <p className="text-center text-sm text-zinc-400">
              Scan or share to invite friends
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
