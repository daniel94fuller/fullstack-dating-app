"use client";

import Cropper from "react-easy-crop";
import { useState } from "react";

export default function ImageCropModal({
  image,
  onClose,
  onComplete,
}: {
  image: string;
  onClose: () => void;
  onComplete: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<any>(null);

  function onCropComplete(_: any, croppedAreaPixels: any) {
    setCroppedArea(croppedAreaPixels);
  }

  async function createCroppedImage() {
    const img = new Image();
    img.src = image;

    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = croppedArea.width;
    canvas.height = croppedArea.height;

    ctx?.drawImage(
      img,
      croppedArea.x,
      croppedArea.y,
      croppedArea.width,
      croppedArea.height,
      0,
      0,
      croppedArea.width,
      croppedArea.height,
    );

    canvas.toBlob((blob) => {
      if (blob) onComplete(blob);
    }, "image/jpeg");
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="p-4 flex justify-between">
        <button onClick={onClose}>Cancel</button>
        <button onClick={createCroppedImage}>Save</button>
      </div>
    </div>
  );
}
