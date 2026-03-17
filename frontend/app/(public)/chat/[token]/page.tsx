"use client";

import { useState, useRef, useEffect, use } from "react";
import { Send, ThumbsUp, ThumbsDown, Loader2, Bot, User, Sparkles, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  liked?: boolean | null;
}

const SUGGESTIONS = [
  "Quel code pour l'achat de papier de bureau ?",
  "Comment classer une flotte de PC portables ?",
  "Maintenance des climatiseurs — quelle famille ?",
  "Seuil de procédure pour des prestations de nettoyage ?",
];

const DEMO_CONVERSATIONS: Record<string, Message[]> = {
  "demo-token-agents-compta-2026": [
    { role: "user", content: "Quel code pour l'achat de papier de bureau ?" },
    { role: "assistant", content: "Le papier de bureau relève du code **01.02 – Fournitures de bureau**.\n\nCe code couvre tous les consommables bureautiques courants (papier, stylos, classeurs…). Seuil de procédure applicable : **90 000 € HT**. En dessous, une procédure adaptée (MAPA) suffit." },
    { role: "user", content: "Et pour des cartouches d'encre ?" },
    { role: "assistant", content: "Les cartouches d'encre et toners sont également classés en **01.02 – Fournitures de bureau**, sous-catégorie consommables d'impression.\n\nMême seuil : **90 000 € HT**. Si l'achat est groupé avec du matériel informatique, vérifiez si la part dominante est informatique (code 02.01)." },
  ],
  "demo-token-drh-expire": [
    { role: "user", content: "Comment classer une formation professionnelle pour les agents ?" },
    { role: "assistant", content: "Les formations professionnelles relèvent du code **04.02 – Services de formation**.\n\nCe code couvre les prestations de formation continue, coaching et e-learning. Seuil : **90 000 € HT**. Au-delà, appel d'offres ouvert obligatoire selon l'art. L2124-2 CCP 2024." },
    { role: "user", content: "Et pour la médecine du travail ?" },
    { role: "assistant", content: "La médecine du travail relève du code **04.05 – Services de santé au travail**.\n\nInclut les visites médicales, examens complémentaires et actions de prévention. Attention : ce type de prestation peut être soumis à des règles spécifiques selon que le service est internalisé ou externalisé auprès d'un organisme agréé." },
  ],
};

function getDemoMessages(token: string): Message[] {
  if (DEMO_CONVERSATIONS[token]) return DEMO_CONVERSATIONS[token];
  // Fallback générique pour tout token demo-*
  return [
    { role: "user", content: "Comment classer l'achat d'une flotte de PC portables ?" },
    { role: "assistant", content: "L'achat de PC portables relève de la famille **Fournitures**, sous-famille **Fournitures informatiques** (code **02.01**).\n\nSeuil de procédure : **90 000 € HT** — au-delà, procédure formalisée (appel d'offres ouvert) requise selon l'art. L2124-1 CCP 2024." },
    { role: "user", content: "Quel code pour des prestations de nettoyage des locaux ?" },
    { role: "assistant", content: "Les prestations de nettoyage relèvent du code **03.01 – Services de nettoyage**.\n\n⚠️ Ce type de marché dépasse fréquemment le seuil de **221 000 € HT**, imposant une procédure formalisée avec publication au JOUE." },
  ];
}

/** Parse **bold** → <strong> */
function renderContent(text: string) {
  return text.split("**").map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold">{part}</strong>
      : <span key={i}>{part}</span>
  );
}

export default function PublicChatPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const isDemo = token.startsWith("demo-");
  const [messages, setMessages] = useState<Message[]>(() => isDemo ? getDemoMessages(token) : []);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strict, setStrict] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading || isDemo) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/public/chatbot/chat/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: msg, strict }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur du serveur");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: json.data?.message_id, role: "assistant", content: json.data?.response ?? "" },
      ]);
    } catch {
      setError("Impossible de contacter le serveur");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (msgId: string, liked: boolean) => {
    await fetch(`${API_URL}/api/public/chatbot/chat/${token}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message_id: msgId, liked }),
    });
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, liked } : m)));
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{
      backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(92,147,255,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(36,221,184,0.04) 0%, transparent 50%)",
    }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #5C93FF, #24DDB8)" }}>
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-foreground tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            stratt
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">Assistant nomenclature · CCP 2024</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <Sparkles className="w-3 h-3" style={{ color: "#8B5CF6" }} />
            <span className="text-[10px] font-semibold" style={{ color: "#8B5CF6" }}>Propulsé par Claude</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[11px] text-muted-foreground">Strict</span>
            <button
              onClick={() => setStrict((v) => !v)}
              className="relative flex-shrink-0 rounded-full transition-colors"
              style={{ width: 36, height: 20, background: strict ? "#5C93FF" : "hsl(var(--muted))" }}
            >
              <span className="absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                style={{ transform: strict ? "translateX(18px)" : "translateX(2px)" }} />
            </button>
          </label>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto">
        {isEmpty && (
          <div className="flex flex-col items-center text-center pt-12 pb-8 space-y-6">
            {/* Hero */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(92,147,255,0.12))", border: "1px solid rgba(92,147,255,0.15)" }}>
              <Bot className="w-8 h-8" style={{ color: "#5C93FF" }} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-[18px] font-extrabold text-foreground" style={{ letterSpacing: "-0.02em" }}>
                Assistant de classification
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Décrivez un achat ou une dépense — je vous indique le code nomenclature, la famille et le seuil de procédure applicable.
              </p>
            </div>

            {/* Suggestions */}
            <div className="w-full space-y-2 max-w-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
                Questions fréquentes
              </p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-card text-left text-sm text-foreground hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
                >
                  <span>{s}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}
                style={m.role === "assistant"
                  ? { background: "linear-gradient(135deg, #8B5CF6, #5C93FF)" }
                  : { background: "rgba(92,147,255,0.1)" }}>
                {m.role === "user"
                  ? <User className="w-3.5 h-3.5 text-primary" />
                  : <Bot className="w-3.5 h-3.5 text-white" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[82%] flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user" ? "rounded-tr-sm text-white" : "rounded-tl-sm text-foreground bg-card border border-border"
                }`}
                  style={m.role === "user" ? { background: "linear-gradient(135deg, #5C93FF, #24DDB8)" } : undefined}>
                  <p className="whitespace-pre-wrap">{renderContent(m.content)}</p>
                </div>

                {m.role === "assistant" && m.id && (
                  <div className="flex items-center gap-1.5 mt-1.5 px-1">
                    <span className="text-[10px] text-muted-foreground">Utile ?</span>
                    <button onClick={() => sendFeedback(m.id!, true)}
                      className={`p-1 rounded-lg transition-colors ${m.liked === true ? "text-emerald-500" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => sendFeedback(m.id!, false)}
                      className={`p-1 rounded-lg transition-colors ${m.liked === false ? "text-red-400" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #5C93FF)" }}>
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#5C93FF" }} />
                <span className="text-sm text-muted-foreground">Analyse en cours…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <p className="text-red-500 text-xs bg-red-500/8 border border-red-500/20 px-4 py-2 rounded-lg">{error}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border bg-card/80 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-2xl mx-auto">
          {isDemo ? (
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-sm text-muted-foreground"
              style={{ borderColor: "rgba(92,147,255,0.25)", background: "rgba(92,147,255,0.04)" }}>
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#5C93FF" }} />
              <span className="text-[12px] font-medium">Mode démo — la saisie est désactivée sur ce lien</span>
            </div>
          ) : (
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  rows={1}
                  className="w-full resize-none rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  style={{ minHeight: 44, maxHeight: 120 }}
                  placeholder="Décrivez l'achat ou la dépense…"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
              </div>
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #5C93FF, #24DDB8)" }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
          <p className="text-center text-muted-foreground/40 text-[10px] mt-2">
            stratt · Classification budgétaire M14/M57 · Code de la Commande Publique 2024
          </p>
        </div>
      </div>
    </div>
  );
}
