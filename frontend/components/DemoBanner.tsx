"use client";

import { useAuthStore } from "@/store/auth";

export function DemoBanner() {
  const email = useAuthStore((s) => s.user?.email);
  if (email !== "admin@stratt.io") return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm mb-6"
      style={{
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.2)",
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span style={{ color: "#B45309" }} className="font-medium text-[13px]">
        Compte démo — données pré-remplies, fonctionnalités en lecture seule.
      </span>
      <span
        className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide"
        style={{ background: "rgba(245,158,11,0.18)", color: "#F59E0B" }}
      >
        DÉMO
      </span>
    </div>
  );
}

export function useIsDemo() {
  return useAuthStore((s) => s.user?.email === "admin@stratt.io");
}
