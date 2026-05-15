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

  const [profileNameInput, setProfileNameInput] = useState("");
  const [profileAvatarPreview, setProfileAvatarPreview] = useState<
    string | null
  >(null);
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  const [channelId, setChannelId] = useState<string | null>(null);

  const guestId = useGuestId();
  const bottomRef = useRef<HTMLDivElement>(null);

  const profileComplete = Boolean(guestName.trim()) && Boolean(guestAvatar);

  // LOAD PROFILE
  useEffect(() => {
    const savedName = localStorage.getItem("guest_name") || "";
    const savedAvatar = localStorage.getItem("guest_avatar");

    const validSavedAvatar =
      savedAvatar && !savedAvatar.startsWith("data:") ? savedAvatar : null;

    setGuestName(savedName);
    setGuestAvatar(validSavedAvatar);

    setProfileNameInput(savedName);
    setProfileAvatarPreview(validSavedAvatar);

    if (!savedName.trim() || !validSavedAvatar) {
      setShowProfileSetup(true);
    }
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

  // AUTO JOIN ONLY AFTER PROFILE IS COMPLETE
  useEffect(() => {
    if (!guestId || !channelId || !profileComplete) return;

    const join = async () => {
      await supabase.from("dm_participants").upsert(
        {
          channel_id: channelId,
          guest_id: guestId,
          name: guestName.trim(),
          avatar_url: guestAvatar,
        },
        {
          onConflict: "channel_id,guest_id",
        } as any,
      );

      loadPlan();
    };

    join();
  }, [guestId, channelId, guestName, guestAvatar, profileComplete]);

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

  async function uploadGuestAvatar(file: File) {
    if (!guestId) {
      throw new Error("Missing guest ID");
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${guestId}/${fileName}`;

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

  async function saveGuestProfile() {
    const cleanName = profileNameInput.trim();

    if (!cleanName) {
      alert("Please add your name.");
      return;
    }

    if (!profileAvatarFile && !guestAvatar) {
      alert("Please add a photo.");
      return;
    }

    if (!guestId) {
      alert("Guest profile is still loading. Try again.");
      return;
    }

    setSavingProfile(true);

    try {
      let avatarUrl = guestAvatar;

      if (profileAvatarFile) {
        avatarUrl = await uploadGuestAvatar(profileAvatarFile);
      }

      if (!avatarUrl) {
        alert("Please add a photo.");
        return;
      }

      localStorage.setItem("guest_name", cleanName);
      localStorage.setItem("guest_avatar", avatarUrl);

      setGuestName(cleanName);
      setGuestAvatar(avatarUrl);
      setProfileAvatarPreview(avatarUrl);
      setProfileAvatarFile(null);
      setShowProfileSetup(false);

      if (channelId) {
        await supabase.from("dm_participants").upsert(
          {
            channel_id: channelId,
            guest_id: guestId,
            name: cleanName,
            avatar_url: avatarUrl,
          },
          {
            onConflict: "channel_id,guest_id",
          } as any,
        );

        loadPlan();
      }
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      alert(error?.message || "Could not save profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
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

  async function sendMessage() {
    if (!profileComplete) {
      setShowProfileSetup(true);
      return;
    }

    if (!input.trim() || !guestId || !channelId) return;

    const clientId = crypto.randomUUID();

    const tempMessage = {
      id: clientId,
      client_id: clientId,
      content: input,
      guest_id: guestId,
      sender_name: guestName.trim(),
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
      return (
        <img
          src={src}
          className="w-10 h-10 rounded-full object-cover border border-white/20"
          alt={name || "Guest avatar"}
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

  const planImageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/og/${slug}/image`
      : "";

  function getShareMessage() {
    const shareTitle = plan?.title || "Plan";

    const dateText = plan?.starts_at
      ? new Date(Number(plan.starts_at)).toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "";

    const locationText = plan?.location_name ? `📍 ${plan.location_name}` : "";

    return [
      `Join my plan: ${shareTitle}`,
      dateText ? `🗓 ${dateText}` : "",
      locationText,
      "",
      qrUrl,
    ]
      .filter((line) => line !== null && line !== undefined)
      .join("\n");
  }

  async function getPlanImageFile() {
    if (!planImageUrl) {
      throw new Error("Missing plan image URL");
    }

    const response = await fetch(planImageUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Could not load plan image");
    }

    const blob = await response.blob();

    return new File([blob], `${slug}-plan.png`, {
      type: "image/png",
    });
  }

  async function sharePlanImage() {
    const shareTitle = plan?.title || "Plan";
    const message = getShareMessage();

    try {
      const imageFile = await getPlanImageFile();

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [imageFile],
        })
      ) {
        await navigator.share({
          title: `${shareTitle} on Popcircle`,
          text: message,
          files: [imageFile],
        });

        return;
      }

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
      console.error("Share image failed:", error);

      try {
        await navigator.clipboard.writeText(message);
        alert("Plan copied");
      } catch {
        alert("Could not share plan");
      }
    }
  }

  async function copyPlanImage() {
    try {
      const imageFile = await getPlanImageFile();

      if (!navigator.clipboard || !window.ClipboardItem) {
        alert("Copy image is not supported here. Use Download Image instead.");
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": imageFile,
        }),
      ]);

      alert("Plan image copied");
    } catch (error) {
      console.error("Copy image failed:", error);
      alert("Could not copy image. Use Download Image instead.");
    }
  }

  function downloadPlanImage() {
    if (!planImageUrl) return;

    const link = document.createElement("a");
    link.href = planImageUrl;
    link.download = `${slug}-plan.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function copyPlanText() {
    try {
      await navigator.clipboard.writeText(getShareMessage());
      alert("Plan text copied");
    } catch {
      alert("Could not copy plan text");
    }
  }

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
                onClick={() => {
                  if (!profileComplete) {
                    setShowProfileSetup(true);
                    return;
                  }

                  setChatExpanded(!chatExpanded);
                }}
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

      {/* REQUIRED PROFILE SETUP MODAL */}
      {showProfileSetup && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[60] px-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div>
              <h2 className="text-2xl font-bold">Join this plan</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Add your name and photo so people know who is going.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <label className="cursor-pointer">
                {profileAvatarPreview ? (
                  <img
                    src={profileAvatarPreview}
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

              <p className="text-xs text-zinc-500">Tap to upload a photo</p>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300">
                Your name
              </label>

              <input
                value={profileNameInput}
                onChange={(e) => setProfileNameInput(e.target.value)}
                className="mt-2 w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 outline-none text-white"
                placeholder="Enter your name"
              />
            </div>

            <button
              onClick={saveGuestProfile}
              disabled={
                savingProfile ||
                !profileNameInput.trim() ||
                (!profileAvatarFile && !guestAvatar)
              }
              className="w-full bg-blue-600 disabled:bg-zinc-700 disabled:text-zinc-400 text-white py-3 rounded-2xl font-semibold"
            >
              {savingProfile ? "Joining..." : "Join Plan"}
            </button>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {showInvite && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
          onClick={() => setShowInvite(false)}
        >
          <div
            className="w-full max-w-md bg-zinc-900 border border-white/10 p-5 rounded-3xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
              {planImageUrl && (
                <img
                  src={planImageUrl}
                  alt="Plan share card"
                  className="w-full rounded-2xl"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={sharePlanImage}
                className="bg-blue-600 text-white py-3 rounded-2xl font-semibold"
              >
                Share Image
              </button>

              <button
                onClick={copyPlanImage}
                className="bg-zinc-800 text-white py-3 rounded-2xl font-semibold"
              >
                Copy Image
              </button>

              <button
                onClick={downloadPlanImage}
                className="col-span-2 bg-white text-black py-3 rounded-2xl font-semibold"
              >
                Download Image
              </button>

              <button
                onClick={copyPlanText}
                className="col-span-2 bg-zinc-800 text-white py-3 rounded-2xl font-semibold"
              >
                Copy Plan Text
              </button>
            </div>

            <div className="flex justify-center pt-1">
              <div className="bg-white p-3 rounded-2xl">
                <QRCode value={qrUrl} size={130} />
              </div>
            </div>

            <p className="text-center text-sm text-zinc-400">
              Share the image, download it, or scan the QR code to invite
              friends.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
