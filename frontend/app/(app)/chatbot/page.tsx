"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { MODULE } from "@/lib/colors";
import { DemoBanner, useIsDemo } from "@/components/DemoBanner";
import { Highlight } from "@/components/Highlight";
import {
  MessageSquare, Plus, Trash2, Copy, Check,
  BarChart2, Link2, Clock, Shield, Bot, User, ThumbsUp, ThumbsDown, Sparkles, ChevronDown,
} from "lucide-react";

interface ChatToken {
  id: string;
  label: string;
  token: string;
  expires_at: string | null;
  revoked: boolean;
  use_count: number;
  created_at: string;
}

interface Analytics {
  top_questions: { question: string; count: number }[];
  feedback: { liked: boolean; count: number }[];
  tokens: ChatToken[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const DEMO_CONVERSATION = [
  {
    role: "user",
    text: "Comment classer l'achat d'une flotte de PC portables pour les agents ?",
  },
  {
    role: "assistant",
    text: "L'achat de PC portables relève de la famille **Fournitures**, sous-famille **Fournitures informatiques** (code 02.01). Le seuil de procédure applicable est **90 000 € HT** — au-delà, une procédure formalisée (appel d'offres) est requise selon l'art. L2124-1 du CCP.",
    badge: "02.01 – Fournitures informatiques",
    confidence: 98,
  },
  {
    role: "user",
    text: "Et pour la maintenance des climatiseurs dans les bâtiments administratifs ?",
  },
  {
    role: "assistant",
    text: "La maintenance des climatiseurs relève de la famille **Services**, sous-famille **Maintenance et réparation** (code 03.04). Ce code couvre toutes les prestations de maintenance préventive et corrective des équipements techniques. Seuil : **90 000 € HT**.",
    badge: "03.04 – Maintenance et réparation",
    confidence: 95,
  },
];

const TOKEN_DEMO_CONVERSATIONS: { q: string; a: string }[][] = [
  [
    { q: "Quel code pour l'achat de papier de bureau ?", a: "**01.02 – Fournitures de bureau**. Consommables bureautiques courants. Seuil : 90 000 € HT." },
    { q: "Et pour des cartouches d'encre ?", a: "Même famille : **01.02 – Fournitures de bureau**. Les consommables d'impression sont inclus dans ce code. Seuil identique : 90 000 € HT." },
  ],
  [
    { q: "Comment classer une flotte de PC portables ?", a: "**02.01 – Fournitures informatiques**. Ce code couvre tout le matériel informatique mobile. Procédure formalisée au-delà de **90 000 € HT**." },
    { q: "Et des écrans de bureau séparés ?", a: "Toujours **02.01 – Fournitures informatiques**. Les périphériques d'affichage sont rattachés à la même sous-famille que le matériel informatique." },
  ],
  [
    { q: "Maintenance des climatiseurs — quelle famille ?", a: "**03.04 – Maintenance et réparation**. Couvre la maintenance préventive et corrective des équipements techniques. Seuil : 90 000 € HT." },
    { q: "Seuil pour des prestations de nettoyage ?", a: "**03.01 – Services de nettoyage**. Attention : ce type de marché dépasse souvent le seuil de **221 000 € HT**, imposant une publication au JOUE." },
  ],
];

function TokenCard({
  t, index, copied, isDemo, onCopy, onRevoke,
}: {
  t: ChatToken;
  index: number;
  copied: string | null;
  isDemo: boolean;
  onCopy: (token: string) => void;
  onRevoke: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const convo = TOKEN_DEMO_CONVERSATIONS[index % TOKEN_DEMO_CONVERSATIONS.length];

  return (
    <div className={`bg-card rounded-xl border border-border transition-opacity ${t.revoked ? "opacity-40" : ""}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.revoked ? "bg-red-400" : "bg-emerald-500"}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{t.label || "Sans libellé"}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[160px]">{t.token.slice(0, 16)}…</span>
            {t.expires_at && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(t.expires_at).toLocaleDateString("fr-FR")}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <BarChart2 className="w-3 h-3" />
              {t.use_count} utilisation{t.use_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Expand conversation */}
          {!t.revoked && (
            <button onClick={() => setOpen((v) => !v)} title="Voir un exemple"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
          <button onClick={() => onCopy(t.token)} disabled={t.revoked} title="Copier le lien"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30">
            {copied === t.token ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <a href={`/chat/${t.token}`} target="_blank" rel="noopener noreferrer"
            className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ${t.revoked ? "pointer-events-none opacity-30" : ""}`}>
            <Link2 className="w-3.5 h-3.5" />
          </a>
          {!t.revoked && !isDemo && (
            <button onClick={() => onRevoke(t.id)} title="Révoquer"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {t.revoked && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}>
              <Shield className="w-2.5 h-2.5" /> Révoqué
            </span>
          )}
        </div>
      </div>

      {/* Mini conversation preview */}
      {open && !t.revoked && (
        <div className="border-t border-border px-4 py-3 space-y-2.5"
          style={{ background: "transparent" }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">
            Exemple de conversation
          </p>
          {convo.map((msg, i) => (
            <div key={i} className="space-y-1.5">
              {/* User */}
              <div className="flex justify-end">
                <div className="flex items-start gap-1.5 flex-row-reverse max-w-[85%]">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <div className="px-3 py-1.5 rounded-xl rounded-tr-sm text-[11px] leading-relaxed text-foreground"
                    style={{ background: "hsl(var(--primary) / 0.09)" }}>
                    {msg.q}
                  </div>
                </div>
              </div>
              {/* Assistant */}
              <div className="flex items-start gap-1.5 max-w-[85%]">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "hsl(var(--violet))" }}>
                  <Bot className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="px-3 py-1.5 rounded-xl rounded-tl-sm bg-muted/50 text-[11px] leading-relaxed text-foreground">
                  {msg.a.split("**").map((part, j) =>
                    j % 2 === 1
                      ? <strong key={j} className="font-semibold">{part}</strong>
                      : <span key={j}>{part}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatbotPage() {
  const { currentOrg, accessToken: token } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"apercu" | "tokens" | "analytics">("apercu");
  const [copied, setCopied] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newExpiry, setNewExpiry] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const isDemo = useIsDemo();
  const orgId = currentOrg?.id ?? "";

  const { data: tokensData } = useQuery<ChatToken[]>({
    queryKey: ["chatbot-tokens", orgId],
    queryFn: () => api.get("/api/v1/chatbot/tokens", { orgId, token: token ?? "" }),
    enabled: !!orgId,
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["chatbot-analytics", orgId],
    queryFn: () => api.get("/api/v1/chatbot/analytics", { orgId, token: token ?? "" }),
    enabled: !!orgId && tab === "analytics",
  });

  const createToken = useMutation({
    mutationFn: () =>
      api.post("/api/v1/chatbot/tokens", { label: newLabel, expires_in_days: newExpiry }, { orgId, token: token ?? "" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chatbot-tokens", orgId] });
      setShowCreate(false);
      setNewLabel("");
      setNewExpiry(0);
    },
  });

  const revokeToken = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/v1/chatbot/tokens/${id}`, { orgId, token: token ?? "" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chatbot-tokens", orgId] }),
  });

  const copyLink = (chatToken: string) => {
    const url = `${window.location.origin}/chat/${chatToken}`;
    navigator.clipboard.writeText(url);
    setCopied(chatToken);
    setTimeout(() => setCopied(null), 2000);
  };

  const feedbackPositive = analytics?.feedback?.find((f) => f.liked)?.count ?? 0;
  const feedbackNegative = analytics?.feedback?.find((f) => !f.liked)?.count ?? 0;
  const totalFeedback = feedbackPositive + feedbackNegative;

  const TABS = [
    { id: "apercu" as const, label: "Aperçu" },
    { id: "tokens" as const, label: "Liens publics" },
    { id: "analytics" as const, label: "Analytiques" },
  ];

  return (
    <div className="space-y-3">
      <DemoBanner />

      {/* Header */}
      <div className="flex items-end justify-between gap-8 pb-3" style={{ borderBottom: "1px solid hsl(var(--violet) / 0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: MODULE.chatbot, boxShadow: `0 0 6px ${MODULE.chatbot}` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Module IA</span>
          </div>
          <h1 className="text-[22px] leading-none font-extrabold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.025em" }}>
            Assistant{" "}
            <Highlight variant="box" color="violet">nomenclature</Highlight>
          </h1>
          <p className="text-[12px] mt-1 font-medium" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
            Classification budgétaire intelligente · IA entraînée sur le CCP · Liens publics partageables
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-shrink-0"
          style={{ background: "hsl(var(--violet) / 0.08)", border: "1px solid hsl(var(--violet) / 0.15)" }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(var(--violet))" }} />
          <span className="text-[11px] font-semibold" style={{ color: "hsl(var(--violet))" }}>Propulsé par Claude</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/30 w-fit">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={["px-4 py-1.5 rounded-md text-xs font-semibold transition-colors",
              tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"].join(" ")}>
            {label}
          </button>
        ))}
      </div>

      {/* ── APERÇU ── */}
      {tab === "apercu" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          {/* Chat preview */}
          <div className="lg:col-span-3 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3"
>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--violet))" }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Assistant nomenclature</p>
                <p className="text-[10px] text-muted-foreground">Classification budgétaire · CCP 2024</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground font-medium">En ligne</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {DEMO_CONVERSATION.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.role === "user"
                      ? "bg-primary/10"
                      : ""
                  }`}
                    style={msg.role === "assistant" ? { background: "hsl(var(--violet))" } : undefined}>
                    {msg.role === "user"
                      ? <User className="w-3 h-3 text-primary" />
                      : <Bot className="w-3 h-3 text-white" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[80%] space-y-1.5 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary/8 text-foreground rounded-tr-sm"
                        : "bg-muted/50 text-foreground rounded-tl-sm"
                    }`}
                      style={msg.role === "user" ? { background: "hsl(var(--primary) / 0.08)" } : undefined}>
                      {msg.text.split("**").map((part, j) =>
                        j % 2 === 1
                          ? <strong key={j} className="font-semibold">{part}</strong>
                          : <span key={j}>{part}</span>
                      )}
                    </div>
                    {msg.badge && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "hsl(var(--violet) / 0.1)", color: "hsl(var(--violet))" }}>
                          {msg.badge}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Confiance {msg.confidence}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background text-xs text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Posez une question sur la classification budgétaire…</span>
              </div>
            </div>
          </div>

          {/* Info panels */}
          <div className="lg:col-span-2 space-y-3">
            {/* How it works */}
            <div className="bg-card rounded-xl border border-border p-3 space-y-2.5">
              <div className="section-header" style={{ marginBottom: 0 }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--violet))" }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Fonctionnement</span>
              </div>
              {[
                { step: "1", text: "Générez un lien public sécurisé", color: "hsl(var(--primary))" },
                { step: "2", text: "Partagez-le aux agents ou directions", color: "hsl(var(--violet))" },
                { step: "3", text: "L'IA classe les achats selon votre nomenclature", color: "hsl(var(--accent))" },
                { step: "4", text: "Suivez les usages dans les analytiques", color: "hsl(var(--accent))" },
              ].map(({ step, text, color }) => (
                <div key={step} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: color }}>
                    {step}
                  </div>
                  <p className="text-xs text-foreground">{text}</p>
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Liens actifs", value: (tokensData ?? []).filter(t => !t.revoked).length, color: "hsl(var(--primary))" },
                { label: "Utilisations", value: (tokensData ?? []).reduce((s, t) => s + t.use_count, 0), color: "hsl(var(--violet))" },
                { label: "Satisfaction", value: totalFeedback > 0 ? `${Math.round(feedbackPositive / totalFeedback * 100)}%` : "—", color: "hsl(var(--accent))" },
                { label: "Questions fréquentes", value: analytics?.top_questions?.length ?? "—", color: "hsl(var(--warning))" },
              ].map(({ label, value, color }) => (
                <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
                  <p className="stat-number-sm">{value}</p>
                  <p className="stat-label">{label}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            {!isDemo && (
              <button
                onClick={() => setTab("tokens")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "hsl(var(--violet))" }}
              >
                <Plus className="w-3.5 h-3.5" /> Créer un lien public
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TOKENS ── */}
      {tab === "tokens" && (
        <div className="space-y-3">
          {showCreate && !isDemo ? (
            <div className="bg-card rounded-xl border border-primary/20 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Nouveau lien chatbot</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Libellé</label>
                  <input
                    className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
                    placeholder="ex : Agents comptabilité"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Expiration (jours, 0 = jamais)</label>
                  <input
                    type="number" min={0}
                    className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => createToken.mutate()} disabled={createToken.isPending}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: "hsl(var(--violet))" }}>
                  {createToken.isPending ? "Création…" : "Créer le lien"}
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground border border-border hover:bg-muted/50 transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            !isDemo && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Créer un lien public
              </button>
            )
          )}

          <div className="space-y-2">
            {(tokensData ?? []).length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-semibold text-foreground">Aucun lien créé</p>
                <p className="text-xs text-muted-foreground mt-1">Créez votre premier lien public pour partager l&apos;assistant.</p>
              </div>
            )}
            {(tokensData ?? []).map((t, i) => (
              <TokenCard
                key={t.id}
                t={t}
                index={i}
                copied={copied}
                isDemo={isDemo}
                onCopy={copyLink}
                onRevoke={(id) => revokeToken.mutate(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === "analytics" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Avis positifs", value: feedbackPositive, icon: ThumbsUp, color: "hsl(var(--accent))" },
              { label: "Avis négatifs", value: feedbackNegative, icon: ThumbsDown, color: "hsl(var(--destructive))" },
              { label: "Satisfaction", value: totalFeedback > 0 ? `${Math.round(feedbackPositive / totalFeedback * 100)}%` : "—", icon: BarChart2, color: "hsl(var(--primary))" },
              { label: "Liens actifs", value: (tokensData ?? []).filter(t => !t.revoked).length, icon: Link2, color: "hsl(var(--violet))" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
                <p className="stat-number">{value}</p>
                <p className="stat-label">{label}</p>
                <Icon className="stat-tile-icon" />
              </div>
            ))}
          </div>

          {analytics && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
                <MessageSquare className="w-4 h-4" style={{ color: "hsl(var(--violet))" }} />
                <h2 className="text-sm font-semibold text-foreground">Questions les plus fréquentes</h2>
              </div>
              {(analytics.top_questions ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground px-4 py-6 text-center">Aucune question pour l&apos;instant</p>
              ) : (
                <div className="divide-y divide-border">
                  {analytics.top_questions.map((q, i) => (
                    <div key={i} className="data-row px-4 py-2.5 flex items-center justify-between gap-4">
                      <p className="text-sm text-foreground truncate flex-1">{q.question}</p>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "hsl(var(--violet) / 0.1)", color: "hsl(var(--violet))" }}>
                        ×{q.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!analytics && (
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border">
              <BarChart2 className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-semibold text-foreground">Aucune donnée analytique</p>
              <p className="text-xs text-muted-foreground mt-1">Les statistiques apparaîtront après les premières utilisations.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
