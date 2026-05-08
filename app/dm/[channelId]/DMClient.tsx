"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGuestId } from "@/lib/hooks/useGuestId";
import QRCode from "react-qr-code";

export default function DMClient({ channelId }: { channelId: string }) {
  const supabase = createClient();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [plan, setPlan] = useState<any>(null);

  const [guestName, setGuestName] = useState("");
  const [guestAvatar, setGuestAvatar] = useState<string | null>(null);

  const [showInvite, setShowInvite] = useState(false);

  const guestId = useGuestId();
  const bottomRef = useRef<HTMLDivElement>(null);

  // LOAD PROFILE
  useEffect(() => {
    setGuestName(localStorage.getItem("guest_name") || "Guest");
    setGuestAvatar(localStorage.getItem("guest_avatar"));
  }, []);

  // LOAD PLAN
  async function loadPlan() {
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

  // 🔥 AUTO JOIN (THIS FIXES DUPLICATES + "join again")
  useEffect(() => {
    if (!guestId || !channelId) return;

    const join = async () => {
      await supabase
        .from("dm_participants")
        .insert({
          channel_id: channelId,
          guest_id: guestId,
          name: guestName || "Guest",
          avatar_url: guestAvatar || null,
        })
        .onConflict("channel_id,guest_id")
        .ignore();

      // refresh participants after joining
      loadPlan();
    };

    join();
  }, [guestId, channelId]);

  // LOAD MESSAGES
  async function loadMessages() {
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
    if (!input.trim()) return;

    const clientId = crypto.randomUUID();

    const tempMessage = {
      id: clientId,
      client_id: clientId,
      content: input,
      guest_id: guestId,
      sender_name: guestName,
      avatar_url: guestAvatar,
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
      return <img src={src} className="w-8 h-8 rounded-full object-cover" />;
    }

    return (
      <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs">
        {name?.[0]}
      </div>
    );
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const qrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/dm/${channelId}`
      : "";

  async function copyLink() {
    await navigator.clipboard.writeText(qrUrl);
    alert("Link copied");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* HEADER */}
      {plan && (
        <div className="p-3 border-b space-y-3">
          <h1 className="font-bold text-lg">{plan.title}</h1>

          {plan.starts_at && (
            <p className="text-sm text-gray-400">
              {(() => {
                const d = new Date(Number(plan.starts_at));
                const date = d.toLocaleDateString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const time = d.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                });
                return `${date} · ${time}`;
              })()}
            </p>
          )}

          {/* MAP + QR */}
          <div className="flex gap-3">
            {plan.location_name && (
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      plan.location_name,
                    )}`,
                    "_blank",
                  )
                }
                className="w-28 h-28"
              >
                <img
                  className="w-full h-full object-cover rounded-lg"
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${plan.lat},${plan.lng}&zoom=15&size=300x300&markers=color:red%7C${plan.lat},${plan.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                />
              </button>
            )}

            <button
              onClick={() => setShowInvite(true)}
              className="w-28 h-28 bg-white p-2 rounded-lg flex items-center justify-center"
            >
              <QRCode value={qrUrl} size={90} />
            </button>
          </div>

          {/* PARTICIPANTS */}
          <div className="flex gap-2">
            {plan.dm_participants?.map((p: any, i: number) => (
              <Avatar key={i} name={p.name} src={p.avatar_url} />
            ))}
          </div>

          <button
            onClick={() =>
              document
                .querySelector("input")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="text-sm text-blue-500"
          >
            Jump to messages ↓
          </button>
        </div>
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const mine = isMe(msg);

          return (
            <div
              key={msg.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div className="flex items-end gap-2">
                {!mine && (
                  <Avatar name={msg.sender_name} src={msg.avatar_url} />
                )}

                <div
                  className={`px-3 py-2 rounded-2xl max-w-[70%] text-sm ${
                    mine ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
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
      <div className="p-3 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded-full px-4 py-2"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded-full"
        >
          Send
        </button>
      </div>

      {/* INVITE MODAL */}
      {showInvite && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowInvite(false)}
        >
          <div
            className="bg-white p-6 rounded-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCode value={qrUrl} size={200} />

            <button
              onClick={copyLink}
              className="w-full bg-blue-500 text-white py-2 rounded"
            >
              Copy Link
            </button>

            <p className="text-center text-sm text-gray-500">
              Scan or share to invite
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
