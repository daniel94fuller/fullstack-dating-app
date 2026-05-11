"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGuestId } from "@/lib/hooks/useGuestId";
import QRCode from "react-qr-code";

export default function DMClient({ slug }: { slug: string }) {
  const supabase = createClient();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [plan, setPlan] = useState<any>(null);

  const [guestName, setGuestName] = useState("");
  const [guestAvatar, setGuestAvatar] = useState<string | null>(null);

  const [showInvite, setShowInvite] = useState(false);

  // ✅ NEW
  const [chatExpanded, setChatExpanded] = useState(false);

  const [channelId, setChannelId] = useState<string | null>(null);

  const guestId = useGuestId();
  const bottomRef = useRef<HTMLDivElement>(null);

  // LOAD PROFILE
  useEffect(() => {
    setGuestName(localStorage.getItem("guest_name") || "Guest");
    setGuestAvatar(localStorage.getItem("guest_avatar"));
  }, []);

  // RESOLVE SLUG
  useEffect(() => {
    if (!slug) return;

    const resolve = async () => {
      const { data } = await supabase
        .from("dm_channels")
        .select("id")
        .eq("slug", slug)
        .single();

      if (data?.id) {
        setChannelId(data.id);
      }
    };

    resolve();
  }, [slug]);

  // LOAD PLAN
  async function loadPlan() {
    if (!channelId) return;

    const { data } = await supabase
      .from("dm_channels")
      .select(`*, dm_participants(name, avatar_url, guest_id)`)
      .eq("id", channelId)
      .single();

    setPlan(data);
  }

  useEffect(() => {
    loadPlan();
  }, [channelId]);

  // AUTO JOIN
  useEffect(() => {
    if (!guestId || !channelId) return;

    const join = async () => {
      await supabase.from("dm_participants").upsert(
        {
          channel_id: channelId,
          guest_id: guestId,
          name: guestName || "Guest",
          avatar_url: guestAvatar || null,
        },
        {
          onConflict: "channel_id,guest_id",
          ignoreDuplicates: true,
        } as any,
      );

      loadPlan();
    };

    join();
  }, [guestId, channelId, guestName, guestAvatar]);

  // LOAD MESSAGES
  async function loadMessages() {
    if (!channelId) return;

    const { data } = await supabase
      .from("dm_messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  }

  useEffect(() => {
    loadMessages();
  }, [channelId]);

  // REALTIME
  useEffect(() => {
    if (!channelId) return;

    const channel = supabase
      .channel(`room-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `channel_id=eq.${channelId}`,
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
  }, [channelId]);

  async function sendMessage() {
    if (!input.trim() || !guestId || !channelId) return;

    const clientId = crypto.randomUUID();

    const tempMessage = {
      id: clientId,
      client_id: clientId,
      content: input,
      guest_id: guestId,
      sender_name: guestName || "Guest",
      avatar_url: guestAvatar || null,
      channel_id: channelId,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInput("");

    await supabase.from("dm_messages").insert(tempMessage);
  }

  function isMe(msg: any) {
    return msg.guest_id === guestId;
  }

  function Avatar({ name, src }: any) {
    if (src) {
      return (
        <img
          src={src}
          className="w-10 h-10 rounded-full object-cover border border-white/20"
        />
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-zinc-700 text-white flex items-center justify-center text-sm">
        {name?.[0] || "G"}
      </div>
    );
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const qrUrl =
    typeof window !== "undefined" ? `${window.location.origin}/dm/${slug}` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(qrUrl);
    alert("Link copied");
  }

  // ✅ ADD TO CALENDAR
  function addToCalendar() {
    if (!plan?.starts_at) return;

    const start = new Date(Number(plan.starts_at));
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

  // ✅ ADD TO HOME SCREEN
  async function addToHomeScreen() {
    alert(
      "On mobile:\n\nTap browser menu → 'Add to Home Screen' to save this plan.",
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* HEADER */}
      {plan && (
        <div className="border-b border-white/10">
          {/* HERO MAP */}
          {plan.location_name && plan.lat && plan.lng && (
            <div className="relative h-60">
              <img
                className="w-full h-full object-cover"
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${plan.lat},${plan.lng}&zoom=13&size=1200x600&markers=color:red%7C${plan.lat},${plan.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                alt={plan.location_name}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
          )}

          {/* PLAN CONTENT */}
          <div className="p-5 space-y-5 -mt-20 relative z-10">
            <div>
              <h1 className="text-4xl font-bold leading-tight">{plan.title}</h1>

              {plan.starts_at && (
                <div className="mt-5 space-y-3">
                  <div className="inline-flex items-center gap-4 rounded-3xl bg-white text-black px-5 py-4 shadow-lg">
                    <div className="text-center leading-none">
                      <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        {new Date(Number(plan.starts_at)).toLocaleDateString(
                          [],
                          {
                            month: "short",
                          },
                        )}
                      </div>

                      <div className="text-4xl font-black tracking-tight">
                        {new Date(Number(plan.starts_at)).toLocaleDateString(
                          [],
                          {
                            day: "numeric",
                          },
                        )}
                      </div>
                    </div>

                    <div className="h-12 w-px bg-zinc-300" />

                    <div>
                      <div className="text-xl font-extrabold">
                        {new Date(Number(plan.starts_at)).toLocaleDateString(
                          [],
                          {
                            weekday: "long",
                          },
                        )}
                      </div>

                      <div className="text-lg font-semibold text-zinc-700">
                        {new Date(Number(plan.starts_at)).toLocaleTimeString(
                          [],
                          {
                            hour: "numeric",
                            minute: "2-digit",
                          },
                        )}
                      </div>
                    </div>
                  </div>

                  {plan.location_name && (
                    <p className="text-base font-medium text-zinc-300">
                      {plan.location_name}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* PEOPLE */}
            <div>
              <p className="text-green-400 font-semibold mb-3">
                {plan.dm_participants?.length || 0} going
              </p>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {plan.dm_participants?.map((p: any, i: number) => (
                  <Avatar
                    key={`${p.guest_id}-${i}`}
                    name={p.name}
                    src={p.avatar_url}
                  />
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={addToCalendar}
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

            {/* QR + SHARE */}
            <div className="flex gap-3">
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      plan.location_name,
                    )}`,
                    "_blank",
                  )
                }
                className="flex-1 bg-zinc-900 rounded-2xl overflow-hidden"
              >
                {plan.location_name && plan.lat && plan.lng && (
                  <img
                    className="w-full h-32 object-cover"
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${plan.lat},${plan.lng}&zoom=15&size=600x300&markers=color:red%7C${plan.lat},${plan.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                    alt={plan.location_name}
                  />
                )}
              </button>

              <button
                onClick={() => setShowInvite(true)}
                className="w-32 bg-white rounded-2xl flex items-center justify-center"
              >
                <QRCode value={qrUrl} size={90} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT */}
      {chatExpanded && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.map((msg) => {
              const mine = isMe(msg);

              return (
                <div
                  key={msg.id || msg.client_id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {!mine && (
                      <Avatar name={msg.sender_name} src={msg.avatar_url} />
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

                    {mine && <Avatar name={guestName} src={guestAvatar} />}
                  </div>
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="p-3 border-t border-white/10 bg-black">
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

      {/* INVITE MODAL */}
      {showInvite && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowInvite(false)}
        >
          <div
            className="bg-zinc-900 border border-white/10 p-6 rounded-3xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white p-3 rounded-2xl">
              <QRCode value={qrUrl} size={200} />
            </div>

            <button
              onClick={copyLink}
              className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold"
            >
              Copy Invite Link
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
