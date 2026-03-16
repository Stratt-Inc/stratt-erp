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

  // Letters that have at least one term
  const activeLetter = new Set(
    GLOSSAIRE.map((t) => (t.sigle ?? t.terme)[0].toUpperCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <BookOpen size={24} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Glossaire</h1>
          <p className="text-sm text-gray-500">
            {GLOSSAIRE.length} termes de la commande publique — Code de la Commande Publique (CCP)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setLetter(null); }}
          placeholder="Rechercher un terme, un sigle ou une définition..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {["Toutes", ...CATEGORIES_GLOSSAIRE].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === cat
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={
              category === cat
                ? { background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)" }
                : {}
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Alphabet nav */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setLetter(null)}
          className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
            !letter ? "text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
          style={!letter ? { background: "#5B6BF5" } : {}}
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
                ? "text-gray-700 hover:bg-gray-100"
                : "text-gray-200 cursor-default"
            }`}
            style={letter === l ? { background: "#5B6BF5" } : {}}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400">{filtered.length} terme{filtered.length > 1 ? "s" : ""}</p>

      {/* Terms list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun terme trouvé</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((term) => {
            const key = term.sigle ?? term.terme;
            const isOpen = expanded === key;
            return (
              <div
                key={key}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {term.sigle && (
                      <span className="shrink-0 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded font-mono">
                        {term.sigle}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {term.terme}
                      </p>
                      {!isOpen && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {term.definition.slice(0, 90)}…
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">
                      {term.categorie}
                    </span>
                    <ChevronRight
                      size={14}
                      className={`text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {term.definition}
                    </p>
                    {term.exemple && (
                      <p className="text-sm text-gray-500 italic bg-white border border-gray-200 rounded-lg px-3 py-2">
                        💡 {term.exemple}
                      </p>
                    )}
                    <div className="flex items-center gap-4 flex-wrap">
                      {term.ccp && (
                        <span className="text-xs text-gray-400 font-mono bg-white border border-gray-200 px-2 py-0.5 rounded">
                          {term.ccp}
                        </span>
                      )}
                      {term.legifrance && (
                        <a
                          href={term.legifrance}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
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

      <p className="text-center text-xs text-gray-400 pb-4">
        Sources : Code de la Commande Publique (CCP) — Legifrance · Mis à jour 2024
      </p>
    </div>
  );
}
