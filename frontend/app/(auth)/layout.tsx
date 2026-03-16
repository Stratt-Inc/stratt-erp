export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding navy */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "#09111E" }}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(92,147,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(92,147,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Green glow bottom-left */}
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #24DDB8, transparent 70%)", transform: "translate(-40%, 40%)" }}
        />
        {/* Blue glow top-right */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-8 pointer-events-none"
          style={{ background: "radial-gradient(circle, #5C93FF, transparent 70%)", transform: "translate(40%, -40%)" }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center select-none"
            style={{
              background: "#141F2E",
              border: "1px solid #1A2535",
              boxShadow: "0 0 0 1px rgba(36,221,184,0.15), 0 8px 20px rgba(0,0,0,0.5)",
            }}
          >
            <span className="text-[13px] font-bold tracking-tight" style={{ color: "#24DDB8" }}>tt</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">stratt</span>
        </div>

        {/* Headline */}
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight" style={{ color: "#F0F4FF" }}>
            L&apos;ERP pour la<br />
            <span style={{
              background: "linear-gradient(135deg, #5C93FF, #24DDB8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              commande publique.
            </span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)" }} className="text-base leading-relaxed max-w-sm">
            CRM, comptabilité, facturation, inventaire, RH et achats — conçu pour les acheteurs publics.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {["CRM", "Comptabilité", "Facturation", "Inventaire", "RH", "Achats"].map((m) => (
              <span
                key={m}
                className="text-xs font-medium px-2.5 py-1 rounded-md"
                style={{
                  background: "rgba(92,147,255,0.1)",
                  color: "#5C93FF",
                  border: "1px solid rgba(92,147,255,0.2)",
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2026 STRATT. Tous droits réservés.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center select-none"
              style={{ background: "#09111E", border: "1px solid #1A2535" }}
            >
              <span className="text-[11px] font-bold" style={{ color: "#24DDB8" }}>tt</span>
            </div>
            <span className="font-bold text-lg tracking-tight">stratt</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
