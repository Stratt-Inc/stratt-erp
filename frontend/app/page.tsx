"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

const modules = [
  {
    id: "crm",
    name: "CRM",
    description: "Contacts, leads et opportunités",
    color: "#5C93FF",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "accounting",
    name: "Comptabilité",
    description: "Comptes, transactions, rapports",
    color: "#10B981",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" />
      </svg>
    ),
  },
  {
    id: "billing",
    name: "Facturation",
    description: "Devis, factures, paiements",
    color: "#F59E0B",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "inventory",
    name: "Inventaire",
    description: "Stocks, produits, mouvements",
    color: "#6366F1",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: "hr",
    name: "RH",
    description: "Employés, congés, paie",
    color: "#EC4899",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    id: "procurement",
    name: "Achats",
    description: "Commandes fournisseurs",
    color: "#8B5CF6",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Tableaux de bord temps réel",
    color: "#06B6D4",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

const features = [
  {
    title: "Multi-tenant sécurisé",
    description:
      "RBAC granulaire par organisation. Isolation des données garantie avec Row-Level Security PostgreSQL.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "IA intégrée",
    description:
      "Agents Claude pour automatiser vos workflows — analyse, génération documentaire et recommandations intelligentes.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    title: "API-first",
    description:
      "Intégrez vos outils existants facilement. REST API complète avec authentification JWT et documentation OpenAPI.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

const stats = [
  { value: "500+", label: "Organisations" },
  { value: "99.9%", label: "Disponibilité" },
  { value: "7", label: "Modules" },
  { value: "24/7", label: "Support" },
];

// ─── NetworkViz ───────────────────────────────────────────────────────────────

const NODES: { x: number; y: number }[] = [
  { x: 60,   y: 80  }, { x: 160,  y: 40  }, { x: 260,  y: 100 }, { x: 360,  y: 60  },
  { x: 460,  y: 120 }, { x: 560,  y: 50  }, { x: 660,  y: 90  }, { x: 760,  y: 40  },
  { x: 860,  y: 110 }, { x: 960,  y: 60  }, { x: 1060, y: 100 }, { x: 1140, y: 70  },
  { x: 80,   y: 180 }, { x: 180,  y: 160 }, { x: 280,  y: 200 }, { x: 400,  y: 170 },
  { x: 500,  y: 210 }, { x: 600,  y: 160 }, { x: 700,  y: 200 }, { x: 800,  y: 150 },
  { x: 900,  y: 200 }, { x: 1000, y: 170 }, { x: 1100, y: 190 }, { x: 1150, y: 220 },
  { x: 50,   y: 290 }, { x: 150,  y: 270 }, { x: 250,  y: 310 }, { x: 370,  y: 280 },
  { x: 470,  y: 320 }, { x: 580,  y: 270 }, { x: 680,  y: 300 }, { x: 790,  y: 270 },
  { x: 880,  y: 310 }, { x: 980,  y: 280 }, { x: 1080, y: 300 }, { x: 1160, y: 310 },
  { x: 100,  y: 370 }, { x: 300,  y: 360 }, { x: 600,  y: 380 }, { x: 900,  y: 360 }, { x: 1100, y: 370 },
];

// Precompute connections (distance < 160)
const NET_CONNECTIONS: [number, number][] = (() => {
  const conns: [number, number][] = [];
  for (let i = 0; i < NODES.length; i++) {
    for (let j = i + 1; j < NODES.length; j++) {
      const dx = NODES[i].x - NODES[j].x;
      const dy = NODES[i].y - NODES[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < 160) {
        conns.push([i, j]);
      }
    }
  }
  return conns;
})();

interface NetworkVizProps {
  activationLevel: number;
  height?: number;
  className?: string;
}

function NetworkViz({ activationLevel, height = 400, className = "" }: NetworkVizProps) {
  const activeCount = Math.floor(activationLevel * NODES.length);

  return (
    <svg
      width="100%"
      height={height}
      viewBox="0 0 1200 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Connections */}
      {NET_CONNECTIONS.map(([i, j], idx) => {
        const active = i < activeCount && j < activeCount;
        return (
          <line
            key={idx}
            x1={NODES[i].x} y1={NODES[i].y}
            x2={NODES[j].x} y2={NODES[j].y}
            stroke={active ? "rgba(36,221,184,0.45)" : "rgba(92,147,255,0.07)"}
            strokeWidth={active ? 1.2 : 0.8}
          />
        );
      })}

      {/* Nodes */}
      {NODES.map((node, i) => {
        const active = i < activeCount;
        return (
          <g key={i}>
            {active && (
              <circle cx={node.x} cy={node.y} r={8} fill="none" stroke="rgba(36,221,184,0.3)" strokeWidth={1}>
                <animate attributeName="r" values="8;16" dur={`${1.5 + (i % 5) * 0.3}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0" dur={`${1.5 + (i % 5) * 0.3}s`} repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={node.x} cy={node.y}
              r={active ? 4 : 2.5}
              fill={active ? "#24DDB8" : "rgba(92,147,255,0.25)"}
              style={{ transition: "fill 0.5s" }}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Brand Components ─────────────────────────────────────────────────────

interface TTIconFilledProps {
  size: number;
  color: string;
  style?: React.CSSProperties;
  className?: string;
}

function TTIconFilled({ size, color, style, className }: TTIconFilledProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180.61 180.61"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path d="M171.61,0H9C4.03,0,0,4.03,0,9v162.61c0,4.97,4.03,9,9,9h162.61c4.97,0,9-4.03,9-9V9c0-4.97-4.03-9-9-9ZM138.01,78.32h-30.93v2.4l8.94,6.7c1.15.86,1.83,2.21,1.83,3.65v20.73c0,3.29.57,5.45,1.75,6.62,1.17,1.15,3.34,1.72,6.62,1.72,1.04,0,2.06-.05,3-.13.65-.05,1.3-.13,1.98-.26v12.78c-1.41.21-2.92.34-4.51.42-4.75.21-9.31.18-13.4-.44-2.43-.37-4.59-1.1-6.44-2.16-1.8-1.04-3.23-2.56-4.3-4.49-1.04-1.96-1.59-4.59-1.59-7.77v-36.4c0-1.85-1.51-3.36-3.36-3.36h-31.06v2.4l8.97,6.7c1.15.86,1.83,2.21,1.83,3.64v20.74c0,3.29.57,5.45,1.75,6.62,1.15,1.15,3.31,1.72,6.6,1.72,1.04,0,2.06-.05,3-.13.65-.05,1.3-.13,2.01-.26v12.78c-1.41.21-2.92.34-4.51.42-4.77.21-9.34.18-13.4-.44-2.45-.37-4.59-1.1-6.44-2.16-1.83-1.04-3.26-2.5-4.33-4.49-1.04-1.96-1.56-4.56-1.56-7.77v-36.38c0-1.86-1.53-3.39-3.39-3.39h-14.45v-10.87h21.33c1.44,0,2.61-1.17,2.61-2.61v-17.29h10.8v16.51c0,1.87,1.52,3.39,3.39,3.39h23.73c1.44,0,2.61-1.17,2.61-2.61v-17.29h10.8v16.51c0,1.87,1.52,3.39,3.39,3.39h16.77v10.87Z" />
    </svg>
  );
}

interface TTIconOutlineProps {
  size: number;
  color: string;
  style?: React.CSSProperties;
  className?: string;
}

function TTIconOutline({ size, color, style, className }: TTIconOutlineProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180.61 180.61"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path fillRule="evenodd" d="M171.61,3.41c3.08,0,5.59,2.51,5.59,5.59v162.61c0,3.08-2.51,5.59-5.59,5.59H9c-3.08,0-5.59-2.51-5.59-5.59V9c0-3.08,2.51-5.59,5.59-5.59h162.61M171.61,0H9C4.03,0,0,4.03,0,9v162.61c0,4.97,4.03,9,9,9h162.61c4.97,0,9-4.03,9-9V9c0-4.97-4.03-9-9-9h0Z" />
      <path d="M107.09,78.32v2.4l8.94,6.7c1.15.86,1.83,2.21,1.83,3.65v20.73c0,3.29.57,5.45,1.75,6.62,1.17,1.15,3.34,1.72,6.62,1.72,1.04,0,2.06-.05,3-.13.65-.05,1.3-.13,1.98-.26v12.78c-1.41.21-2.92.34-4.51.42-4.75.21-9.31.18-13.4-.44-2.43-.37-4.59-1.1-6.44-2.16-1.8-1.04-3.23-2.56-4.3-4.49-1.04-1.96-1.59-4.59-1.59-7.77v-36.4c0-1.85-1.51-3.36-3.36-3.36h-31.06v2.4l8.97,6.7c1.15.86,1.83,2.21,1.83,3.64v20.74c0,3.29.57,5.45,1.75,6.62,1.15,1.15,3.31,1.72,6.6,1.72,1.04,0,2.06-.05,3-.13.65-.05,1.3-.13,2.01-.26v12.78c-1.41.21-2.92.34-4.51.42-4.77.21-9.34.18-13.4-.44-2.45-.37-4.59-1.1-6.44-2.16-1.83-1.04-3.26-2.5-4.33-4.49-1.04-1.96-1.56-4.56-1.56-7.77v-36.38c0-1.86-1.53-3.39-3.39-3.39h-14.45v-10.87h21.33c1.44,0,2.61-1.17,2.61-2.61v-17.29h10.8v16.51c0,1.87,1.52,3.39,3.39,3.39h23.73c1.44,0,2.61-1.17,2.61-2.61v-17.29h10.8v16.51c0,1.87,1.52,3.39,3.39,3.39h16.77v10.87h-30.93Z" />
    </svg>
  );
}

interface StrattWordmarkProps {
  width: number;
  color: string;
  style?: React.CSSProperties;
  className?: string;
}

function StrattWordmark({ width, color, style, className }: StrattWordmarkProps) {
  const height = width * (113.29 / 411.86);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 411.86 113.29"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path d="M70.48,67.76c-2.49-1.77-5.39-3.24-8.6-4.33-3.28-1.09-6.66-2.05-10.07-2.83-3.34-.78-6.66-1.5-9.9-2.18-3.24-.68-6.21-1.43-8.74-2.29-2.63-.89-4.78-2.01-6.42-3.45-1.74-1.5-2.63-3.45-2.63-5.84,0-1.98.51-3.62,1.54-4.85.96-1.13,2.18-2.05,3.58-2.66,1.37-.58,2.87-.96,4.54-1.16,1.57-.17,3.07-.24,4.44-.24,4.37,0,8.23.85,11.47,2.53,3.21,1.67,5.09,4.78,5.6,9.22h20.96c-.51-4.78-1.84-8.84-3.89-12.01-2.22-3.41-5.05-6.18-8.4-8.23-3.34-2.05-7.24-3.55-11.54-4.4-8.74-1.77-18.33-1.74-27.13-.1-4.37.82-8.33,2.25-11.81,4.27-3.45,1.98-6.25,4.74-8.36,8.19-2.08,3.41-3.14,7.92-3.14,13.31,0,3.65.75,6.72,2.22,9.22,1.5,2.53,3.52,4.64,5.97,6.28,2.49,1.67,5.39,3.07,8.6,4.1,3.24,1.06,6.66,1.98,10.07,2.73,8.5,1.81,15.26,3.62,20,5.43,5.12,1.91,7.71,4.88,7.71,8.84,0,2.32-.58,4.27-1.67,5.8-1.09,1.5-2.46,2.7-4.06,3.62-1.57.85-3.34,1.5-5.29,1.91-4.54.96-8.64.72-12.46-.24-2.29-.61-4.33-1.5-6.08-2.73-1.77-1.26-3.24-2.87-4.37-4.81-1.02-1.77-1.57-3.86-1.67-6.21H0c.34,5.26,1.6,9.69,3.79,13.21,2.32,3.75,5.32,6.79,8.94,9.04,3.65,2.29,7.88,3.96,12.59,4.95,9.32,1.95,19.42,1.95,28.94.07,4.61-.92,8.81-2.56,12.39-4.85,3.55-2.25,6.48-5.29,8.7-9.01,2.18-3.72,3.31-8.4,3.31-13.93,0-3.86-.75-7.13-2.25-9.73-1.47-2.63-3.48-4.85-5.94-6.62Z" />
      <path d="M118.27,21.61V0h-14.13s0,22.62,0,22.62c0,1.88-1.53,3.41-3.41,3.41h-19.05v14.24h10.07c2.42,0,4.4,1.98,4.4,4.4v47.65c0,4.2.68,7.65,2.05,10.17,1.4,2.53,3.28,4.51,5.63,5.87,2.42,1.4,5.26,2.35,8.46,2.83,5.32.82,11.3.85,17.54.58,2.05-.1,4.03-.27,5.87-.55v-16.72c-.89.17-1.74.27-2.59.34-1.23.1-2.56.17-3.93.17-4.3,0-7.13-.75-8.67-2.25-1.54-1.54-2.25-4.37-2.25-8.67v-27.07c0-1.91-.9-3.7-2.42-4.84l-11.71-8.77v-3.14h31.57v-14.23h-13.04c-2.42,0-4.4-1.98-4.4-4.44Z" />
      <path d="M185.64,24.99c-2.7.85-5.29,2.08-7.68,3.69-2.39,1.57-4.51,3.48-6.35,5.7-1.84,2.22-3.34,4.64-4.4,7.24l-.24.55h-1.74v-16.14h-20.96v85.09h22.12v-38.26c0-3.96.41-7.71,1.19-11.09.82-3.45,2.18-6.52,4.1-9.11,1.91-2.63,4.51-4.71,7.61-6.25,4.16-1.98,9.59-2.7,16.08-2.01,1.16.14,2.18.27,3.11.41v-20.48c-1.6-.41-3.07-.61-4.37-.61-2.9,0-5.77.41-8.46,1.3Z" />
      <path d="M281.21,92.68v-45.16c0-5.05-1.13-9.15-3.38-12.19-2.25-3.07-5.22-5.5-8.74-7.2-3.65-1.74-7.68-2.94-12.01-3.52-9.11-1.3-18.26-1.33-27.34.48-4.61.92-8.84,2.49-12.56,4.68-3.69,2.15-6.76,5.09-9.11,8.64-2.25,3.38-3.58,7.61-3.99,12.59h22.15c.55-4.51,2.22-7.85,4.95-9.9,2.83-2.12,6.72-3.17,11.6-3.17,2.15,0,4.2.14,6.08.44,1.91.27,3.65.85,5.19,1.77,1.5.92,2.73,2.22,3.65,3.82.92,1.67,1.37,3.86,1.37,6.55.14,2.7-.72,4.81-2.49,6.28-1.64,1.37-3.82,2.39-6.69,3.11-2.76.68-5.8,1.19-9.39,1.54-3.41.34-6.93.79-10.51,1.33-3.58.58-7.13,1.33-10.58,2.25-3.41.92-6.48,2.32-9.15,4.16-2.59,1.81-4.78,4.3-6.42,7.34-1.67,3.04-2.53,7-2.53,11.78,0,4.33.75,8.12,2.18,11.23,1.43,3.07,3.48,5.7,6.08,7.71,2.53,2.05,5.6,3.58,9.08,4.57,3.55.99,7.37,1.47,11.37,1.47,5.26,0,10.48-.75,15.53-2.29,4.98-1.54,9.35-4.23,13.04-8.02l1.33-1.33.14,1.84c.14,1.43.34,2.83.58,4.2.27,1.26.55,2.35.89,3.41h22.12c-.82-1.81-1.4-4.16-1.77-7.1-.44-3.52-.65-7.34-.65-11.33ZM259.06,78.41c0,1.37-.14,3.17-.44,5.46-.27,2.32-1.06,4.64-2.36,6.96-1.3,2.29-3.31,4.27-6.01,5.9-2.7,1.67-6.52,2.49-11.37,2.49-1.88,0-3.79-.17-5.67-.51-1.91-.38-3.55-.99-5.02-1.88-1.47-.92-2.63-2.18-3.48-3.75-.85-1.6-1.3-3.55-1.3-5.77,0-2.42.44-4.37,1.3-5.97.82-1.54,1.95-2.87,3.34-3.89,1.37-.99,2.94-1.77,4.78-2.39,1.74-.55,3.55-1.02,5.39-1.37,1.74-.31,3.65-.58,5.77-.85,1.81-.21,3.62-.48,5.39-.82s3.34-.75,4.74-1.23c1.43-.48,2.56-1.09,3.52-1.95l1.4-1.23v10.79Z" />
      <path d="M411.86,40.28v-14.23h-21.95c-2.45,0-4.44-1.99-4.44-4.44V0h-14.13s0,22.62,0,22.62c0,1.88-1.53,3.41-3.41,3.41h-31.06c-2.45,0-4.44-1.98-4.44-4.43V0h-14.13s0,22.62,0,22.62c0,1.88-1.53,3.41-3.41,3.41h-27.92v14.24h18.91c2.44,0,4.44,2,4.44,4.44v47.61c0,4.2.68,7.61,2.05,10.17,1.4,2.59,3.28,4.51,5.67,5.87,2.42,1.4,5.22,2.35,8.43,2.83,5.32.82,11.3.85,17.54.58,2.08-.1,4.06-.27,5.9-.55v-16.72c-.92.17-1.77.27-2.63.34-1.23.1-2.56.17-3.93.17-4.3,0-7.13-.75-8.64-2.25-1.54-1.54-2.29-4.37-2.29-8.67v-27.15c0-1.88-.89-3.64-2.39-4.77l-11.74-8.77v-3.14h40.65c2.42,0,4.4,1.98,4.4,4.4v47.65c0,4.16.72,7.61,2.08,10.17,1.4,2.53,3.28,4.51,5.63,5.87,2.42,1.4,5.26,2.35,8.43,2.83,5.36.82,11.33.85,17.54.58,2.08-.1,4.06-.27,5.9-.55v-16.72c-.89.17-1.74.27-2.59.34-1.23.1-2.56.17-3.93.17-4.3,0-7.13-.75-8.67-2.25-1.54-1.54-2.29-4.37-2.29-8.67v-27.13c0-1.88-.89-3.65-2.39-4.78l-11.71-8.77v-3.14h40.48Z" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mount flag
  useEffect(() => {
    setMounted(true);
  }, []);

  // Locomotive Scroll v5 (dynamic import)
  useEffect(() => {
    let ls: InstanceType<typeof import("locomotive-scroll").default> | null = null;
    import("locomotive-scroll").then(({ default: LocomotiveScroll }) => {
      ls = new LocomotiveScroll({
        lenisOptions: { lerp: 0.07, duration: 1.2, smoothWheel: true },
      });
    });
    return () => {
      ls?.destroy();
    };
  }, []);

  // Scroll progress
  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) setScrollProgress(window.scrollY / maxScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // IntersectionObserver for reveal animations
  useEffect(() => {
    if (!mounted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("in-view");
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll("[data-reveal], [data-reveal-left]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [mounted]);

  // NetworkViz activation: scrollProgress 0→0.3 maps to 0→1
  const networkActivation = Math.min(1, scrollProgress / 0.3);

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#09111E", overflowX: "clip" }}
      className="min-h-screen text-[#F0F4FF]"
    >
      {/* ── Global styles ── */}
      <style>{`
        html { scroll-behavior: smooth; }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-left {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes pulse-node {
          0%, 100% { r: 6; opacity: 0.7; }
          50%       { r: 10; opacity: 0.3; }
        }
        @keyframes float-orb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes chip-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        [data-reveal] {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        [data-reveal].in-view {
          opacity: 1;
          transform: translateY(0);
        }
        [data-reveal-left] {
          opacity: 0;
          transform: translateX(-28px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        [data-reveal-left].in-view {
          opacity: 1;
          transform: translateX(0);
        }

        [data-reveal-delay="1"] { transition-delay: 0.1s; }
        [data-reveal-delay="2"] { transition-delay: 0.2s; }
        [data-reveal-delay="3"] { transition-delay: 0.3s; }
        [data-reveal-delay="4"] { transition-delay: 0.4s; }
        [data-reveal-delay="5"] { transition-delay: 0.5s; }
        [data-reveal-delay="6"] { transition-delay: 0.6s; }

        .orb-a { animation: float-orb  9s ease-in-out infinite; }
        .orb-b { animation: float-orb 12s ease-in-out infinite 2s; }
        .chip-1 { animation: chip-float 3.2s ease-in-out infinite; }
        .chip-2 { animation: chip-float 3.8s ease-in-out infinite 0.6s; }
        .chip-3 { animation: chip-float 2.9s ease-in-out infinite 1.2s; }

        .text-gradient-hero {
          background: linear-gradient(135deg, #5C93FF, #24DDB8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Hover glow for module cards */
        .module-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .module-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(92,147,255,0.1); }

        /* Feature card left accent */
        .feature-card { border-left: 2px solid rgba(36,221,184,0.4); }

        /* Nav link hover */
        .nav-link { transition: color 0.15s; }
        .nav-link:hover { color: #F0F4FF; }

        /* CTA button hover */
        .btn-primary { transition: filter 0.2s, transform 0.2s; }
        .btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }

        .hero-grid {
          background-image:
            linear-gradient(rgba(92,147,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92,147,255,0.05) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .nav-blur {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .cta-grid {
          background-image:
            linear-gradient(rgba(92,147,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92,147,255,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }
      `}</style>

      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <nav
        className="nav-blur fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16"
        style={{ background: "rgba(9,17,30,0.85)", borderBottom: "1px solid rgba(92,147,255,0.08)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 select-none">
          <TTIconFilled size={32} color="#24DDB8" />
          <StrattWordmark width={90} color="#F0F4FF" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#modules"
            className="nav-link text-sm font-medium"
            style={{ color: "#BABABA" }}
          >
            Modules
          </Link>
          <Link
            href="#features"
            className="nav-link text-sm font-medium"
            style={{ color: "#BABABA" }}
          >
            Fonctionnalités
          </Link>
          <Link
            href="/login"
            className="nav-link text-sm font-medium"
            style={{ color: "#BABABA" }}
          >
            Se connecter
          </Link>
        </div>

        {/* CTA */}
        <Link
          href="/signup"
          className="btn-primary hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#24DDB8", color: "#09111E" }}
        >
          Essayer gratuitement
        </Link>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section
        className="relative hero-grid flex flex-col items-center justify-center text-center overflow-hidden pt-32 pb-0"
        style={{ minHeight: "100vh", background: "#09111E" }}
      >
        {/* Orb blue — top-left */}
        <div
          className="orb-a absolute pointer-events-none"
          style={{
            top: "-10%",
            left: "-8%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(92,147,255,0.18) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Orb green — bottom-right */}
        <div
          className="orb-b absolute pointer-events-none"
          style={{
            bottom: "5%",
            right: "-5%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(36,221,184,0.14) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* TTIconOutline watermark — centered absolute */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.045,
            zIndex: 1,
          }}
        >
          <TTIconOutline size={520} color="#5C93FF" />
        </div>

        {/* Foreground content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center gap-6">
          {/* Badge */}
          <div
            className="chip-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{
              background: "rgba(36,221,184,0.1)",
              border: "1px solid rgba(36,221,184,0.35)",
              color: "#24DDB8",
              animation: "fade-in 0.6s ease both",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#24DDB8", display: "inline-block" }} />
            Achat Public · Marchés Publics
          </div>

          {/* H1 */}
          <h1
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              animation: "fade-in 0.7s 0.1s ease both",
              opacity: 0,
            }}
          >
            La plateforme{" "}
            <span className="text-gradient-hero">intelligente</span>
            <br />
            pour l&apos;achat public.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "#BABABA",
              maxWidth: "600px",
              lineHeight: 1.6,
              animation: "fade-in 0.7s 0.22s ease both",
              opacity: 0,
            }}
          >
            Centralisez vos achats, contrats et fournisseurs dans une plateforme
            unifiée alimentée par l&apos;IA Claude.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center gap-3"
            style={{ animation: "fade-in 0.7s 0.34s ease both", opacity: 0 }}
          >
            <Link
              href="/signup"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold"
              style={{ background: "#24DDB8", color: "#09111E" }}
            >
              Démarrer gratuitement
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5"
              style={{ border: "1px solid rgba(92,147,255,0.35)", color: "#F0F4FF", background: "rgba(92,147,255,0.05)" }}
            >
              Voir la démo
            </Link>
          </div>

          {/* Demo credentials */}
          <div
            className="inline-flex items-center gap-3 px-4 py-2 rounded-lg text-xs"
            style={{
              background: "rgba(9,17,30,0.7)",
              border: "1px solid rgba(92,147,255,0.15)",
              color: "#BABABA",
              animation: "fade-in 0.7s 0.46s ease both",
              opacity: 0,
            }}
          >
            <span>Démo :</span>
            <code style={{ color: "#5C93FF", fontFamily: "monospace" }}>admin@stratt.io</code>
            <span style={{ color: "rgba(186,186,186,0.4)" }}>/</span>
            <code style={{ color: "#5C93FF", fontFamily: "monospace" }}>admin1234</code>
          </div>

          {/* Social proof */}
          <div
            className="flex items-center gap-3 text-xs"
            style={{
              color: "#BABABA",
              animation: "fade-in 0.7s 0.56s ease both",
              opacity: 0,
            }}
          >
            <div className="flex items-center gap-1">
              {["#5C93FF", "#24DDB8", "#EC4899", "#F59E0B"].map((c, i) => (
                <span
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: c,
                    display: "inline-block",
                    border: "1.5px solid rgba(9,17,30,0.8)",
                    marginLeft: i > 0 ? -3 : 0,
                  }}
                />
              ))}
            </div>
            <span>Rejoignez 500+ organisations</span>
          </div>
        </div>

        {/* NetworkViz — hero base visual */}
        <div className="relative z-10 w-full mt-12" style={{ height: 360 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 0%, rgba(9,17,30,0.75) 100%)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          {mounted && (
            <NetworkViz
              activationLevel={networkActivation}
              height={360}
              className="w-full"
            />
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          MARQUEE DIVIDER
      ══════════════════════════════════════ */}
      <div
        style={{
          background: "rgba(14,25,41,0.9)",
          borderTop: "1px solid rgba(92,147,255,0.08)",
          borderBottom: "1px solid rgba(92,147,255,0.08)",
          overflow: "hidden",
          padding: "14px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            whiteSpace: "nowrap",
            animation: "marquee 28s linear infinite",
            width: "max-content",
          }}
        >
          {[0, 1].map((rep) => (
            <span key={rep} style={{ display: "inline-flex", alignItems: "center" }}>
              {[
                "stratt", "ERP", "CRM", "Achats", "Comptabilité",
                "Analytics", "RH", "Facturation",
              ].map((item, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginRight: "2.5rem" }}>
                  {item === "stratt" ? (
                    <TTIconFilled size={12} color="#24DDB8" style={{ flexShrink: 0 }} />
                  ) : (
                    <span style={{ color: "#24DDB8", fontSize: "0.6rem" }}>◆</span>
                  )}
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: item === "stratt" ? "#5C93FF" : "#BABABA",
                    }}
                  >
                    {item}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          STATS
      ══════════════════════════════════════ */}
      <section
        className="py-24 px-6"
        style={{
          background: "#09111E",
          borderTop: "1px solid rgba(92,147,255,0.07)",
          borderBottom: "1px solid rgba(92,147,255,0.07)",
        }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              data-reveal
              data-reveal-delay={String(i + 1)}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span
                style={{
                  fontSize: "clamp(2.2rem, 5vw, 3.2rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  background: "linear-gradient(135deg, #5C93FF, #24DDB8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#BABABA",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          MODULES
      ══════════════════════════════════════ */}
      <section id="modules" className="relative py-24 px-6" style={{ background: "#09111E" }}>
        {/* Background TTIconOutline watermark */}
        <div
          className="absolute pointer-events-none"
          style={{ bottom: 0, right: 0, opacity: 0.03, zIndex: 0 }}
        >
          <TTIconOutline size={200} color="#5C93FF" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col items-center text-center gap-4 mb-16">
            <div
              data-reveal
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(92,147,255,0.1)",
                border: "1px solid rgba(92,147,255,0.3)",
                color: "#5C93FF",
              }}
            >
              7 modules intégrés
            </div>
            <h2
              data-reveal
              data-reveal-delay="1"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
              }}
            >
              Tout ce dont votre{" "}
              <span className="text-gradient-hero">organisation a besoin</span>
            </h2>
            <p
              data-reveal
              data-reveal-delay="2"
              style={{ color: "#BABABA", maxWidth: "520px", lineHeight: 1.6 }}
            >
              Des modules pensés pour l&apos;achat public, intégrés nativement pour
              une expérience fluide et cohérente.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod, i) => (
              <div
                key={mod.id}
                data-reveal
                data-reveal-delay={String((i % 6) + 1)}
                className="module-card rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden"
                style={{
                  background: "#0E1929",
                  border: "1px solid rgba(92,147,255,0.1)",
                }}
              >
                {/* Card number */}
                <span
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 16,
                    fontSize: "0.68rem",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "rgba(92,147,255,0.2)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ background: `${mod.color}1A`, color: mod.color }}
                >
                  {mod.icon}
                </div>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px" }}>
                    {mod.name}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#BABABA", lineHeight: 1.5 }}>
                    {mod.description}
                  </div>
                </div>
                <div className="mt-auto">
                  <a
                    href="#"
                    className="inline-flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: mod.color }}
                  >
                    →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section id="features" className="py-24 px-6" style={{ background: "#0A1422" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            {/* Left — sticky brand + tagline */}
            <div className="lg:w-5/12 flex flex-col gap-6 lg:sticky lg:top-24">
              {/* Prominent TTIconOutline brand element */}
              <div data-reveal-left>
                <TTIconOutline size={220} color="#24DDB8" style={{ opacity: 0.9 }} />
              </div>

              <div
                data-reveal-left
                data-reveal-delay="1"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold w-fit"
                style={{
                  background: "rgba(36,221,184,0.08)",
                  border: "1px solid rgba(36,221,184,0.3)",
                  color: "#24DDB8",
                }}
              >
                Architecture
              </div>
              <h2
                data-reveal-left
                data-reveal-delay="2"
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.025em",
                }}
              >
                Conçu pour{" "}
                <span className="text-gradient-hero">la performance</span>
              </h2>
              <p
                data-reveal-left
                data-reveal-delay="3"
                style={{ color: "#BABABA", lineHeight: 1.7, maxWidth: "440px" }}
              >
                Architecture cloud-native, sécurité enterprise et intégration IA
                pour que vos équipes se concentrent sur l&apos;essentiel.
              </p>

              {/* Stat pills */}
              <div
                data-reveal-left
                data-reveal-delay="4"
                className="flex flex-wrap gap-2"
              >
                {["99.9% uptime", "SOC2", "RGPD"].map((pill) => (
                  <span
                    key={pill}
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      border: "1px solid rgba(36,221,184,0.25)",
                      color: "#24DDB8",
                      background: "rgba(36,221,184,0.06)",
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — feature cards */}
            <div className="lg:w-7/12 flex flex-col gap-5">
              {features.map((feat, i) => (
                <div
                  key={feat.title}
                  data-reveal
                  data-reveal-delay={String(i + 1)}
                  className="feature-card rounded-2xl p-6 flex flex-col gap-3"
                  style={{
                    background: "rgba(14,25,41,0.8)",
                    border: "1px solid rgba(92,147,255,0.1)",
                    paddingLeft: "1.75rem",
                  }}
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg"
                    style={{ background: "rgba(36,221,184,0.1)", color: "#24DDB8" }}
                  >
                    {feat.icon}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{feat.title}</div>
                  <div style={{ color: "#BABABA", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    {feat.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TECH STACK
      ══════════════════════════════════════ */}
      <section className="py-16 px-6" style={{ background: "#09111E" }}>
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
          <p
            data-reveal
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#BABABA",
              fontFamily: "monospace",
            }}
          >
            Stack technique
          </p>
          <div
            data-reveal
            data-reveal-delay="1"
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              { label: "Next.js 15", color: "#F0F4FF" },
              { label: "Go 1.24", color: "#5C93FF" },
              { label: "PostgreSQL 16", color: "#24DDB8" },
              { label: "Redis", color: "#EC4899" },
              { label: "Claude AI", color: "#F59E0B" },
              { label: "Docker", color: "#5C93FF" },
            ].map((tech) => (
              <span
                key={tech.label}
                className="px-4 py-1.5 rounded-full text-sm font-semibold"
                style={{
                  border: `1px solid ${tech.color}33`,
                  color: tech.color,
                  background: `${tech.color}0D`,
                  letterSpacing: "0.02em",
                }}
              >
                {tech.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: "#09111E" }}>
        <div className="max-w-4xl mx-auto">
          <div
            data-reveal
            className="relative rounded-3xl p-12 md:p-16 flex flex-col items-center text-center gap-8 overflow-hidden cta-grid"
            style={{
              background: "#0E1929",
              border: "1px solid rgba(36,221,184,0.18)",
            }}
          >
            {/* Green glow bottom-center */}
            <div
              style={{
                position: "absolute",
                bottom: "-40%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "500px",
                height: "300px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(36,221,184,0.12) 0%, transparent 70%)",
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />

            {/* TTIconFilled in glowing container */}
            <div
              className="relative z-10 flex items-center justify-center w-20 h-20 rounded-2xl"
              style={{
                background: "rgba(36,221,184,0.1)",
                border: "1px solid rgba(36,221,184,0.3)",
                boxShadow: "0 0 32px rgba(36,221,184,0.15)",
              }}
            >
              <TTIconFilled size={48} color="#24DDB8" />
            </div>

            {/* StrattWordmark */}
            <div className="relative z-10">
              <StrattWordmark width={160} color="rgba(240,244,255,0.8)" />
            </div>

            <h2
              className="relative z-10"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              Prêt à transformer votre{" "}
              <span className="text-gradient-hero">gestion&nbsp;?</span>
            </h2>

            <p
              className="relative z-10"
              style={{ color: "#BABABA", maxWidth: "460px", lineHeight: 1.7 }}
            >
              Rejoignez plus de 500 organisations qui font confiance à Stratt
              pour piloter leurs achats publics avec efficacité et transparence.
            </p>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/signup"
                className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold"
                style={{ background: "#24DDB8", color: "#09111E" }}
              >
                Démarrer gratuitement
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5"
                style={{ border: "1px solid rgba(240,244,255,0.15)", color: "#F0F4FF" }}
              >
                Compte démo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer
        className="py-10 px-6 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{
          borderTop: "1px solid rgba(92,147,255,0.08)",
          background: "#09111E",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <TTIconFilled size={24} color="#24DDB8" />
          <StrattWordmark width={80} color="rgba(186,186,186,0.7)" />
        </div>

        {/* Links */}
        <nav className="flex items-center gap-6">
          {[
            { label: "Confidentialité", href: "#" },
            { label: "CGU", href: "#" },
            { label: "Documentation", href: "#" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              style={{ color: "#BABABA", fontSize: "0.8rem" }}
              className="hover:text-[#F0F4FF] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Copyright */}
        <p style={{ color: "#BABABA", fontSize: "0.78rem" }}>
          © {new Date().getFullYear()} Stratt. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
