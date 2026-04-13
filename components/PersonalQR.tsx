"use client";

import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PersonalQR() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) setUserId(user.id);
    }

    loadUser();
  }, []);

  if (!userId) return null;

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${userId}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <QRCode value={url} size={180} />
      <p className="text-sm text-white/60">Scan to message me</p>
    </div>
  );
}
