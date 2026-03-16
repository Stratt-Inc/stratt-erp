"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, Send, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  liked?: boolean | null;
}

export default function PublicChatPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strict, setStrict] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/public/chatbot/chat/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text, strict }),
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
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, liked } : m))
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "hsl(234 42% 7%)", color: "#fff" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-4 border-b"
        style={{ borderColor: "hsl(234 30% 14%)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)",
            boxShadow: "0 4px 14px rgba(91,107,245,0.4)",
          }}
        >
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-none">STRATT</p>
          <p className="text-white/40 text-[10px] mt-0.5">Assistant nomenclature M14/M57</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-white/50">Mode strict</span>
            <button
              onClick={() => setStrict((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${strict ? "bg-[#5B6BF5]" : "bg-white/10"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${strict ? "translate-x-4" : ""}`}
              />
            </button>
          </label>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl w-full mx-auto">
        {messages.length === 0 && !loading && (
          <div className="text-center pt-16 space-y-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "rgba(91,107,245,0.15)" }}
            >
              <Zap className="w-7 h-7 text-[#5B6BF5]" />
            </div>
            <p className="text-white/70 font-medium">
              Posez votre question sur la nomenclature budgétaire
            </p>
            <p className="text-white/30 text-sm">
              Exemple : &ldquo;Quel code pour l&apos;achat de papier de bureau ?&rdquo;
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "text-white"
                  : "text-white/90"
              }`}
              style={
                m.role === "user"
                  ? { background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)" }
                  : { background: "hsl(234 35% 14%)", border: "1px solid hsl(234 30% 20%)" }
              }
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === "assistant" && m.id && (
                <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid hsl(234 30% 20%)" }}>
                  <span className="text-white/30 text-xs">Utile ?</span>
                  <button
                    onClick={() => sendFeedback(m.id!, true)}
                    className={`p-1 rounded transition-colors ${m.liked === true ? "text-emerald-400" : "text-white/30 hover:text-white/60"}`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => sendFeedback(m.id!, false)}
                    className={`p-1 rounded transition-colors ${m.liked === false ? "text-red-400" : "text-white/30 hover:text-white/60"}`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-2"
              style={{ background: "hsl(234 35% 14%)", border: "1px solid hsl(234 30% 20%)" }}
            >
              <Loader2 className="w-4 h-4 text-[#5B6BF5] animate-spin" />
              <span className="text-white/40 text-sm">Analyse en cours…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: "hsl(234 30% 14%)", background: "hsl(234 42% 7%)" }}
      >
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#5B6BF5]/50"
            style={{ background: "hsl(234 35% 12%)", border: "1px solid hsl(234 30% 18%)" }}
            placeholder="Décrivez l'achat ou la dépense…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
            style={{ background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)" }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-center text-white/20 text-[10px] mt-2">
          Propulsé par STRATT · Classification M14/M57
        </p>
      </div>
    </div>
  );
}
