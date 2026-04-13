"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGuestId } from "@/lib/hooks/useGuestId";
import QRCode from "react-qr-code";

export default function DMClient({ channelId }: { channelId: string }) {
  const supabase = createClient();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<any>(null);
  const [guestName, setGuestName] = useState("");
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [otherTyping, setOtherTyping] = useState<boolean>(false);

  const guestId = useGuestId();
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // 🔥 LOAD USER
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", user.id)
          .single();

        setUser({
          id: user.id,
          name: profile?.name || "You",
          avatar: profile?.avatar_url || null,
        });

        setHasEnteredName(true);
      } else {
        const stored = localStorage.getItem("guest_name");
        if (stored) {
          setGuestName(stored);
          setHasEnteredName(true);
        }
      }
    }

    loadUser();
  }, []);

  // 🔥 JOIN PARTICIPANTS
  useEffect(() => {
    if (!channelId || !hasEnteredName) return;

    const name = user?.name || guestName;

    supabase.from("dm_participants").upsert({
      channel_id: channelId,
      user_id: user?.id || null,
      guest_id: user ? null : guestId,
      name,
      avatar_url: user?.avatar || null,
    });
  }, [channelId, hasEnteredName]);

  // 🔥 LOAD MESSAGES
  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from("dm_messages")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    }

    loadMessages();
  }, [channelId]);

  // 🔥 REALTIME
  useEffect(() => {
    if (!channelId) return;

    const channel = supabase.channel(`room-${channelId}`);
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const msg = payload.new;

          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        },
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        setOtherTyping(!!payload.payload.typing);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  // 🔥 AUTO SCROLL (FIXED)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  function isMe(msg: any) {
    return (
      (user && msg.sender_id === user.id) || (!user && msg.guest_id === guestId)
    );
  }

  async function sendMessage() {
    if (!input.trim()) return;

    await supabase.from("dm_messages").insert({
      channel_id: channelId,
      content: input,
      sender_id: user?.id || null,
      guest_id: user ? null : guestId,
      sender_name: user?.name || guestName,
    });

    setInput("");
    sendTyping(false);
  }

  // 🔥 TYPING
  function sendTyping(value: boolean) {
    if (!channelRef.current) return;

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { typing: value },
    });
  }

  function handleTyping(e: any) {
    setInput(e.target.value);

    sendTyping(true);

    setTimeout(() => {
      sendTyping(false);
    }, 1000);
  }

  function formatTime(date: string) {
    const d = new Date(date);
    return d.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function Avatar({ name }: any) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-xs text-white">
        {name?.[0]}
      </div>
    );
  }

  // 🔥 NAME SCREEN
  if (!hasEnteredName) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4 overflow-hidden">
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Your name"
          className="border px-4 py-2 rounded-full"
        />
        <button
          onClick={() => {
            localStorage.setItem("guest_name", guestName);
            setHasEnteredName(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-full"
        >
          Continue
        </button>
      </div>
    );
  }

  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dm/${channelId}`;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between p-3 border-b shrink-0">
        <div className="text-sm font-medium">Conversation</div>
        <QRCode value={qrUrl} size={50} />
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => {
          const mine = isMe(msg);

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
            >
              <div className="flex items-end gap-2">
                {!mine && <Avatar name={msg.sender_name} />}

                <div
                  className={`px-3 py-2 rounded-2xl max-w-[70%] text-sm ${
                    mine ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                  }`}
                >
                  {!mine && (
                    <div className="text-[10px] text-gray-500 mb-1">
                      {msg.sender_name}
                    </div>
                  )}
                  {msg.content}
                </div>

                {mine && <Avatar name={user?.name || guestName} />}
              </div>

              {/* 🔥 TIME */}
              <div className="text-[10px] text-gray-400 mt-1">
                {formatTime(msg.created_at)}
              </div>
            </div>
          );
        })}

        {/* 🔥 TYPING DOTS */}
        {otherTyping && (
          <div className="text-sm text-gray-400 flex gap-1 items-center">
            <span className="animate-bounce">.</span>
            <span className="animate-bounce delay-100">.</span>
            <span className="animate-bounce delay-200">.</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 border-t flex gap-2 shrink-0">
        <input
          value={input}
          onChange={handleTyping}
          className="flex-1 border rounded-full px-4 py-2 text-sm"
          placeholder="Message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded-full text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
