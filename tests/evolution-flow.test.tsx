import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "../app/page";

const resource = (name: string, path: string) => ({
  name,
  url: `https://pokeapi.co/api/v2/${path}`,
});

const pokemon = (name: string, id: number, type = "normal") => ({
  id,
  name,
  height: 3,
  weight: 65,
  species: resource(name, `pokemon-species/${id}/`),
  sprites: {
    front_default: `https://img.test/${name}.png`,
    other: { "official-artwork": { front_default: `https://img.test/${name}-art.png` } },
  },
  types: [{ slot: 1, type: resource(type, `type/${type}/`) }],
});

const noRelations = {
  damage_relations: {
    double_damage_from: [],
    half_damage_from: [],
    no_damage_from: [],
  },
};

function json(data: unknown) {
  return Promise.resolve({ ok: true, json: async () => data });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("evolution archive", () => {
  it("shows every branch and loads a clicked evolution stage", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/pokemon?limit=2000")) {
        return json({ results: [resource("pikachu", "pokemon/25/"), resource("eevee", "pokemon/133/")] });
      }
      if (url.endsWith("/pokemon/pikachu")) return json(pokemon("pikachu", 25, "electric"));
      if (url.endsWith("/pokemon/eevee")) return json(pokemon("eevee", 133));
      if (url.endsWith("/pokemon/jolteon")) return json(pokemon("jolteon", 135, "electric"));
      if (url.includes("/type/")) return json(noRelations);
      if (url.endsWith("/pokemon-species/25/")) {
        return json({ evolution_chain: { url: "https://pokeapi.co/api/v2/evolution-chain/10/" } });
      }
      if (url.endsWith("/evolution-chain/10/")) {
        return json({ chain: { species: resource("pichu", "pokemon-species/172/"), evolves_to: [] } });
      }
      if (url.endsWith("/pokemon-species/133/")) {
        return json({ evolution_chain: { url: "https://pokeapi.co/api/v2/evolution-chain/67/" } });
      }
      if (url.endsWith("/evolution-chain/67/")) {
        return json({
          chain: {
            species: resource("eevee", "pokemon-species/133/"),
            evolves_to: [
              { species: resource("vaporeon", "pokemon-species/134/"), evolves_to: [] },
              { species: resource("jolteon", "pokemon-species/135/"), evolves_to: [] },
              { species: resource("flareon", "pokemon-species/136/"), evolves_to: [] },
            ],
          },
        });
      }
      if (url.endsWith("/pokemon-species/135/")) {
        return json({ evolution_chain: { url: "https://pokeapi.co/api/v2/evolution-chain/67/" } });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Home />);

    const search = await screen.findByRole("combobox", { name: "Search Pokémon by name" });
    await user.type(search, "eevee");
    await user.click(screen.getByRole("button", { name: "Scan" }));

    expect(await screen.findByRole("heading", { name: "Eevee" })).toBeTruthy();
    const eeveeStage = screen.getByRole("button", { name: "Current evolution: Eevee" });
    const vaporeonStage = screen.getByRole("button", { name: "Load Vaporeon specimen" });
    expect((eeveeStage as HTMLButtonElement).disabled).toBe(true);
    expect(vaporeonStage).toBeTruthy();
    expect(screen.getByRole("button", { name: "Load Flareon specimen" })).toBeTruthy();
    expect(screen.queryByText("Evolution archive")).toBeNull();
    expect(screen.queryByText("Choose a stage to scan.")).toBeNull();
    expect(screen.queryByText("Stage 1")).toBeNull();
    expect(within(eeveeStage).getByText("1")).toBeTruthy();
    expect(within(vaporeonStage).getByText("2")).toBeTruthy();
    expect(eeveeStage.parentElement).toBe(vaporeonStage.parentElement);

    await user.click(screen.getByRole("button", { name: "Load Jolteon specimen" }));

    expect(await screen.findByRole("heading", { name: "Jolteon" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("https://pokeapi.co/api/v2/pokemon/jolteon");
  });
});
