"use client";

import { useState, useMemo } from "react";
import { Search, BookOpen, ExternalLink, ChevronRight } from "lucide-react";
import { GLOSSAIRE, CATEGORIES_GLOSSAIRE } from "@/lib/glossaire";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function GlossairePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [letter, setLetter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return GLOSSAIRE.filter((t) => {
      const matchCat = category === "Toutes" || t.categorie === category;
      const matchLetter =
        !letter ||
        t.terme.toUpperCase().startsWith(letter) ||
        (t.sigle?.toUpperCase().startsWith(letter) ?? false);
      const matchQ =
        !q ||
        t.terme.toLowerCase().includes(q) ||
        (t.sigle?.toLowerCase().includes(q) ?? false) ||
        t.definition.toLowerCase().includes(q);
      return matchCat && matchLetter && matchQ;
    }).sort((a, b) => (a.sigle ?? a.terme).localeCompare(b.sigle ?? b.terme));
  }, [query, category, letter]);

  const activeLetter = new Set(
    GLOSSAIRE.map((t) => (t.sigle ?? t.terme)[0].toUpperCase())
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(92,147,255,0.12)", border: "1px solid rgba(92,147,255,0.2)" }}>
          <BookOpen size={20} style={{ color: "#5C93FF" }} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-foreground">Glossaire</h1>
          <p className="text-sm text-muted-foreground">
            {GLOSSAIRE.length} termes de la commande publique — Code de la Commande Publique (CCP)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setLetter(null); }}
          placeholder="Rechercher un terme, un sigle ou une définition..."
          className="w-full pl-10 pr-4 py-2 border border-border rounded-xl text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 flex-wrap">
        {["Toutes", ...CATEGORIES_GLOSSAIRE].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              category === cat
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={
              category === cat
                ? { background: "linear-gradient(135deg, #5C93FF, #24DDB8)" }
                : { background: "rgba(30,50,80,0.07)" }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Alphabet nav */}
      <div className="flex flex-wrap gap-0.5">
        <button
          onClick={() => setLetter(null)}
          className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
            !letter ? "text-white" : "text-muted-foreground hover:bg-muted/50"
          }`}
          style={!letter ? { background: "#5C93FF" } : {}}
        >
          Tous
        </button>
        {ALPHABET.map((l) => (
          <button
            key={l}
            disabled={!activeLetter.has(l)}
            onClick={() => setLetter(letter === l ? null : l)}
            className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
              letter === l
                ? "text-white"
                : activeLetter.has(l)
                ? "text-foreground hover:bg-muted/50"
                : "cursor-default"
            }`}
            style={
              letter === l
                ? { background: "#5C93FF" }
                : !activeLetter.has(l)
                ? { color: "rgba(30,50,80,0.15)" }
                : {}
            }
          >
            {l}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">{filtered.length} terme{filtered.length > 1 ? "s" : ""}</p>

      {/* Terms list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Search size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun terme trouvé</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto">
          {filtered.map((term) => {
            const key = term.sigle ?? term.terme;
            const isOpen = expanded === key;
            return (
              <div
                key={key}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="w-full flex items-center gap-4 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {term.sigle && (
                      <span className="shrink-0 px-2 py-0.5 text-xs font-bold rounded font-mono"
                        style={{ background: "rgba(92,147,255,0.12)", color: "#5C93FF" }}>
                        {term.sigle}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {term.terme}
                      </p>
                      {!isOpen && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {term.definition.slice(0, 90)}…
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 text-[10px] rounded-full"
                      style={{ background: "rgba(30,50,80,0.07)", color: "rgba(30,50,80,0.48)" }}>
                      {term.categorie}
                    </span>
                    <ChevronRight
                      size={14}
                      className={`text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 py-3 space-y-2 bg-muted/20">
                    <p className="text-sm text-foreground leading-relaxed">
                      {term.definition}
                    </p>
                    {term.exemple && (
                      <p className="text-sm text-muted-foreground italic border border-border rounded-lg px-3 py-2"
                        style={{ background: "rgba(92,147,255,0.04)" }}>
                        💡 {term.exemple}
                      </p>
                    )}
                    <div className="flex items-center gap-4 flex-wrap">
                      {term.ccp && (
                        <span className="text-xs font-mono border border-border px-2 py-0.5 rounded"
                          style={{ color: "rgba(30,50,80,0.5)" }}>
                          {term.ccp}
                        </span>
                      )}
                      {term.legifrance && (
                        <a
                          href={term.legifrance}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs hover:underline"
                          style={{ color: "#5C93FF" }}
                        >
                          <ExternalLink size={11} />
                          Voir sur Legifrance
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground pb-2">
        Sources : Code de la Commande Publique (CCP) — Legifrance · Mis à jour 2024
      </p>
    </div>
  );
}
