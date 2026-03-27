"use client";

import {
  LiveKitRoom,
  useTracks,
  VideoTrack,
  AudioTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import RoomParticipants from "./RoomParticipants";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

// ===============================
// 🎬 TIKTOK LAYOUT (STABLE)
// ===============================
function TikTokLayout({
  focusedUserId,
  setFocusedUserId,
}: {
  focusedUserId: string | null;
  setFocusedUserId: (id: string) => void;
}) {
  const tracks = useTracks([Track.Source.Camera]);
  const supabase = createClient();
  const [profiles, setProfiles] = useState<any>({});

  // 🔥 LOAD PROFILES (simple + stable)
  useEffect(() => {
    async function loadProfiles() {
      const ids = tracks.map((t) => t.participant.identity);
      if (ids.length === 0) return;

      const { data } = await supabase
        .from("users")
        .select("id, full_name, avatar_url")
        .in("id", ids);

      if (data) {
        const map: any = {};
        data.forEach((u) => (map[u.id] = u));
        setProfiles(map);
      }
    }

    loadProfiles();
  }, [tracks]);

  // 🔥 DEFAULT FOCUS
  useEffect(() => {
    if (!focusedUserId && tracks.length > 0) {
      setFocusedUserId(tracks[0].participant.identity);
    }
  }, [tracks, focusedUserId]);

  // 🔥 RESET IF USER LEAVES
  useEffect(() => {
    if (!focusedUserId) return;

    const exists = tracks.some((t) => t.participant.identity === focusedUserId);

    if (!exists && tracks.length > 0) {
      setFocusedUserId(tracks[0].participant.identity);
    }
  }, [tracks, focusedUserId]);

  // 🔥 FILTER VALID TRACKS (fixes stale participant bug)
  const validTracks = tracks.filter((t) => t.participant && t.publication);

  const focusedTrack = validTracks.find(
    (t) => t.participant.identity === focusedUserId,
  );

  const profile = focusedTrack
    ? profiles[focusedTrack.participant.identity]
    : null;

  return (
    <div className="h-screen w-full bg-black relative">
      {/* 🎥 VIDEO */}
      {focusedTrack?.publication?.track && (
        <VideoTrack
          trackRef={focusedTrack}
          className="h-full w-full object-cover"
        />
      )}

      {/* 👤 USER INFO */}
      {profile && (
        <div className="absolute bottom-24 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-2 rounded-full">
          <img
            src={profile.avatar_url || "/default-avatar.png"}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-white text-sm font-medium max-w-[120px] truncate">
            {profile.full_name}
          </span>
        </div>
      )}
    </div>
  );
}

// ===============================
// 🔊 AUDIO (FIXED)
// ===============================
function AudioRenderer() {
  const audioTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: false }, // 🔥 CRITICAL FIX
  );

  return (
    <>
      {audioTracks.map((trackRef) => {
        if (!trackRef.publication?.track) return null;

        return (
          <AudioTrack key={trackRef.publication.trackSid} trackRef={trackRef} />
        );
      })}
    </>
  );
}

// ===============================
// 🎥 ROOM INNER (LOCKED)
// ===============================
function VideoRoomInner({ token }: { token: string }) {
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);

  if (!token) return null;

  return (
    <LiveKitRoom
      key={token} // 🔥 prevents duplicate engines
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      video={true}
      audio={true}
      className="h-screen w-full bg-black"
    >
      <AudioRenderer />

      <TikTokLayout
        focusedUserId={focusedUserId}
        setFocusedUserId={setFocusedUserId}
      />

      <div className="fixed bottom-4 left-4 z-[9999] max-w-[80%]">
        <RoomParticipants
          focusedUserId={focusedUserId}
          setFocusedUserId={setFocusedUserId}
        />
      </div>
    </LiveKitRoom>
  );
}

// ===============================
// 🚫 HYDRATION FIX
// ===============================
export default function VideoRoom({ token }: { token: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <VideoRoomInner token={token} />;
}
