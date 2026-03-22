"use client";

import PhotoUpload from "@/components/PhotoUpload";
import UserAvatarBubble from "@/components/UserAvatarBubble";
import {
  getCurrentUserProfile,
  updateUserProfile,
} from "@/lib/actions/profile";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    gender: "male" as "male" | "female" | "other",
    birthdate: "",
    avatar_url: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const profileData = await getCurrentUserProfile();
        if (profileData) {
          setFormData({
            full_name: profileData.full_name || "",
            username: profileData.username || "",
            bio: profileData.bio || "",
            gender: profileData.gender || "male",
            birthdate: profileData.birthdate || "",
            avatar_url: profileData.avatar_url || "",
          });
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError(null);

    try {
      const result = await updateUserProfile(formData);
      if (result.success) {
        setDirty(false); // ✅ reset dirty state
        router.push("/profile");
      } else {
        setError(result.error || "Failed to update profile.");
      }
    } catch {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setDirty(true); // 🔥 track unsaved changes
  }

  // 🔄 LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* HEADER */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
          <p>Update your profile information</p>

          {/* 🔥 UNSAVED INDICATOR */}
          {dirty && (
            <p className="text-xs text-yellow-500 mt-2">
              You have unsaved changes
            </p>
          )}
        </header>

        <div className="max-w-2xl mx-auto">
          <form className="card p-8" onSubmit={handleFormSubmit}>
            {/* AVATAR */}
            <div className="mb-8">
              <label className="block text-sm mb-4">Profile Picture</label>

              <div className="flex items-center space-x-6">
                <div className="relative">
                  <UserAvatarBubble src={formData.avatar_url} size={150} />

                  <PhotoUpload
                    onUploadStart={() => setUploading(true)}
                    onPhotoUploaded={(url) => {
                      setFormData((prev) => ({
                        ...prev,
                        avatar_url: url,
                      }));
                      setUploading(false);
                      setDirty(true);
                    }}
                  />
                </div>

                <div>
                  <p className="text-sm mb-2">Upload a new profile picture</p>
                  <p className="text-xs">JPG, PNG or GIF. Max 5MB.</p>

                  {/* 🔥 UPLOADING STATE */}
                  {uploading && (
                    <p className="text-xs text-pink-500 mt-2">Uploading...</p>
                  )}
                </div>
              </div>
            </div>

            {/* BASIC INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm mb-2">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="Choose a username"
                />
              </div>
            </div>

            {/* GENDER + BIRTHDAY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm mb-2">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Birthday *</label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
            </div>

            {/* BIO */}
            <div className="mb-8">
              <label className="block text-sm mb-2">About Me *</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                maxLength={500}
                className="input resize-none"
                placeholder="Tell others about yourself..."
              />
              <p className="text-xs mt-1">{formData.bio.length}/500</p>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-6 p-4 rounded-lg border text-red-500">
                {error}
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || uploading}
                className="match-button"
              >
                {saving
                  ? "Saving..."
                  : uploading
                    ? "Uploading..."
                    : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
