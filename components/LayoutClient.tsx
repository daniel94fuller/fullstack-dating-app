"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // only hide on profile completion flow
  const hideNavbar = pathname.startsWith("/complete-profile");

  return (
    <div className="h-full flex flex-col">
      {!hideNavbar && <Navbar />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
