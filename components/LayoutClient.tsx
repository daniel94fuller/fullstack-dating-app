"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideNavbar = pathname === "/complete-profile";

  return (
    <div className="h-full flex flex-col">
      {!hideNavbar && <Navbar />}
      {children}
    </div>
  );
}
