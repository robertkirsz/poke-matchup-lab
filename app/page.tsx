"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";

type NamedResource = {
  name: string;
  url: string;
};

type PokemonDetail = {
  id: number;
  name: string;
  height: number;
  weight: number;
  species: NamedResource;
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: {
        front_default: string | null;
      };
    };
  };
  types: Array<{
    slot: number;
    type: NamedResource;
  }>;
};

type PokemonSpeciesDetail = {
  evolution_chain: { url: string } | null;
};

type EvolutionChainNode = {
  species: NamedResource;
  evolves_to: EvolutionChainNode[];
};

type EvolutionChainDetail = {
  chain: EvolutionChainNode;
};

type EvolutionStage = {
  name: string;
  id: number;
  depth: number;
};

type TypeDetail = {
  damage_relations: {
    double_damage_from: NamedResource[];
    half_damage_from: NamedResource[];
    no_damage_from: NamedResource[];
  };
};

type Matchup = {
  name: string;
  multiplier: number;
};

type LoadStatus = "loading" | "ready" | "error";
type EvolutionStatus = "loading" | "ready" | "error";

const API_ROOT = "https://pokeapi.co/api/v2";

const ATTACK_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

const TYPE_COLORS: Record<string, string> = {
  normal: "#a8a77a",
  fire: "#ee8130",
  water: "#6390f0",
  electric: "#f7d02c",
  grass: "#7ac74c",
  ice: "#96d9d6",
  fighting: "#c22e28",
  poison: "#a33ea1",
  ground: "#e2bf65",
  flying: "#a98ff3",
  psychic: "#f95587",
  bug: "#a6b91a",
  rock: "#b6a136",
  ghost: "#735797",
  dragon: "#6f35fc",
  dark: "#705746",
  steel: "#b7b7ce",
  fairy: "#d685ad",
};

function normalize(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

function fuzzyScore(query: string, candidate: string) {
  const needle = normalize(query);
  const haystack = normalize(candidate);

  if (!needle) return Number.POSITIVE_INFINITY;
  if (needle === haystack) return 0;
  if (haystack.startsWith(needle)) return 10 + (haystack.length - needle.length) / 100;

  const containedAt = haystack.indexOf(needle);
  if (containedAt >= 0) {
    return 20 + containedAt + (haystack.length - needle.length) / 100;
  }

  let queryIndex = 0;
  let previousMatch = -1;
  let gapScore = 0;

  for (let index = 0; index < haystack.length && queryIndex < needle.length; index += 1) {
    if (haystack[index] === needle[queryIndex]) {
      if (previousMatch >= 0) gapScore += index - previousMatch - 1;
      previousMatch = index;
      queryIndex += 1;
    }
  }

  if (queryIndex !== needle.length) return Number.POSITIVE_INFINITY;
  return 50 + gapScore * 2 + (haystack.length - needle.length) / 10;
}

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resourceId(url: string) {
  const parts = url.split("/").filter(Boolean);
  return Number(parts.at(-1));
}

function pokemonNumber(url: string) {
  const id = resourceId(url);
  return Number.isFinite(id) ? String(id).padStart(4, "0") : "----";
}

function evolutionStages(node: EvolutionChainNode, depth = 0): EvolutionStage[] {
  return [
    { name: node.species.name, id: resourceId(node.species.url), depth },
    ...node.evolves_to.flatMap((nextStage) => evolutionStages(nextStage, depth + 1)),
  ];
}

function formatMultiplier(multiplier: number) {
  return `${multiplier}×`;
}

function calculateMatchups(typeDetails: TypeDetail[]): Matchup[] {
  const multipliers = Object.fromEntries(ATTACK_TYPES.map((type) => [type, 1])) as Record<string, number>;

  for (const detail of typeDetails) {
    for (const attack of detail.damage_relations.double_damage_from) {
      if (attack.name in multipliers) multipliers[attack.name] *= 2;
    }

    for (const attack of detail.damage_relations.half_damage_from) {
      if (attack.name in multipliers) multipliers[attack.name] *= 0.5;
    }

    for (const attack of detail.damage_relations.no_damage_from) {
      if (attack.name in multipliers) multipliers[attack.name] = 0;
    }
  }

  return ATTACK_TYPES.map((name) => ({ name, multiplier: multipliers[name] }));
}

function TypeBadge({ name, multiplier }: { name: string; multiplier?: number }) {
  const darkText = ["normal", "fire", "water", "electric", "grass", "ice", "ground", "flying", "psychic", "bug", "rock", "steel", "fairy"].includes(name);

  return (
    <span
      className={`type-badge${darkText ? " type-badge--dark-text" : ""}`}
      style={{ "--type-color": TYPE_COLORS[name] ?? "#727272" } as React.CSSProperties}
    >
      <span>{titleCase(name)}</span>
      {multiplier !== undefined ? <strong>{formatMultiplier(multiplier)}</strong> : null}
    </span>
  );
}

function MatchupTray({
  title,
  note,
  items,
  tone,
  emptyText,
}: {
  title: string;
  note: string;
  items: Matchup[];
  tone: "danger" | "safe" | "immune";
  emptyText: string;
}) {
  return (
    <section className={`matchup-tray matchup-tray--${tone}`}>
      <div className="tray-heading">
        <h3>{title}</h3>
        <p>{note}</p>
      </div>
      <div className="badge-row">
        {items.length ? (
          items.map((item) => (
            <TypeBadge key={item.name} name={item.name} multiplier={item.multiplier} />
          ))
        ) : (
          <span className="empty-tray">{emptyText}</span>
        )}
      </div>
    </section>
  );
}

const APP_STYLES = `
  :root {
    --ink: #17212b;
    --paper: #fffaf0;
    --cream: #f5edda;
    --yellow: #f6cf33;
    --red: #d93636;
    --red-dark: #9f2029;
    --blue: #3b82c4;
    --blue-dark: #1e4f7b;
    --lcd: #dbeae3;
    --white: #fff;
    --header-red: #df3d3d;
    --focus-blue: #1b65a0;
    --status-green: #2c8f67;
    --text-primary-muted: #4c5660;
    --text-secondary: #59636d;
    --text-specimen: #425d57;
    --tray-danger: #ffe3df;
    --tray-safe: #e3f1e6;
    --tray-immune: #e9e5ef;
    --brand-ring: #23303b;
    --red-on-dark: #ffe9e9;
    --light-cyan: #62d8ff;
    --light-yellow: #f4d63d;
    --light-green: #68d27b;
    --text-placeholder: #707983;
    --text-hint: #626c76;
    --text-status: #28524c;
    --text-archive: #506862;
    --text-tray: #4e5963;
    --text-details: #46505a;
    --text-state: #5b6670;
    --type-dark-text: #1d282f;
    --divider-cream: #e2d9c6;
  }

  * { box-sizing: border-box; }

  html { min-width: 320px; background: var(--yellow); }

  body {
    min-height: 100vh;
    margin: 0;
    color: var(--ink);
    background-color: var(--yellow);
    background-image: radial-gradient(rgba(23, 33, 43, 0.13) 1px, transparent 1.5px);
    background-size: 14px 14px;
    font-family: var(--font-geist-sans), sans-serif;
  }

  button, input { font: inherit; }
  button, a { -webkit-tap-highlight-color: transparent; }

  .app-page {
    min-height: 100vh;
    padding: clamp(18px, 4vw, 48px);
    display: grid;
    place-items: center;
  }

  .pokedex-shell {
    width: min(1120px, 100%);
    overflow: hidden;
    border-radius: 26px;
    background: var(--red);
    box-shadow: 0 22px 50px rgba(92, 42, 18, 0.28), 0 7px 0 var(--red-dark);
  }

  .shell-header {
    min-height: 78px;
    padding: 14px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    color: var(--white);
    border-bottom: 2px solid rgba(89, 12, 21, 0.38);
    background: var(--header-red);
  }

  .brand-lockup { display: flex; align-items: center; gap: 12px; min-width: 0; }

  .brand-ball {
    position: relative;
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    border: 3px solid var(--white);
    border-radius: 50%;
    background: linear-gradient(to bottom, var(--red) 0 43%, var(--ink) 43% 57%, var(--paper) 57% 100%);
    box-shadow: 0 4px 10px rgba(89, 12, 21, 0.25);
  }

  .brand-ball::after {
    content: "";
    position: absolute;
    inset: 50% auto auto 50%;
    width: 10px;
    height: 10px;
    transform: translate(-50%, -50%);
    border: 3px solid var(--brand-ring);
    border-radius: 50%;
    background: var(--white);
  }

  .brand-name {
    margin: 0;
    font-size: clamp(1.15rem, 2vw, 1.55rem);
    font-weight: 900;
    letter-spacing: -0.035em;
  }

  .brand-subtitle { margin: 2px 0 0; color: var(--red-on-dark); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; }

  .device-lights { display: flex; align-items: center; gap: 8px; }
  .device-light { width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 -2px 2px rgba(0, 0, 0, 0.25); }
  .device-light:nth-child(1) { background: var(--light-cyan); }
  .device-light:nth-child(2) { background: var(--light-yellow); }
  .device-light:nth-child(3) { background: var(--light-green); }

  .shell-body {
    padding: clamp(18px, 3vw, 30px);
    display: grid;
    grid-template-columns: minmax(290px, 0.84fr) minmax(380px, 1.16fr);
    gap: clamp(16px, 2.4vw, 28px);
  }

  .left-deck, .report-deck {
    min-width: 0;
    border-radius: 16px;
    background: var(--paper);
  }

  .left-deck { padding: clamp(20px, 3vw, 32px); }

  .intro h1 {
    max-width: 460px;
    margin: 0;
    font-size: clamp(2.3rem, 5vw, 4.9rem);
    line-height: 0.9;
    letter-spacing: -0.04em;
    text-wrap: balance;
  }

  .intro p {
    max-width: 47ch;
    margin: 18px 0 22px;
    color: var(--text-primary-muted);
    font-size: 0.98rem;
    line-height: 1.55;
  }

  .search-wrap { position: relative; z-index: 5; }

  .search-box {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 6px;
    border: 3px solid var(--ink);
    border-radius: 14px;
    background: var(--white);
  }

  .search-input {
    width: 100%;
    min-width: 0;
    height: 50px;
    padding: 0 13px;
    border: 0;
    outline: 0;
    color: var(--ink);
    background: transparent;
    font-size: 1rem;
    font-weight: 750;
  }

  .search-input::placeholder { color: var(--text-placeholder); opacity: 1; }

  .search-box:focus-within {
    outline: 4px solid rgba(59, 130, 196, 0.28);
    outline-offset: 2px;
  }

  .scan-button {
    min-width: 86px;
    min-height: 50px;
    padding: 0 16px;
    border: 0;
    border-radius: 10px;
    color: var(--white);
    background: var(--blue-dark);
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.09em;
    cursor: pointer;
    transition: background 160ms ease, transform 160ms ease;
  }

  .scan-button:hover { background: #173e61; }
  .scan-button:active { transform: translateY(1px); }
  .scan-button:disabled { cursor: not-allowed; opacity: 0.52; transform: none; }
  .scan-button:disabled:hover { background: var(--blue-dark); }
  .scan-button:focus-visible, .suggestion:focus-visible, summary:focus-visible, a:focus-visible { outline: 3px solid var(--focus-blue); outline-offset: 3px; }

  .suggestions {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    left: 0;
    max-height: 294px;
    margin: 0;
    padding: 6px;
    overflow-y: auto;
    list-style: none;
    border: 2px solid var(--ink);
    border-radius: 14px;
    background: var(--white);
    box-shadow: 0 12px 24px rgba(23, 33, 43, 0.18);
  }

  .suggestion {
    width: 100%;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border: 0;
    border-radius: 10px;
    color: var(--ink);
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  .suggestion:hover, .suggestion--active { color: var(--white); background: var(--blue-dark); }
  .suggestion strong { font-size: 0.92rem; }
  .suggestion span { opacity: 0.7; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; }

  .search-hint { min-height: 20px; margin: 9px 2px 0; color: var(--text-hint); font-size: 0.78rem; line-height: 1.4; }

  .specimen-card {
    position: relative;
    min-height: 310px;
    margin-top: 22px;
    padding: 16px;
    overflow: hidden;
    display: grid;
    grid-template-rows: auto 1fr auto auto;
    border: 3px solid var(--ink);
    border-radius: 16px;
    background-color: var(--lcd);
    box-shadow: inset 0 0 34px rgba(32, 84, 77, 0.12);
  }

  .specimen-status { margin: 0; display: flex; align-items: center; gap: 7px; color: var(--text-status); font-size: 0.72rem; font-weight: 900; letter-spacing: 0.11em; text-transform: uppercase; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--status-green); box-shadow: 0 0 0 4px rgba(44, 143, 103, 0.13); }

  .art-stage { position: relative; min-height: 190px; display: grid; place-items: center; }
  .art-stage::before {
    content: "";
    position: absolute;
    width: min(220px, 68%);
    aspect-ratio: 1;
    border: 2px solid rgba(35, 81, 75, 0.17);
    border-radius: 50%;
    box-shadow: inset 0 0 0 30px rgba(255, 255, 255, 0.2);
  }

  .pokemon-art {
    position: relative;
    z-index: 1;
    width: min(235px, 78%);
    max-height: 225px;
    object-fit: contain;
    filter: drop-shadow(0 13px 8px rgba(30, 76, 70, 0.2));
    animation: settle-in 480ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes settle-in {
    from { transform: translateY(14px) scale(0.96); filter: drop-shadow(0 4px 4px rgba(30, 76, 70, 0.08)); }
    to { transform: translateY(0) scale(1); filter: drop-shadow(0 13px 8px rgba(30, 76, 70, 0.2)); }
  }

  .specimen-label {
    position: relative;
    z-index: 2;
    padding: 12px 13px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    border-top: 2px solid rgba(23, 33, 43, 0.22);
    background: rgba(255, 255, 255, 0.5);
  }

  .pokemon-id { margin: 0 0 2px; color: var(--text-archive); font-size: 0.72rem; font-weight: 850; letter-spacing: 0.1em; }
  .pokemon-name { margin: 0; font-size: clamp(1.55rem, 3vw, 2.2rem); line-height: 1; letter-spacing: -0.03em; }
  .pokemon-measurements { margin: 5px 0 0; color: var(--text-specimen); font-size: 0.72rem; font-weight: 700; }
  .pokemon-types { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }

  .evolution-archive {
    position: relative;
    z-index: 2;
    padding: 8px 9px 7px;
    border-top: 2px solid rgba(23, 33, 43, 0.22);
    background: rgba(255, 255, 255, 0.5);
  }

  .evolution-stage-row { padding: 2px 2px 4px; display: flex; gap: 6px; overflow-x: auto; scrollbar-width: thin; scrollbar-color: rgba(23, 33, 43, 0.34) transparent; }

  .evolution-stage {
    position: relative;
    min-width: 74px;
    min-height: 76px;
    padding: 4px 6px 6px;
    display: grid;
    justify-items: center;
    align-content: center;
    border: 2px solid rgba(23, 33, 43, 0.34);
    border-radius: 10px;
    color: var(--ink);
    background: var(--paper);
    cursor: pointer;
    transition: border-color 150ms ease, transform 150ms ease, background-color 150ms ease;
  }

  .evolution-stage:hover:not(:disabled) { border-color: var(--blue-dark); background: var(--white); transform: translateY(-2px); }
  .evolution-stage:focus-visible { outline: 3px solid var(--blue); outline-offset: 2px; }
  .evolution-stage:disabled { color: var(--paper); border-color: var(--blue-dark); background: var(--blue-dark); cursor: default; }
  .evolution-stage-number { position: absolute; top: 6px; left: 7px; color: currentColor; opacity: 0.68; font-size: 0.67rem; font-weight: 900; line-height: 1; }
  .evolution-stage img { width: 40px; height: 40px; object-fit: contain; image-rendering: auto; }
  .evolution-stage strong { max-width: 66px; overflow: hidden; font-size: 0.72rem; line-height: 1.15; text-overflow: ellipsis; white-space: nowrap; }
  .evolution-stage small { margin-top: 2px; opacity: 0.68; font-size: 0.67rem; font-weight: 800; letter-spacing: 0.06em; }
  .evolution-unavailable { margin: 10px 0 2px; color: var(--text-specimen); font-size: 0.72rem; font-weight: 700; }

  .report-deck { padding: clamp(20px, 3vw, 30px); display: flex; flex-direction: column; }
  .report-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .report-heading h2 { margin: 0; font-size: clamp(1.75rem, 3.4vw, 2.7rem); letter-spacing: -0.04em; }
  .report-heading p { max-width: 42ch; margin: 8px 0 0; color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; }

  .matchup-count {
    min-width: 62px;
    padding: 8px 10px;
    border-radius: 10px;
    color: var(--white);
    background: var(--ink);
    text-align: center;
    font-size: 0.67rem;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .matchup-count strong { display: block; font-size: 1.25rem; letter-spacing: -0.04em; }
  .trays { margin-top: 21px; display: grid; gap: 12px; }

  .matchup-tray {
    padding: 16px;
    display: grid;
    grid-template-columns: minmax(120px, 0.46fr) minmax(180px, 1fr);
    align-items: center;
    gap: 18px;
    border-radius: 14px;
    background: var(--cream);
  }

  .matchup-tray--danger { background: var(--tray-danger); }
  .matchup-tray--safe { background: var(--tray-safe); }
  .matchup-tray--immune { background: var(--tray-immune); }

  .tray-heading h3 { margin: 0; font-size: 1.03rem; letter-spacing: -0.02em; }
  .tray-heading p { margin: 4px 0 0; color: var(--text-tray); font-size: 0.72rem; line-height: 1.35; }
  .badge-row { display: flex; flex-wrap: wrap; gap: 7px; }

  .type-badge {
    min-height: 30px;
    padding: 5px 8px 5px 10px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    color: var(--white);
    background: var(--type-color);
    font-size: 0.72rem;
    font-weight: 850;
    line-height: 1;
  }

  .type-badge--dark-text { color: var(--type-dark-text); }
  .type-badge strong { min-width: 27px; padding: 4px 5px; border-radius: 999px; color: var(--white); background: rgba(23, 33, 43, 0.72); text-align: center; font-size: 0.64rem; }

  .empty-tray { color: var(--text-secondary); font-size: 0.78rem; font-style: italic; }

  .neutral-details { margin-top: 14px; border-top: 2px solid var(--divider-cream); }
  .neutral-details summary { padding: 14px 0 6px; color: var(--text-details); font-size: 0.78rem; font-weight: 800; cursor: pointer; }
  .neutral-details .badge-row { padding-top: 8px; }

  .report-note { margin: auto 0 0; padding-top: 18px; color: var(--text-secondary); font-size: 0.72rem; line-height: 1.45; }
  .report-note strong { color: var(--ink); }

  .state-panel {
    min-height: 100%;
    padding: 30px;
    display: grid;
    place-items: center;
    text-align: center;
  }

  .state-inner { max-width: 360px; }

  .scanner {
    position: relative;
    width: 92px;
    height: 92px;
    margin: 0 auto 22px;
    border: 4px solid var(--ink);
    border-radius: 50%;
    background: linear-gradient(to bottom, var(--red) 0 45%, var(--ink) 45% 55%, var(--white) 55% 100%);
    animation: scan-pulse 1.1s ease-in-out infinite;
  }

  .scanner::after { content: ""; position: absolute; inset: 50% auto auto 50%; width: 22px; height: 22px; transform: translate(-50%, -50%); border: 4px solid var(--ink); border-radius: 50%; background: var(--white); }
  @keyframes scan-pulse { 0%, 100% { transform: scale(0.96); } 50% { transform: scale(1.04); } }

  .state-panel h2 { margin: 0; font-size: 1.7rem; letter-spacing: -0.035em; }
  .state-panel p { margin: 10px 0 0; color: var(--text-state); font-size: 0.88rem; line-height: 1.55; }
  .error-mark { width: 66px; height: 66px; margin: 0 auto 20px; display: grid; place-items: center; border-radius: 50%; color: var(--white); background: var(--red-dark); font-size: 1.8rem; font-weight: 900; }

  .shell-footer {
    padding: 12px 24px 17px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    color: var(--red-on-dark);
    font-size: 0.72rem;
    line-height: 1.4;
  }

  .shell-footer p { margin: 0; }
  .shell-footer a { color: var(--white); font-weight: 850; text-underline-offset: 3px; }

  @media (max-width: 820px) {
    .app-page { display: block; padding: 16px; }
    .shell-body { grid-template-columns: 1fr; }
    .intro h1 { max-width: 620px; font-size: clamp(2.5rem, 11vw, 4.8rem); }
    .specimen-card { min-height: 340px; }
  }

  @media (max-width: 520px) {
    .app-page { padding: 0; }
    .pokedex-shell { min-height: 100vh; border-radius: 0; box-shadow: none; }
    .shell-header { min-height: 68px; padding: 12px 16px; }
    .brand-ball { width: 36px; height: 36px; }
    .brand-subtitle { display: none; }
    .shell-body { padding: 12px; gap: 12px; }
    .left-deck, .report-deck { border-radius: 14px; }
    .left-deck, .report-deck { padding: 18px; }
    .intro h1 { font-size: clamp(2.45rem, 14vw, 3.7rem); }
    .intro p { margin-top: 14px; }
    .scan-button { min-width: 72px; padding: 0 11px; }
    .specimen-card { min-height: 300px; }
    .pokemon-art { max-height: 195px; }
    .specimen-label { align-items: flex-start; flex-direction: column; }
    .pokemon-types { justify-content: flex-start; }
    .evolution-archive { margin-top: 0; }
    .report-heading { align-items: center; }
    .report-heading p { display: none; }
    .matchup-tray { grid-template-columns: 1fr; gap: 11px; }
    .shell-footer { align-items: flex-start; flex-direction: column; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
  }
`;

export default function Home() {
  const [allPokemon, setAllPokemon] = useState<NamedResource[]>([]);
  const [listError, setListError] = useState(false);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [evolutions, setEvolutions] = useState<EvolutionStage[]>([]);
  const [evolutionStatus, setEvolutionStatus] = useState<EvolutionStatus>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerServiceWorker = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    };

    if (document.readyState === "complete") registerServiceWorker();
    else window.addEventListener("load", registerServiceWorker, { once: true });
    return () => window.removeEventListener("load", registerServiceWorker);
  }, []);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];

    return allPokemon
      .map((entry) => ({ entry, score: fuzzyScore(query, entry.name) }))
      .filter((candidate) => Number.isFinite(candidate.score))
      .sort((a, b) => a.score - b.score || a.entry.name.localeCompare(b.entry.name))
      .slice(0, 8)
      .map((candidate) => candidate.entry);
  }, [allPokemon, query]);

  const loadPokemon = useCallback(async (name: string) => {
    const requestedName = name.trim().toLowerCase();
    if (!requestedName) return;

    setStatus("loading");
    setEvolutionStatus("loading");
    setEvolutions([]);
    setError("");
    setIsOpen(false);

    try {
      const pokemonResponse = await fetch(`${API_ROOT}/pokemon/${encodeURIComponent(requestedName)}`);
      if (!pokemonResponse.ok) throw new Error(pokemonResponse.status === 404 ? "not-found" : "request-failed");

      const pokemonData = (await pokemonResponse.json()) as PokemonDetail;
      const sortedTypes = [...pokemonData.types].sort((a, b) => a.slot - b.slot);
      const typeResponses = await Promise.all(sortedTypes.map(({ type }) => fetch(type.url)));

      if (typeResponses.some((response) => !response.ok)) throw new Error("type-request-failed");

      const typeDetails = (await Promise.all(typeResponses.map((response) => response.json()))) as TypeDetail[];
      try {
        const speciesResponse = await fetch(pokemonData.species.url);
        if (!speciesResponse.ok) throw new Error("species-request-failed");

        const speciesData = (await speciesResponse.json()) as PokemonSpeciesDetail;
        if (speciesData.evolution_chain) {
          const chainResponse = await fetch(speciesData.evolution_chain.url);
          if (!chainResponse.ok) throw new Error("evolution-request-failed");

          const chainData = (await chainResponse.json()) as EvolutionChainDetail;
          setEvolutions(evolutionStages(chainData.chain));
        }
        setEvolutionStatus("ready");
      } catch {
        setEvolutionStatus("error");
      }
      setPokemon({ ...pokemonData, types: sortedTypes });
      setMatchups(calculateMatchups(typeDetails));
      setQuery("");
      setStatus("ready");
    } catch (requestError) {
      setPokemon(null);
      setMatchups([]);
      setEvolutions([]);
      setEvolutionStatus("error");
      setStatus("error");
      setError(
        requestError instanceof Error && requestError.message === "not-found"
          ? "No Pokémon matched that name. Try another spelling or choose a suggestion."
          : "PokéAPI didn’t answer this scan. Check your connection and try again.",
      );
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_ROOT}/pokemon?limit=2000`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("list-request-failed");
        return response.json() as Promise<{ results: NamedResource[] }>;
      })
      .then((data) => setAllPokemon(data.results))
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) setListError(true);
      });

    const initialScan = window.setTimeout(() => void loadPokemon("pikachu"), 0);
    return () => {
      controller.abort();
      window.clearTimeout(initialScan);
    };
  }, [loadPokemon]);

  const weakTo = matchups.filter((item) => item.multiplier > 1).sort((a, b) => b.multiplier - a.multiplier);
  const resists = matchups.filter((item) => item.multiplier > 0 && item.multiplier < 1).sort((a, b) => a.multiplier - b.multiplier);
  const immuneTo = matchups.filter((item) => item.multiplier === 0);
  const neutral = matchups.filter((item) => item.multiplier === 1);
  const choosePokemon = (entry: NamedResource) => {
    setActiveIndex(0);
    void loadPokemon(entry.name);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const bestMatch = suggestions[activeIndex] ?? suggestions[0];
    if (bestMatch) choosePokemon(bestMatch);
    else if (query.trim()) void loadPokemon(query);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const artwork = pokemon?.sprites.other?.["official-artwork"]?.front_default ?? pokemon?.sprites.front_default;

  return (
    <>
      <style>{APP_STYLES}</style>
      <main className="app-page">
        <article className="pokedex-shell" aria-label="Pokémon attack matchup finder">
          <header className="shell-header">
            <div className="brand-lockup">
              <span className="brand-ball" aria-hidden="true" />
              <div>
                <p className="brand-name">Poké Matchup Lab</p>
                <p className="brand-subtitle">Professor’s field archive</p>
              </div>
            </div>
            <div className="device-lights" aria-label="Scanner online">
              <span className="device-light" />
              <span className="device-light" />
              <span className="device-light" />
            </div>
          </header>

          <div className="shell-body">
            <section className="left-deck">
              <div className="intro">
                <h1>Find your matchup.</h1>
                <p>
                  Search any Pokémon—even with a typo—to see which attack types hit harder, get resisted, or do nothing at all.
                </p>
              </div>

              <div className="search-wrap">
                <form className="search-box" role="search" onSubmit={submitSearch}>
                  <input
                    className="search-input"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActiveIndex(0);
                      setIsOpen(true);
                    }}
                    onFocus={() => query.trim() && setIsOpen(true)}
                    onBlur={() => window.setTimeout(() => setIsOpen(false), 100)}
                    onKeyDown={handleKeyDown}
                    placeholder="Try ‘charzard’…"
                    aria-label="Search Pokémon by name"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-controls="pokemon-suggestions"
                    aria-expanded={isOpen && suggestions.length > 0}
                    aria-activedescendant={isOpen && suggestions.length ? `pokemon-option-${activeIndex}` : undefined}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button className="scan-button" type="submit" disabled={!query.trim()}>
                    Scan
                  </button>
                </form>

                {isOpen && suggestions.length > 0 ? (
                  <ul className="suggestions" id="pokemon-suggestions" role="listbox">
                    {suggestions.map((entry, index) => (
                      <li key={entry.name} role="presentation">
                        <button
                          className={`suggestion${index === activeIndex ? " suggestion--active" : ""}`}
                          id={`pokemon-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={index === activeIndex}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => choosePokemon(entry)}
                        >
                          <strong>{titleCase(entry.name)}</strong>
                          <span>#{pokemonNumber(entry.url)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <p className="search-hint">
                  {listError
                    ? "Suggestions are offline, but exact-name searches still work."
                    : query.trim() && allPokemon.length && !suggestions.length
                      ? "No close names yet—keep typing or scan the exact name."
                      : "Use ↑ ↓ and Enter to pick a fuzzy match."}
                </p>
              </div>

              <div className="specimen-card" aria-live="polite">
                {status === "loading" ? (
                  <div className="state-panel">
                    <div className="state-inner">
                      <div className="scanner" aria-hidden="true" />
                      <h2>Scanning the archive…</h2>
                      <p>Matching Pokémon data with its defensive type record.</p>
                    </div>
                  </div>
                ) : status === "error" ? (
                  <div className="state-panel" role="alert">
                    <div className="state-inner">
                      <div className="error-mark" aria-hidden="true">!</div>
                      <h2>Scan missed.</h2>
                      <p>{error}</p>
                    </div>
                  </div>
                ) : pokemon ? (
                  <>
                    <p className="specimen-status"><span className="status-dot" />Specimen locked</p>
                    <div className="art-stage">
                      {/* Native img is intentional: artwork URLs are runtime data and cached by the service worker. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {artwork ? <img className="pokemon-art" src={artwork} alt={titleCase(pokemon.name)} width="475" height="475" /> : null}
                    </div>
                    <div className="specimen-label">
                      <div>
                        <p className="pokemon-id">ARCHIVE #{String(pokemon.id).padStart(4, "0")}</p>
                        <h2 className="pokemon-name">{titleCase(pokemon.name)}</h2>
                        <p className="pokemon-measurements">{(pokemon.height / 10).toFixed(1)} m · {(pokemon.weight / 10).toFixed(1)} kg</p>
                      </div>
                      <div className="pokemon-types" aria-label={`${titleCase(pokemon.name)} types`}>
                        {pokemon.types.map(({ type }) => <TypeBadge key={type.name} name={type.name} />)}
                      </div>
                    </div>
                    <section className="evolution-archive" aria-label="Evolution stages">
                      {evolutionStatus === "ready" && evolutions.length ? (
                        <div className="evolution-stage-row">
                          {evolutions.map((stage) => {
                            const isCurrent = stage.name === pokemon.species.name;
                            const stageName = titleCase(stage.name);

                            return (
                              <button
                                className="evolution-stage"
                                key={stage.name}
                                type="button"
                                disabled={isCurrent}
                                aria-label={isCurrent ? `Current evolution: ${stageName}` : `Load ${stageName} specimen`}
                                onClick={() => void loadPokemon(stage.name)}
                              >
                                <span className="evolution-stage-number" aria-hidden="true">{stage.depth + 1}</span>
                                {/* Native img is intentional: sprite URLs are runtime data and cached by the service worker. */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stage.id}.png`}
                                  alt=""
                                  width="40"
                                  height="40"
                                />
                                <strong>{stageName}</strong>
                                <small>#{String(stage.id).padStart(4, "0")}</small>
                              </button>
                            );
                          })}
                        </div>
                      ) : evolutionStatus === "error" ? (
                        <p className="evolution-unavailable">Evolution record unavailable for this scan.</p>
                      ) : evolutionStatus === "ready" ? (
                        <p className="evolution-unavailable">No known evolution stages.</p>
                      ) : null}
                    </section>
                  </>
                ) : null}
              </div>
            </section>

            <section className="report-deck" aria-live="polite">
              {status === "ready" && pokemon ? (
                <>
                  <div className="report-heading">
                    <div>
                      <h2>Attack readout</h2>
                      <p>Damage multipliers already combine both defending types, so the strongest threats rise to the top.</p>
                    </div>
                    <div className="matchup-count" aria-label={`${weakTo.length} weaknesses`}>
                      <strong>{weakTo.length}</strong> weak
                    </div>
                  </div>

                  <div className="trays">
                    <MatchupTray
                      title="Hits harder"
                      note="Super-effective attacks"
                      items={weakTo}
                      tone="danger"
                      emptyText="No type weaknesses"
                    />
                    <MatchupTray
                      title="Gets resisted"
                      note="Not very effective"
                      items={resists}
                      tone="safe"
                      emptyText="No type resistances"
                    />
                    <MatchupTray
                      title="No effect"
                      note="Immune to these attacks"
                      items={immuneTo}
                      tone="immune"
                      emptyText="No type immunities"
                    />
                  </div>

                  <details className="neutral-details">
                    <summary>Show {neutral.length} neutral attack types (1×)</summary>
                    <div className="badge-row">
                      {neutral.map((item) => <TypeBadge key={item.name} name={item.name} multiplier={item.multiplier} />)}
                    </div>
                  </details>

                  <p className="report-note">
                    <strong>Type chart only.</strong> Abilities, held items, moves, weather, and battle effects can change real damage.
                  </p>
                </>
              ) : (
                <div className="state-panel" aria-hidden="true">
                  <div className="state-inner">
                    <div className="scanner" />
                    <h2>{status === "error" ? "Waiting for a new scan." : "Building matchup report…"}</h2>
                    <p>Weaknesses, resistances, and immunities will appear here.</p>
                  </div>
                </div>
              )}
            </section>
          </div>

          <footer className="shell-footer">
            <p>Unofficial fan utility. Pokémon names and artwork belong to their respective owners.</p>
            <p>Live data from <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">PokéAPI</a></p>
          </footer>
        </article>
      </main>
    </>
  );
}
