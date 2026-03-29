"use client";

import { LiveKitRoom, useTracks, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import RoomParticipants from "./RoomParticipants";
import { useEffect, useState } from "react";

// ===============================
// 🔊 AUDIO (FINAL FIX)
// ===============================
function AudioRenderer() {
  const audioTracks = useTracks(
    [{ source: Track.Source.Microphone }],
    { onlySubscribed: true }, // 🔥 IMPORTANT
  );

  return (
    <>
      {audioTracks.map((trackRef) => {
        const track = trackRef.publication?.track;

        // 🔥 HARD FILTER
        if (!track || track.kind !== "audio" || !track.mediaStreamTrack) {
          return null;
        }

        return (
          <audio
            key={trackRef.publication.trackSid}
            ref={(el) => {
              if (!el) return;

              try {
                const stream = new MediaStream([track.mediaStreamTrack]);

                el.srcObject = stream;
                el.autoplay = true;
                el.playsInline = true;
                el.muted = false;

                el.onloadedmetadata = () => {
                  el.play().catch(() => {});
                };
              } catch (err) {
                console.error("audio error:", err);
              }
            }}
          />
        );
      })}
    </>
  );
}

// ===============================
// 🎬 VIDEO
// ===============================
function VideoLayout({
  focusedUserId,
  setFocusedUserId,
}: {
  focusedUserId: string | null;
  setFocusedUserId: (id: string) => void;
}) {
  const tracks = useTracks([Track.Source.Camera]);

  useEffect(() => {
    if (!focusedUserId && tracks.length > 0) {
      setFocusedUserId(tracks[0].participant.identity);
    }
  }, [tracks, focusedUserId]);

  const focusedTrack = tracks.find(
    (t) => t.participant.identity === focusedUserId,
  );

  return (
    <div className="h-full w-full bg-black relative">
      {focusedTrack?.publication?.track && (
        <VideoTrack
          trackRef={focusedTrack}
          className="h-full w-full object-cover"
          playsInline
          muted
        />
      )}

      {focusedTrack && (
        <div className="absolute bottom-24 right-4 bg-black/40 px-3 py-2 rounded-full">
          <span className="text-white text-sm">
            {focusedTrack.participant.identity}
          </span>
        </div>
      )}
    </div>
  );
}

// ===============================
// 🎥 ROOM
// ===============================
function VideoRoomInner({ token }: { token: string }) {
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  if (!token) return null;

  if (!joined) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center">
        <button
          onClick={() => setJoined(true)}
          className="bg-white text-black px-6 py-3 rounded-full"
        >
          Join Call
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      audio={true}
      video={true}
      className="h-full w-full bg-black"
    >
      {/* 🔥 OUR CUSTOM AUDIO */}
      <AudioRenderer />

      <VideoLayout
        focusedUserId={focusedUserId}
        setFocusedUserId={setFocusedUserId}
      />

      <div className="fixed bottom-4 left-4">
        <RoomParticipants
          focusedUserId={focusedUserId}
          setFocusedUserId={setFocusedUserId}
        />
      </div>
    </LiveKitRoom>
  );
}

// ===============================
// HYDRATION FIX
// ===============================
export default function VideoRoom({ token }: { token: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return <VideoRoomInner token={token} />;
}
