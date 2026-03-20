"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-[#FAFAFD] flex flex-col items-center justify-center px-6 text-center"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-12 no-underline">
        <div
          style={{ background: "#5C93FF", boxShadow: "0 4px 14px rgba(92,147,255,0.25)" }}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <span className="font-bold text-lg text-[#0C1033]">STRATT</span>
      </Link>

      {/* Error icon */}
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[#0C1033] mb-3">Une erreur est survenue</h1>
      <p className="text-[#6B7280] max-w-sm mb-2 text-[15px] leading-relaxed">
        Quelque chose s&apos;est mal passé. Notre équipe a été notifiée.
      </p>
      {error.digest && (
        <p className="text-[11px] font-mono text-[#9CA3AF] mb-8">
          Référence : {error.digest}
        </p>
      )}
      {!error.digest && <div className="mb-8" />}

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "#5C93FF", boxShadow: "0 4px 16px rgba(92,147,255,0.2)" }}
        >
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#6B7280] border border-[#E8EAF0] bg-white no-underline hover:border-[#5C93FF]/40 transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
