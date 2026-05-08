"use client";

import Logo from "./Logo";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useGuestId } from "@/lib/hooks/useGuestId";

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const guestId = useGuestId();

  const [showProfile, setShowProfile] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [guestAvatar, setGuestAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const MAP_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  useEffect(() => {
    const storedName = localStorage.getItem("guest_name");
    const storedAvatar = localStorage.getItem("guest_avatar");

    if (storedName) setGuestName(storedName);
    if (storedAvatar) setGuestAvatar(storedAvatar);
  }, []);

  useEffect(() => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedHour((now.getHours() + 1) % 24);
  }, []);

  function getNextDays(count = 14) {
    const days = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      days.push(d);
    }

    return days;
  }

  async function geocodeLocation() {
    if (!location.trim() || !MAP_KEY) return null;

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          location,
        )}&key=${MAP_KEY}`,
      );

      const data = await res.json();
      const result = data.results?.[0];

      if (!result) return null;

      const lat = result.geometry.location.lat;
      const lng = result.geometry.location.lng;

      return {
        lat,
        lng,
        formattedAddress: result.formatted_address || location,
      };
    } catch (error) {
      console.error("Geocode error:", error);
      return null;
    }
  }

  async function handleImage(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, file);

    if (error) {
      console.error(error);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

    setGuestAvatar(data.publicUrl);
    setUploading(false);
  }

  function saveProfile() {
    if (!guestName) return;

    localStorage.setItem("guest_name", guestName);

    if (guestAvatar) {
      localStorage.setItem("guest_avatar", guestAvatar);
    }

    setShowProfile(false);
  }

  async function createPlan() {
    if (!title || !guestId) return;

    let startsAt = null;

    if (selectedDate && selectedHour !== null) {
      const d = new Date(selectedDate);
      d.setHours(selectedHour, 0, 0, 0);
      startsAt = d.getTime();
    }

    let finalLocation = location || null;
    let finalLat = coords?.lat || null;
    let finalLng = coords?.lng || null;

    if (location.trim()) {
      const geo = await geocodeLocation();

      if (geo) {
        finalLocation = geo.formattedAddress;
        finalLat = geo.lat;
        finalLng = geo.lng;
        setCoords({ lat: geo.lat, lng: geo.lng });
      }
    }

    const { data, error } = await supabase
      .from("dm_channels")
      .insert({
        title,
        location_name: finalLocation,
        lat: finalLat,
        lng: finalLng,
        starts_at: startsAt,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Create plan error:", error);
      return;
    }

    await supabase.from("dm_participants").upsert(
      {
        channel_id: data.id,
        guest_id: guestId,
        name: guestName || "Guest",
        avatar_url: guestAvatar || null,
      },
      {
        onConflict: "channel_id,guest_id",
        ignoreDuplicates: true,
      },
    );

    setShowCreate(false);
    setTitle("");
    setLocation("");
    setCoords(null);

    router.push(`/dm/${data.id}`);
  }

  return (
    <>
      <nav className="border-b border-white/10">
        <div className="flex justify-between items-center h-16 px-4">
          <Logo />

          <div className="flex items-center gap-3">
            <button onClick={() => setShowProfile(true)}>
              {guestAvatar ? (
                <img
                  src={guestAvatar}
                  className="w-10 h-10 rounded-full object-cover"
                  alt="Profile"
                />
              ) : (
                "👤"
              )}
            </button>

            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-500 px-4 py-2 rounded-full text-white"
            >
              + Make Plan
            </button>
          </div>
        </div>
      </nav>

      {showProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white text-black p-6 rounded-xl space-y-4 w-full max-w-sm">
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              className="border p-2 w-full"
            />

            <input type="file" onChange={handleImage} />

            {uploading && <p>Uploading...</p>}

            <button onClick={saveProfile}>Save</button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white text-black p-6 rounded-xl w-full max-w-sm space-y-4">
            <h2 className="font-semibold">Create Plan</h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you doing?"
              className="border p-2 w-full"
            />

            <input
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setCoords(null);
              }}
              placeholder="Where?"
              autoComplete="off"
              inputMode="text"
              className="border p-2 w-full"
            />

            {coords && MAP_KEY && (
              <img
                className="w-full h-32 object-cover rounded"
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=15&size=600x300&markers=color:red%7C${coords.lat},${coords.lng}&key=${MAP_KEY}`}
                alt="Location"
              />
            )}

            <div className="flex gap-2 overflow-x-auto pb-1">
              {getNextDays().map((day, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`px-3 py-2 border rounded shrink-0 ${
                    selectedDate?.toDateString() === day.toDateString()
                      ? "bg-blue-500 text-white"
                      : ""
                  }`}
                >
                  {day.getDate()}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {Array.from({ length: 24 }).map((_, hour) => (
                <button
                  key={hour}
                  onClick={() => setSelectedHour(hour)}
                  className={`px-3 py-2 border rounded shrink-0 ${
                    selectedHour === hour ? "bg-blue-500 text-white" : ""
                  }`}
                >
                  {hour}:00
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setShowCreate(false)}>Cancel</button>

              <button
                onClick={createPlan}
                className="bg-blue-500 px-4 py-2 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
