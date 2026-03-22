"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { createClient } from "@/lib/supabase/client";

export default function PhotoUpload({
  onPhotoUploaded,
  onUploadStart,
}: {
  onPhotoUploaded: (url: string) => void;
  onUploadStart?: () => void;
}) {
  const supabase = createClient();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // 📸 Select file (FIXED)
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 🔥 FIX: use FileReader instead of createObjectURL
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 🎯 Save crop
  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // ✂️ Crop image (ANDROID SAFE)
  async function getCroppedImage(): Promise<Blob> {
    if (!imageSrc || !croppedAreaPixels) {
      throw new Error("Missing crop data");
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Canvas failed");

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("toBlob failed"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.9,
      );
    });
  }

  // 🚀 Upload
  async function handleUpload() {
    if (!imageSrc || !croppedAreaPixels) return;

    onUploadStart?.();

    try {
      console.log("Starting crop...");

      const blob = await getCroppedImage();

      console.log("Blob created:", blob);

      const file = new File([blob], "avatar.jpg", {
        type: "image/jpeg",
      });

      const fileName = `${Date.now()}-${Math.random()}.jpg`;

      console.log("Uploading...");

      const { data, error } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, file);

      if (error) {
        console.error("UPLOAD ERROR:", error);
        alert(error.message);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(data.path);

      const publicUrl = publicData.publicUrl;

      console.log("Upload success:", publicUrl);

      onPhotoUploaded(publicUrl);

      setImageSrc(null);
    } catch (err) {
      console.error("UPLOAD FAILED:", err);
      alert("Upload failed. Try again.");
    }
  }

  return (
    <div>
      {/* FILE INPUT */}
      <input
        type="file"
        accept="image/*"
        onChange={onSelectFile} // ✅ no capture → normal picker
      />

      {/* CROP MODAL */}
      {imageSrc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black p-4 rounded-xl w-[90%] max-w-md">
            <div className="relative w-full h-80">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* ZOOM */}
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full mt-4"
            />

            {/* ACTIONS */}
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setImageSrc(null)}
                className="text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpload}
                className="bg-pink-500 text-white px-4 py-2 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
