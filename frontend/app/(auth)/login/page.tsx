"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/lib/api";
import { StrattWordmark } from "@/components/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative space-y-8">
      {/* StrattWordmark watermark */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -52%)",
          opacity: 0.035,
          zIndex: 0,
        }}
      >
        <StrattWordmark width={480} color="#000000" />
      </div>
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-foreground">Connexion</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Créer un compte
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#24DDB8", color: "#09111E" }}
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <div className="relative z-10 text-center">
        <p className="text-xs text-muted-foreground">
          Compte démo :{" "}
          <button
            type="button"
            onClick={() => { setEmail("admin@stratt.io"); setPassword("admin1234"); }}
            className="text-primary hover:underline font-medium"
          >
            admin@stratt.io / admin1234
          </button>
        </p>
      </div>
    </div>
  );
}
