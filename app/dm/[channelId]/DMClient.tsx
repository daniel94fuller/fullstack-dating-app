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

  const guestId = useGuestId();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGuestName(localStorage.getItem("guest_name") || "Guest");
    setGuestAvatar(localStorage.getItem("guest_avatar"));
  }, []);

  async function loadPlan() {
    const { data } = await supabase
      .from("dm_channels")
      .select(`*, dm_participants(name, avatar_url)`)
      .eq("id", channelId)
      .single();

    setPlan(data);
  }

  useEffect(() => {
    loadPlan();
  }, [channelId]);

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

  // =========================
  // 🔥 REALTIME (DEDUPED)
  // =========================
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
            // 🔥 dedupe by client_id
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

  // =========================
  // SEND MESSAGE (FIXED)
  // =========================
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

    // 🔥 optimistic
    setMessages((prev) => [...prev, tempMessage]);

    setInput("");

    const { error } = await supabase.from("dm_messages").insert({
      channel_id: channelId,
      content: tempMessage.content,
      guest_id: guestId,
      sender_name: guestName,
      avatar_url: guestAvatar,
      client_id: clientId,
    });

    if (error) {
      console.error("❌ INSERT FAILED:", error);
    }
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

  return (
    <div className="h-screen flex flex-col">
      {/* HEADER */}
      {plan && (
        <div className="p-4 border-b">
          <div className="flex justify-between">
            <h1 className="font-bold">{plan.title}</h1>
            <QRCode value={qrUrl} size={50} />
          </div>

          <div className="flex gap-2 mt-2">
            {plan.dm_participants?.map((p: any, i: number) => (
              <Avatar key={i} name={p.name} src={p.avatar_url} />
            ))}
          </div>
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
    </div>
  );
}
