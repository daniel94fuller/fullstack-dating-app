"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Participant = {
  uid: number;
  name?: string;
  avatar?: string;
};

type ScoreData = {
  unique_viewers: number;
  watch_time: number;
  returns: number;
};

export default function RoomParticipants({
  participants,
  focusedUid,
  setFocusedUid,
  roomId,
  counts,
  onClickUser,
}: {
  participants: Participant[];
  focusedUid: number | null;
  setFocusedUid: (uid: number) => void;
  roomId?: string; // ✅ made optional
  counts?: Record<number, number>; // ✅ added (safe)
  onClickUser?: (uid: number) => void; // ✅ added (safe)
}) {
  const supabase = createClient();

  const [scores, setScores] = useState<Record<number, ScoreData>>({});

  const viewedRef = useRef<Set<number>>(new Set());
  const lastFocusedRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // ===============================
  // LOAD EXISTING
  // ===============================
  useEffect(() => {
    if (!roomId) return; // ✅ guard

    async function loadScores() {
      const { data } = await supabase
        .from("room_scores")
        .select("*")
        .eq("room_id", roomId);

      if (!data) return;

      const map: Record<number, ScoreData> = {};

      data.forEach((row: any) => {
        map[row.uid] = {
          unique_viewers: row.unique_viewers,
          watch_time: row.watch_time,
          returns: row.returns,
        };
      });

      setScores(map);
    }

    loadScores();
  }, [roomId]);

  // ===============================
  // REALTIME
  // ===============================
  useEffect(() => {
    if (!roomId) return; // ✅ guard

    const channel = supabase
      .channel("room_scores_" + roomId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_scores",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          const row = payload.new;

          setScores((prev) => ({
            ...prev,
            [row.uid]: {
              unique_viewers: row.unique_viewers,
              watch_time: row.watch_time,
              returns: row.returns,
            },
          }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // ===============================
  // UPDATE SCORE
  // ===============================
  async function updateScore(uid: number, updates: Partial<ScoreData>) {
    if (!roomId) return; // ✅ guard

    const existing = scores[uid] || {
      unique_viewers: 0,
      watch_time: 0,
      returns: 0,
    };

    const newData = {
      ...existing,
      ...updates,
    };

    setScores((prev) => ({
      ...prev,
      [uid]: newData,
    }));

    await supabase.from("room_scores").upsert({
      room_id: roomId,
      uid,
      unique_viewers: newData.unique_viewers,
      watch_time: newData.watch_time,
      returns: newData.returns,
      updated_at: new Date().toISOString(),
    });
  }

  // ===============================
  // TRACK FOCUS
  // ===============================
  useEffect(() => {
    if (!focusedUid) return;

    if (lastFocusedRef.current !== null) {
      const prevUid = lastFocusedRef.current;
      const duration = (Date.now() - startTimeRef.current) / 1000;

      if (duration >= 5) {
        updateScore(prevUid, {
          watch_time:
            (scores[prevUid]?.watch_time || 0) + Math.min(duration, 180),
        });
      }
    }

    startTimeRef.current = Date.now();

    const hasViewed = viewedRef.current.has(focusedUid);
    viewedRef.current.add(focusedUid);

    if (!hasViewed) {
      updateScore(focusedUid, {
        unique_viewers: (scores[focusedUid]?.unique_viewers || 0) + 1,
      });
    } else {
      updateScore(focusedUid, {
        returns: (scores[focusedUid]?.returns || 0) + 1,
      });
    }

    lastFocusedRef.current = focusedUid;
  }, [focusedUid]);

  // ===============================
  // SORT
  // ===============================
  const sortedParticipants = [...participants].sort((a, b) => {
    return (scores[b.uid]?.watch_time || 0) - (scores[a.uid]?.watch_time || 0);
  });

  // ===============================
  // UI
  // ===============================
  return (
    <div className="flex gap-4 w-full px-4 overflow-x-auto">
      {sortedParticipants.map((p) => {
        return (
          <div
            key={p.uid}
            onClick={() => {
              setFocusedUid(p.uid);
              onClickUser?.(p.uid); // ✅ safe optional
            }}
            className="flex flex-col items-center cursor-pointer flex-shrink-0"
          >
            <div className="relative">
              <img
                src={p.avatar || "/default-avatar.png"}
                className={`w-16 h-16 rounded-full object-cover border-2 ${
                  focusedUid === p.uid ? "border-white" : "border-transparent"
                }`}
              />
            </div>

            <div className="text-white text-xs mt-1 text-center whitespace-nowrap">
              {p.name || "User"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
