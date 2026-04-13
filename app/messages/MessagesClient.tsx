"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MessagesClient() {
  const supabase = createClient();
  const router = useRouter();

  const [channels, setChannels] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // 🔥 LOAD USER + CHANNELS
  useEffect(() => {
    async function load() {
      setLoadingUser(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("Loaded user:", user);

      if (!user) {
        setLoadingUser(false);
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("dm_channels")
        .select(
          `
          *,
          dm_participants (
            name,
            avatar_url
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Channel load error:", error);
      }

      setChannels(data || []);
      setLoadingUser(false);
    }

    load();
  }, []);

  // 🔥 CREATE CONVERSATION (FINAL FIX)
  async function createConversation() {
    if (!user) {
      console.log("❌ No user yet");
      return;
    }

    console.log("🔍 Checking existing conversation...");

    // 🔥 check existing self chat
    const { data: existing, error: fetchError } = await supabase
      .from("dm_channels")
      .select("*")
      .eq("user_1", user.id)
      .eq("user_2", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ fetch error:", fetchError);
      return;
    }

    if (existing) {
      console.log("✅ Found existing:", existing.id);
      router.push(`/dm/${existing.id}`);
      return;
    }

    console.log("🆕 Creating new conversation...");

    const { data, error } = await supabase
      .from("dm_channels")
      .insert({
        user_1: user.id,
        user_2: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ create error:", error);
      return;
    }

    console.log("✅ Created channel:", data.id);

    router.push(`/dm/${data.id}`);
  }

  function Avatar({ src, name }: any) {
    if (src) {
      return (
        <img className="w-10 h-10 rounded-full object-cover border" src={src} />
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm border">
        {name?.[0]}
      </div>
    );
  }

  function formatTime(date: string) {
    const d = new Date(date);
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="p-4 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Inbox</h1>

        <button
          onClick={() => {
            console.log("🟢 + New clicked");
            createConversation();
          }}
          disabled={!user || loadingUser}
          className="bg-blue-500 text-white px-4 py-2 rounded-full disabled:opacity-50"
        >
          + New
        </button>
      </div>

      {/* LOADING */}
      {loadingUser && <p className="text-gray-400">Loading...</p>}

      {/* CHANNELS */}
      {!loadingUser &&
        channels.map((c) => (
          <Link
            key={c.id}
            href={`/dm/${c.id}`}
            className="flex items-center gap-3 p-3 border rounded-lg"
          >
            <div className="flex -space-x-3">
              {c.dm_participants?.slice(0, 3).map((p: any, i: number) => (
                <Avatar key={i} src={p.avatar_url} name={p.name} />
              ))}
            </div>

            <div>
              <div className="text-sm font-medium">
                {c.dm_participants?.map((p: any) => p.name).join(", ") ||
                  "Conversation"}
              </div>

              <div className="text-xs text-gray-400">
                {formatTime(c.created_at)}
              </div>
            </div>
          </Link>
        ))}

      {!loadingUser && channels.length === 0 && (
        <p className="text-gray-400">No conversations yet</p>
      )}
    </div>
  );
}
