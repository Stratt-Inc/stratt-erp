"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import {
  MessageSquare,
  Plus,
  Trash2,
  Copy,
  Check,
  BarChart2,
  Link2,
  Clock,
  Shield,
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

export default function ChatbotPage() {
  const { currentOrg, accessToken: token } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"tokens" | "analytics">("tokens");
  const [copied, setCopied] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newExpiry, setNewExpiry] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

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
      api.post(
        "/api/v1/chatbot/tokens",
        { label: newLabel, expires_in_days: newExpiry },
        { orgId, token: token ?? "" }
      ),
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

  const feedbackPositive = analytics?.feedback.find((f) => f.liked)?.count ?? 0;
  const feedbackNegative = analytics?.feedback.find((f) => !f.liked)?.count ?? 0;
  const totalFeedback = feedbackPositive + feedbackNegative;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#5B6BF5]" />
            Chatbot nomenclature
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Générez des liens publics vers l&apos;assistant IA de classification budgétaire
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("tokens")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "tokens" ? "bg-[#5B6BF5] text-white" : "text-muted-foreground hover:text-foreground"}`}
          >
            Tokens
          </button>
          <button
            onClick={() => setTab("analytics")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "analytics" ? "bg-[#5B6BF5] text-white" : "text-muted-foreground hover:text-foreground"}`}
          >
            Analytiques
          </button>
        </div>
      </div>

      {tab === "tokens" && (
        <>
          {/* Create token */}
          {showCreate ? (
            <div className="border border-border rounded-xl p-5 space-y-4 bg-card">
              <h3 className="font-semibold text-sm">Nouveau lien chatbot</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Libellé</label>
                  <input
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#5B6BF5]/30"
                    placeholder="ex : Agents comptabilité"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Expiration (jours, 0 = jamais)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#5B6BF5]/30"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => createToken.mutate()}
                  disabled={createToken.isPending}
                  className="px-4 py-2 bg-[#5B6BF5] text-white rounded-lg text-sm font-medium hover:bg-[#4a5ae4] disabled:opacity-50"
                >
                  {createToken.isPending ? "Création…" : "Créer le lien"}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-[#5B6BF5] transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Créer un lien public
            </button>
          )}

          {/* Token list */}
          <div className="space-y-2">
            {(tokensData ?? []).length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-10">
                Aucun lien créé pour l&apos;instant
              </p>
            )}
            {(tokensData ?? []).map((t) => (
              <div
                key={t.id}
                className={`border rounded-xl p-4 flex items-center gap-4 bg-card transition-opacity ${t.revoked ? "opacity-40" : ""}`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.revoked ? "bg-red-500" : "bg-emerald-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.label || "Sans libellé"}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                      {t.token.slice(0, 16)}…
                    </span>
                    {t.expires_at && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(t.expires_at).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BarChart2 className="w-3 h-3" />
                      {t.use_count} utilisations
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyLink(t.token)}
                    disabled={t.revoked}
                    title="Copier le lien"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                  >
                    {copied === t.token ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={`/chat/${t.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${t.revoked ? "pointer-events-none opacity-30" : ""}`}
                    title="Ouvrir le lien"
                  >
                    <Link2 className="w-4 h-4" />
                  </a>
                  {!t.revoked && (
                    <button
                      onClick={() => revokeToken.mutate(t.id)}
                      title="Révoquer"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {t.revoked && (
                    <span className="flex items-center gap-1 text-xs text-red-400 px-2">
                      <Shield className="w-3 h-3" />
                      Révoqué
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "analytics" && analytics && (
        <div className="space-y-6">
          {/* Feedback stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-border rounded-xl p-5 bg-card text-center">
              <p className="text-3xl font-bold text-emerald-500">{feedbackPositive}</p>
              <p className="text-sm text-muted-foreground mt-1">Avis positifs 👍</p>
            </div>
            <div className="border border-border rounded-xl p-5 bg-card text-center">
              <p className="text-3xl font-bold text-red-400">{feedbackNegative}</p>
              <p className="text-sm text-muted-foreground mt-1">Avis négatifs 👎</p>
            </div>
            <div className="border border-border rounded-xl p-5 bg-card text-center">
              <p className="text-3xl font-bold text-[#5B6BF5]">
                {totalFeedback > 0 ? Math.round((feedbackPositive / totalFeedback) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Satisfaction</p>
            </div>
          </div>

          {/* Top questions */}
          <div className="border border-border rounded-xl bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Questions les plus fréquentes</h3>
            </div>
            <div className="divide-y divide-border">
              {(analytics.top_questions ?? []).length === 0 && (
                <p className="text-muted-foreground text-sm px-5 py-6">Aucune question pour l&apos;instant</p>
              )}
              {(analytics.top_questions ?? []).map((q, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                  <p className="text-sm truncate flex-1">{q.question}</p>
                  <span className="text-xs font-semibold bg-[#5B6BF5]/10 text-[#5B6BF5] px-2 py-0.5 rounded-full flex-shrink-0">
                    ×{q.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
