"use client";

import Logo from "./Logo";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const [showProfile, setShowProfile] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestAvatar, setGuestAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // =========================
  // LOAD PROFILE
  // =========================
  useEffect(() => {
    const storedName = localStorage.getItem("guest_name");
    const storedAvatar = localStorage.getItem("guest_avatar");

    if (storedName) setGuestName(storedName);
    if (storedAvatar) setGuestAvatar(storedAvatar);
  }, []);

  // =========================
  // 🔥 UPLOAD IMAGE (FIXED BUCKET)
  // =========================
  async function handleImage(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const filePath = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos") // ✅ YOUR BUCKET
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("profile-photos") // ✅ YOUR BUCKET
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      setGuestAvatar(publicUrl);
      setUploading(false);
    } catch (err) {
      console.error("Upload crash:", err);
      setUploading(false);
    }
  }

  // =========================
  // SAVE PROFILE
  // =========================
  function saveProfile() {
    if (!guestName) return;

    localStorage.setItem("guest_name", guestName);

    if (guestAvatar) {
      localStorage.setItem("guest_avatar", guestAvatar);
    }

    setShowProfile(false);
  }

  // =========================
  // CREATE PLAN
  // =========================
  async function createPlan() {
    const { data, error } = await supabase
      .from("dm_channels")
      .insert({
        title: "New Plan",
        starts_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Create plan error:", error);
      return;
    }

    router.push(`/dm/${data.id}`);
  }

  return (
    <>
      {/* NAVBAR */}
      <nav className="z-50 backdrop-blur-md border-b border-white/10">
        <div className="w-full px-3 sm:px-4">
          <div className="flex items-center justify-between h-16">
            <Logo />

            <div className="flex items-center gap-3">
              {/* 👤 PROFILE */}
              <button
                onClick={() => setShowProfile(true)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden"
              >
                {guestAvatar ? (
                  <img src={guestAvatar} className="w-10 h-10 object-cover" />
                ) : (
                  "👤"
                )}
              </button>

              {/* + MAKE PLAN */}
              <button
                onClick={createPlan}
                className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm"
              >
                + Make Plan
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-xl w-[90%] max-w-sm space-y-4">
            <h2 className="text-lg font-semibold">Your Profile</h2>

            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              className="w-full border px-3 py-2 rounded"
            />

            <input type="file" accept="image/*" onChange={handleImage} />

            {uploading && <p className="text-sm">Uploading...</p>}

            {guestAvatar && (
              <img
                src={guestAvatar}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowProfile(false)}>Cancel</button>

              <button
                onClick={saveProfile}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
