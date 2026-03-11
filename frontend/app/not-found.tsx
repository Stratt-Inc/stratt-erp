import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-[#FAFAFD] flex flex-col items-center justify-center px-6 text-center"
    >
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .float { animation: float 4s ease-in-out infinite; }
      `}</style>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-12 no-underline">
        <div
          style={{ background: "linear-gradient(135deg,#5B6BF5,#9B6FE8)", boxShadow: "0 4px 14px rgba(91,107,245,0.4)" }}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <span className="font-bold text-lg text-[#0C1033]">STRATT</span>
      </Link>

      {/* 404 number */}
      <div className="float mb-8 relative">
        <p
          className="text-[9rem] font-extrabold leading-none tracking-tight select-none"
          style={{
            background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </p>
        <div
          className="absolute inset-0 blur-3xl opacity-20 rounded-full"
          style={{ background: "linear-gradient(135deg,#5B6BF5,#9B6FE8)" }}
        />
      </div>

      <h1 className="text-2xl font-bold text-[#0C1033] mb-3">Page introuvable</h1>
      <p className="text-[#6B7280] max-w-sm mb-8 text-[15px] leading-relaxed">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white no-underline"
          style={{ background: "linear-gradient(135deg,#5B6BF5,#7B5BE8)", boxShadow: "0 4px 16px rgba(91,107,245,0.3)" }}
        >
          Retour au dashboard
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#6B7280] border border-[#E8EAF0] bg-white no-underline hover:border-[#5B6BF5]/40 transition-colors"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
