"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import ImageCropModal from "@/components/ImageCropModal";
import { getCurrentUserProfile } from "@/lib/actions/profile";
import { Instagram } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [initial, setInitial] = useState<any>(null);

  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [location] = useState("San Francisco");
  const [gender, setGender] = useState("");

  const [preview, setPreview] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  const [showCrop, setShowCrop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const lookingFor = "Friendship, Networking";

  useEffect(() => {
    async function load() {
      const data = await getCurrentUserProfile();
      if (!data) return;

      setName(data.full_name || "");
      setInstagram(data.instagram || "");
      setBirthdate(data.birthdate || "");
      setGender(data.gender || "");
      setPreview(data.avatar_url || null);

      setInitial({
        full_name: data.full_name,
        instagram: data.instagram,
        birthdate: data.birthdate,
        gender: data.gender,
        avatar_url: data.avatar_url,
      });

      setLoading(false);
    }

    load();
  }, []);

  function handleImageSelect(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setShowCrop(true);
  }

  const hasChanges =
    initial &&
    (name !== initial.full_name ||
      instagram !== initial.instagram ||
      birthdate !== initial.birthdate ||
      gender !== initial.gender ||
      croppedBlob !== null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !hasChanges) return;

    setSaving(true);

    try {
      let avatar_url = initial.avatar_url;

      if (croppedBlob) {
        const path = `${user.id}-${Date.now()}.jpg`;

        await supabase.storage.from("profile-photos").upload(path, croppedBlob);

        const { data } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(path);

        avatar_url = data.publicUrl;
      }

      await supabase
        .from("users")
        .update({
          full_name: name,
          instagram,
          birthdate,
          gender,
          avatar_url,
        })
        .eq("id", user.id);

      setInitial({
        full_name: name,
        instagram,
        birthdate,
        gender,
        avatar_url,
      });

      setCroppedBlob(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] w-full bg-black overflow-y-auto overflow-x-hidden"
      style={{
        touchAction: "pan-y",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
      }}
    >
      <div className="max-w-md mx-auto px-5 py-8 space-y-6">
        {/* HEADER */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Your profile</h1>
          <p className="text-sm text-white/50">Update your information</p>
        </div>

        {/* PROFILE PREVIEW */}
        <div className="space-y-3">
          <div className="w-full max-w-[420px] mx-auto rounded-2xl overflow-hidden bg-black border border-white/10">
            <div className="w-full aspect-square bg-zinc-800">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
                  No photo
                </div>
              )}
            </div>

            <div className="p-4 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold">{name || "Your name"}</h3>

                {instagram && (
                  <a
                    href={`https://instagram.com/${instagram}`}
                    target="_blank"
                    className="flex items-center gap-1 text-sm text-pink-500"
                  >
                    <Instagram size={16} />
                  </a>
                )}
              </div>

              <p className="text-sm text-white/50">
                San Francisco • Friendship, Networking
              </p>
            </div>
          </div>
        </div>

        {/* PHOTO PICKER */}
        <div className="space-y-2">
          <div
            className="w-full aspect-square rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer active:scale-[0.98]"
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

          <p className="text-xs text-white/40 text-center">
            Some images may be incompatible when choosing from the photo library
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-white/60">First Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800 px-4 py-3 rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/60">Instagram Handle</label>
            <div className="flex items-center bg-zinc-800 px-4 py-3 rounded-xl">
              <span className="text-white/50 mr-1">@</span>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value.replace("@", ""))}
                className="bg-transparent w-full outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/60">Birthdate</label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full bg-zinc-800 px-4 py-3 rounded-xl"
            />
          </div>

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

          <button
            disabled={!hasChanges || saving}
            className={`w-full py-3 rounded-xl font-medium ${
              !hasChanges ? "bg-white/20 text-white/40" : "bg-white text-black"
            }`}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>

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
