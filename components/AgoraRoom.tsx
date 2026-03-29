"use client";

import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { createClient } from "@/lib/supabase/client";
import RoomParticipants from "./RoomParticipants";

type Participant = {
  uid: number;
  name?: string;
  avatar?: string;
  videoTrack?: any;
  audioTrack?: any;
};

export default function AgoraRoom({
  channel,
  uid,
}: {
  channel: string;
  uid: string;
}) {
  const supabase = createClient();

  const clientRef = useRef<any>(null);
  const videoRef = useRef<HTMLDivElement | null>(null);
  const localTracksRef = useRef<any>({});
  const subRef = useRef<any>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [focusedUid, setFocusedUid] = useState<number | null>(null);
  const [joined, setJoined] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [counts, setCounts] = useState<Record<number, number>>({});

  const [micDevices, setMicDevices] = useState<any[]>([]);
  const [selectedMic, setSelectedMic] = useState<string | null>(null);

  const [activeSpeaker, setActiveSpeaker] = useState<number | null>(null);

  const participantsRef = useRef<Participant[]>([]);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  function uuidToNumber(uuid: string) {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      hash = (hash << 5) - hash + uuid.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  const sessionUidRef = useRef<number>(uuidToNumber(uid));
  const sessionUid = sessionUidRef.current;

  const upsertParticipant = (p: Partial<Participant> & { uid: number }) => {
    setParticipants((prev) => {
      const exists = prev.find((x) => x.uid === p.uid);
      if (exists) {
        return prev.map((x) => (x.uid === p.uid ? { ...x, ...p } : x));
      }
      return [...prev, p as Participant];
    });
  };

  const switchVideo = (uid: number) => {
    const p = participantsRef.current.find((x) => x.uid === uid);
    if (!p?.videoTrack || !videoRef.current) return;

    videoRef.current.innerHTML = "";

    p.videoTrack.play(videoRef.current, { fit: "cover" });

    const videoEl = videoRef.current.querySelector("video");
    if (videoEl) {
      videoEl.setAttribute("playsinline", "true");
      videoEl.setAttribute("webkit-playsinline", "true");
    }
  };

  useEffect(() => {
    if (focusedUid !== null) switchVideo(focusedUid);
  }, [focusedUid]);

  const playAudio = (track: any) => {
    const el = document.createElement("audio");
    el.autoplay = true;
    el.playsInline = true;
    el.muted = false;

    el.srcObject = new MediaStream([track.getMediaStreamTrack()]);
    document.body.appendChild(el);

    el.play().catch(() => {});
  };

  // ===============================
  // 🔥 LEAVE (UPDATED)
  // ===============================
  const leave = async () => {
    const { mic, cam } = localTracksRef.current;

    mic?.stop();
    mic?.close();
    cam?.stop();
    cam?.close();

    await clientRef.current?.leave();

    if (subRef.current) {
      await supabase.removeChannel(subRef.current);
    }

    const { data: roomBefore } = await supabase
      .from("rooms")
      .select("active_count")
      .eq("id", channel)
      .single();

    const newCount = Math.max((roomBefore?.active_count || 1) - 1, 0);

    const { error: updateError } = await supabase
      .from("rooms")
      .update({ active_count: newCount })
      .eq("id", channel);

    console.log("update active_count:", newCount, updateError);

    if (newCount === 0) {
      console.log("🧹 deleting room:", channel);

      const { error: deleteError } = await supabase
        .from("rooms")
        .delete()
        .eq("id", channel);

      console.log("delete result:", deleteError);
    }

    setParticipants([]);
    setJoined(false);
  };

  const handleClickUser = (uid: number) => {
    setCounts((prev) => ({
      ...prev,
      [uid]: (prev[uid] || 0) + 1,
    }));

    subRef.current?.send({
      type: "broadcast",
      event: "click",
      payload: { uid },
    });
  };

  const toggleMute = () => {
    const { mic } = localTracksRef.current;
    if (!mic) return;

    mic.setEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const { mic } = localTracksRef.current;

      if (mic?.getVolumeLevel) {
        const level = mic.getVolumeLevel();
        setVolume(level);
        if (level > 0.05) setActiveSpeaker(sessionUid);
      }

      participantsRef.current.forEach((p) => {
        if (p.audioTrack?.getVolumeLevel) {
          const level = p.audioTrack.getVolumeLevel();
          if (level > 0.05) setActiveSpeaker(p.uid);
        }
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const switchMic = async (deviceId: string) => {
    const newMic = await AgoraRTC.createMicrophoneAudioTrack({
      microphoneId: deviceId,
      AEC: true,
      ANS: false,
      AGC: true,
    });

    const { mic } = localTracksRef.current;

    await clientRef.current.unpublish([mic]);
    mic.stop();
    mic.close();

    localTracksRef.current.mic = newMic;

    await clientRef.current.publish([newMic]);

    setSelectedMic(deviceId);
  };

  const join = async () => {
    try {
      const rawStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      const audio = document.createElement("audio");
      audio.srcObject = rawStream;
      audio.muted = true;
      await audio.play().catch(() => {});

      await new Promise((r) => setTimeout(r, 300));

      rawStream.getTracks().forEach((t) => t.stop());

      const client = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });

      clientRef.current = client;

      const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { AEC: true, ANS: false, AGC: true },
        { encoderConfig: "720p" },
      );

      localTracksRef.current = { mic, cam };

      const [tokenRes, usersRes] = await Promise.all([
        fetch(`/api/agora-token?channel=${channel}&uid=${sessionUid}`),
        supabase.from("users").select("id, full_name, avatar_url"),
      ]);

      const { token } = await tokenRes.json();
      const { data: users } = usersRes;

      const userMap: Record<number, any> = {};
      users?.forEach((u) => {
        userMap[uuidToNumber(u.id)] = u;
      });

      await client.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        channel,
        token,
        sessionUid,
      );

      await mic.setEnabled(true);
      await client.publish([mic, cam]);

      await supabase.rpc("increment_room_count", {
        room_id_input: channel,
      });

      const devices = await AgoraRTC.getDevices();
      const mics = devices.filter((d: any) => d.kind === "audioinput");
      setMicDevices(mics);
      if (mics[0]) setSelectedMic(mics[0].deviceId);

      const sub = supabase.channel(`room:${channel}`);
      sub.on("broadcast", { event: "click" }, (payload: any) => {
        const { uid } = payload.payload;
        setCounts((prev) => ({
          ...prev,
          [uid]: (prev[uid] || 0) + 1,
        }));
      });
      sub.subscribe();
      subRef.current = sub;

      client.remoteUsers.forEach(async (user: any) => {
        if (user.hasVideo) await client.subscribe(user, "video");

        if (user.hasAudio) {
          await client.subscribe(user, "audio");
          playAudio(user.audioTrack);
        }

        const profile = userMap[user.uid];

        upsertParticipant({
          uid: user.uid,
          name: profile?.full_name || "User",
          avatar: profile?.avatar_url || "/default-avatar.png",
          videoTrack: user.videoTrack,
          audioTrack: user.audioTrack,
        });
      });

      client.on("user-published", async (user: any, type: any) => {
        await client.subscribe(user, type);

        if (type === "audio") playAudio(user.audioTrack);

        const profile = userMap[user.uid];

        upsertParticipant({
          uid: user.uid,
          name: profile?.full_name || "User",
          avatar: profile?.avatar_url || "/default-avatar.png",
          videoTrack: user.videoTrack,
          audioTrack: user.audioTrack,
        });
      });

      client.on("user-left", (user: any) => {
        setParticipants((prev) => prev.filter((p) => p.uid !== user.uid));
      });

      const me = userMap[sessionUid];

      upsertParticipant({
        uid: sessionUid,
        name: me?.full_name || "You",
        avatar: me?.avatar_url || "/default-avatar.png",
        videoTrack: cam,
        audioTrack: mic,
      });

      setFocusedUid(sessionUid);
      setJoined(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (!joined) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <button onClick={join}>Join Call</button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black relative">
      <div className="h-full w-full flex items-center justify-center">
        <div
          ref={videoRef}
          className="h-full aspect-[9/16] max-h-screen bg-black"
        />
      </div>

      <div className="absolute bottom-4 w-full">
        {/* 🔥 ACTIVE SPEAKER OVERLAY */}
        {activeSpeaker !== null &&
          (() => {
            const speaker = participants.find((p) => p.uid === activeSpeaker);
            if (!speaker) return null;

            return (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 bg-black/70 px-3 py-2 rounded-full backdrop-blur">
                  <img
                    src={speaker.avatar || "/default-avatar.png"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-white text-sm font-medium">
                    {speaker.name || "User"} is speaking
                  </span>
                </div>
              </div>
            );
          })()}
        <RoomParticipants
          participants={participants}
          focusedUid={focusedUid}
          setFocusedUid={setFocusedUid}
          counts={counts}
          onClickUser={handleClickUser}
        />
      </div>

      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <button
          onClick={toggleMute}
          className="bg-black/70 px-4 py-2 text-white rounded-lg"
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>

        <select
          value={selectedMic || ""}
          onChange={(e) => switchMic(e.target.value)}
          className="bg-black text-white px-2 py-1 rounded"
        >
          {micDevices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || "Mic"}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={leave}
        className="absolute top-4 right-4 bg-red-500 px-4 py-2 text-white rounded-lg"
      >
        Leave
      </button>

      <div className="absolute bottom-24 left-4 text-white text-sm">
        🎤 Volume: {volume.toFixed(3)}
      </div>
    </div>
  );
}
