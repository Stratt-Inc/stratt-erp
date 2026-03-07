import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, hsl(234 42% 7%), hsl(234 35% 12%))" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)", boxShadow: "0 4px 14px rgba(91,107,245,0.4)" }}>
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Axiora</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            L&apos;ERP SaaS<br />
            <span style={{ background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              pour votre équipe.
            </span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            CRM, comptabilité, facturation, inventaire, RH et achats dans une seule plateforme multi-tenant.
          </p>
          <div className="flex gap-4 pt-4">
            {["CRM", "Comptabilité", "Facturation", "Inventaire", "RH", "Achats"].map((m) => (
              <span key={m} className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: "rgba(91,107,245,0.15)", color: "#9B6FE8", border: "1px solid rgba(91,107,245,0.3)" }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-sm">© 2026 Axiora. Tous droits réservés.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)" }}>
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg">Axiora</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
