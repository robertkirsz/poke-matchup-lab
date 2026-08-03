import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Pokémon matchup app", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Poké Matchup Lab<\/title>/i);
  assert.match(html, /Find your matchup\./);
  assert.match(html, /Search Pokémon by name/);
  assert.match(html, /PokéAPI/);
  assert.match(html, /Scanning the archive/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/);
});

test("ships fuzzy search, dual-type damage calculation, and an installable PWA", async () => {
  const [page, layout, packageJson, manifest, serviceWorker] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
  ]);

  assert.match(page, /function fuzzyScore/);
  assert.match(page, /damage_relations\.double_damage_from/);
  assert.match(page, /multipliers\[attack\.name\] \*= 2/);
  assert.match(page, /multipliers\[attack\.name\] \*= 0\.5/);
  assert.match(page, /multipliers\[attack\.name\] = 0/);
  assert.match(page, /pokemon\?limit=2000/);
  assert.match(page, /aria-autocomplete="list"/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /serviceWorker\.register\("\/sw\.js"/);
  assert.match(layout, /title: "Poké Matchup Lab"/);
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.match(layout, /images: \[\{ url: `\$\{origin\}\/og\.png`/);
  assert.deepEqual(JSON.parse(manifest).icons.map(({ sizes }) => sizes), ["192x192", "512x512"]);
  assert.match(serviceWorker, /POKEAPI_CACHE/);
  assert.match(serviceWorker, /event\.respondWith/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});

test("keeps the visual direction contract in the production output", async () => {
  const bundle = await readFile(new URL("../dist/server/index.js", import.meta.url), "utf8");
  assert.match(bundle, /seed df6a4ece/);
  assert.match(bundle, /unreviewed and undocumented is unfinished/);
});
