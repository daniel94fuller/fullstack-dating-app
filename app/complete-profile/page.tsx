"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import ImageCropModal from "@/components/ImageCropModal";

export default function CompleteProfilePage() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [location] = useState("San Francisco");

  const [gender, setGender] = useState("");
  const lookingFor = "Friendship, Networking";

  const [preview, setPreview] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [showCrop, setShowCrop] = useState(false);

  const [loading, setLoading] = useState(false);

  const age = birthdate
    ? Math.floor(
        (Date.now() - new Date(birthdate).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      )
    : null;

  const isUnder18 = age !== null && age < 18;

  const isValid =
    name && instagram && birthdate && croppedBlob && gender && !isUnder18;

  function handleImageSelect(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setShowCrop(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !isValid) return;

    setLoading(true);

    try {
      const filePath = `${user.id}-${Date.now()}.jpg`;

      await supabase.storage
        .from("profile-photos")
        .upload(filePath, croppedBlob!);

      const { data } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      await supabase
        .from("users")
        .update({
          full_name: name,
          instagram,
          birthdate,
          location,
          avatar_url: data.publicUrl,
          gender,
          looking_for: lookingFor,
        })
        .eq("id", user.id);

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-black overflow-y-auto overflow-x-hidden touch-pan-y overscroll-contain">
      <div className="max-w-md mx-auto px-5 py-8 space-y-6">
        {/* HEADER */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Create your profile</h1>
          <p className="text-sm text-white/50">People will see this first</p>
        </div>

        {/* PHOTO */}
        <div className="space-y-2">
          <div
            className="w-full aspect-square rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer active:scale-[0.98] transition"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e: any) => {
                if (e.target.files?.[0]) {
                  handleImageSelect(e.target.files[0]);
                }
              };
              input.click();
            }}
          >
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white/40 text-sm">Add Photo</span>
            )}
          </div>

          {/* 🔥 NEW MESSAGE */}
          <p className="text-xs text-white/40 text-center">
            Some images may be incompatible when choosing from the photo library
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NAME */}
          <div className="space-y-1">
            <label className="text-xs text-white/60">First Name</label>
            <input
              placeholder="First name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800 px-4 py-3 rounded-xl outline-none"
            />
          </div>

          {/* INSTAGRAM */}
          <div className="space-y-1">
            <label className="text-xs text-white/60">Instagram Handle</label>
            <div className="flex items-center bg-zinc-800 px-4 py-3 rounded-xl">
              <span className="text-white/50 mr-1">@</span>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value.replace("@", ""))}
                placeholder="username"
                className="bg-transparent w-full outline-none"
              />
            </div>
          </div>

          {/* 🔥 BIRTHDATE LABEL ADDED */}
          <div className="space-y-1">
            <label className="text-xs text-white/60">Birthdate</label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full bg-zinc-800 px-4 py-3 rounded-xl"
            />
          </div>

          {isUnder18 && (
            <p className="text-red-400 text-sm">Must be 18 or older</p>
          )}

          {/* GENDER */}
          <div className="space-y-1">
            <label className="text-xs text-white/60">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-zinc-800 px-4 py-3 rounded-xl"
            >
              <option value="">Select gender</option>
              <option value="man">Man</option>
              <option value="woman">Woman</option>
              <option value="non-binary">Non-binary</option>
            </select>
          </div>

          {/* STATIC */}
          <div className="space-y-1">
            <label className="text-xs text-white/60">Looking For</label>
            <input
              value={lookingFor}
              disabled
              className="w-full bg-zinc-800 px-4 py-3 rounded-xl opacity-60"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/60">Location</label>
            <input
              value={location}
              disabled
              className="w-full bg-zinc-800 px-4 py-3 rounded-xl opacity-60"
            />
          </div>

          {/* SUBMIT */}
          <button
            disabled={!isValid || loading}
            className={`w-full py-3 rounded-xl font-medium transition ${
              !isValid
                ? "bg-white/20 text-white/40"
                : "bg-white text-black active:scale-[0.98]"
            }`}
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>

      {/* CROP MODAL */}
      {showCrop && preview && (
        <ImageCropModal
          image={preview}
          onClose={() => setShowCrop(false)}
          onComplete={(blob) => {
            setCroppedBlob(blob);
            setShowCrop(false);
          }}
        />
      )}
    </div>
  );
}
