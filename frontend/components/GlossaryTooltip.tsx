"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, ExternalLink } from "lucide-react";
import { findTerm } from "@/lib/glossaire";

interface GlossaryTooltipProps {
  term: string;
  children?: React.ReactNode;
}

/**
 * Wraps a term with a contextual popover pulling from the CCP glossary.
 * Usage: <GlossaryTooltip term="MAPA">MAPA</GlossaryTooltip>
 *    or: <GlossaryTooltip term="MAPA" />  → shows just the ? icon
 */
export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const entry = findTerm(term);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!entry) return <>{children ?? term}</>;

  return (
    <span ref={ref} className="inline-flex items-center gap-1 relative">
      {children && (
        <span className="border-b border-dashed border-blue-400 cursor-help" onClick={() => setOpen((v) => !v)}>
          {children}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-blue-400 hover:text-blue-600 transition-colors align-middle"
        aria-label={`Définition : ${term}`}
      >
        <HelpCircle size={13} />
      </button>

      {open && (
        <span
          className="absolute z-50 bottom-full left-0 mb-2 w-72 bg-gray-900 text-white text-xs rounded-xl p-3.5 shadow-2xl"
          style={{ lineHeight: 1.6 }}
        >
          <span className="flex items-center gap-2 mb-1.5">
            {entry.sigle && (
              <span className="px-1.5 py-0.5 bg-blue-600 rounded text-[10px] font-bold">
                {entry.sigle}
              </span>
            )}
            <span className="font-semibold text-white">{entry.terme}</span>
          </span>
          <span className="text-gray-300 block">{entry.definition}</span>
          {entry.exemple && (
            <span className="mt-2 block text-gray-400 italic">Ex : {entry.exemple}</span>
          )}
          <span className="mt-2 flex items-center gap-3">
            {entry.ccp && (
              <span className="text-gray-500 text-[10px]">{entry.ccp}</span>
            )}
            {entry.legifrance && (
              <a
                href={entry.legifrance}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-300 hover:text-blue-200"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={10} />
                Legifrance
              </a>
            )}
          </span>
          {/* Arrow */}
          <span className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
