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

  const [preview, setPreview] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [showCrop, setShowCrop] = useState(false);

  const [loading, setLoading] = useState(false);

  // 🔥 handle image select → open crop
  function handleImageSelect(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setShowCrop(true);
  }

  // 🔥 submit profile
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (!name || !instagram || !birthdate || !croppedBlob) {
      alert("Please complete all fields");
      return;
    }

    setLoading(true);

    try {
      // 🔥 upload cropped image
      const filePath = `${user.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos") // ✅ CORRECT BUCKET
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      const avatar_url = data.publicUrl;

      // 🔥 update user profile
      const { error } = await supabase
        .from("users")
        .update({
          full_name: name,
          instagram,
          birthdate,
          location,
          avatar_url,
        })
        .eq("id", user.id);

      if (error) throw error;

      // ✅ go to home
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 bg-zinc-900 p-6 rounded-2xl border border-white/10"
      >
        <h1 className="text-xl font-semibold text-center">
          Complete Your Profile
        </h1>

        {/* 🔥 IMAGE PREVIEW */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800">
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-white/40">
                Photo
              </div>
            )}
          </div>
        </div>

        {/* 🔥 FILE INPUT */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            e.target.files?.[0] && handleImageSelect(e.target.files[0])
          }
          className="text-sm"
        />

        {/* NAME */}
        <input
          placeholder="First Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input w-full"
        />

        {/* INSTAGRAM */}
        <input
          placeholder="Instagram Username"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          className="input w-full"
        />

        {/* BIRTHDATE */}
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className="input w-full"
        />

        {/* LOCATION (LOCKED) */}
        <input value={location} disabled className="input w-full opacity-60" />

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="match-button w-full"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>

      {/* 🔥 CROP MODAL */}
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
