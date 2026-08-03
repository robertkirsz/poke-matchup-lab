# Poké Matchup Lab

A playful, focused Pokémon defensive matchup finder powered by [PokéAPI](https://pokeapi.co/). Fuzzy-search for a Pokémon and immediately see which attack types hit harder, are resisted, have no effect, or deal neutral damage.

## Features

- Forgiving fuzzy search with keyboard navigation
- Correct combined multipliers for dual-type Pokémon
- Clear `4×`, `2×`, `0.5×`, `0.25×`, `0×`, and neutral results
- Responsive Pokédex-inspired interface
- Installable PWA with an offline app shell and cached PokéAPI results

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm test
```

## Technology

Next.js, React, Vinext, Cloudflare Workers, and PokéAPI.

Poké Matchup Lab is an unofficial fan utility and is not affiliated with or endorsed by Nintendo, Game Freak, or The Pokémon Company.
