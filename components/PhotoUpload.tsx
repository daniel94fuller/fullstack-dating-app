"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    document.body.style.overflow = imageSrc ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [imageSrc]);

  async function normalizeImage(file: File): Promise<string> {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;

    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });

    const max = 2000;
    let { width, height } = img;

    if (width > max || height > max) {
      const scale = max / Math.max(width, height);
      width *= scale;
      height *= scale;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    ctx?.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.95);
  }

  const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    setImageReady(false);
    setCroppedAreaPixels(null);

    const normalized = await normalizeImage(file);

    setTimeout(() => {
      setImageSrc(normalized);
      setImageReady(true);
    }, 50);
  };

  const onCropComplete = useCallback((_: any, cropped: any) => {
    setCroppedAreaPixels(cropped);
  }, []);

  async function getCroppedImage(): Promise<Blob> {
    const image = new Image();
    image.src = imageSrc!;

    await new Promise((res) => (image.onload = res));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx?.drawImage(
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

    return new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95),
    );
  }

  async function uploadBlob(blob: Blob) {
    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
    const fileName = `${Date.now()}-${Math.random()}.jpg`;

    const { data } = await supabase.storage
      .from("profile-photos")
      .upload(fileName, file);

    const { data: publicData } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(data!.path);

    onPhotoUploaded(publicData.publicUrl);
    setImageSrc(null);
  }

  async function handleUpload() {
    if (!imageSrc) return;
    onUploadStart?.();

    if (!croppedAreaPixels) {
      const blob = await (await fetch(imageSrc)).blob();
      return uploadBlob(blob);
    }

    const blob = await getCroppedImage();
    await uploadBlob(blob);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onSelectFile}
      />

      {imageSrc && imageReady && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* HEADER (ALWAYS VISIBLE) */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
            <button onClick={() => setImageSrc(null)} className="text-white">
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="bg-white text-black px-4 py-2 rounded-lg"
            >
              Save
            </button>
          </div>

          {/* CROPPER */}
          <div className="flex-1 relative">
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
          <div className="px-4 py-4 pb-[env(safe-area-inset-bottom)]">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
