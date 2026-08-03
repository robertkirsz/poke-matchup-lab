import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#d93636",
};

export async function generateMetadata(): Promise<Metadata> {
  const incomingHeaders = await headers();
  const host = incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host") ?? "localhost:3000";
  const protocol = incomingHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "Poké Matchup Lab",
    description: "Fuzzy-search any Pokémon and instantly see its defensive type matchups.",
    applicationName: "Poké Matchup Lab",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
      apple: "/apple-touch-icon.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Poké Matchup",
    },
    openGraph: {
      title: "Poké Matchup Lab",
      description: "Fuzzy-search any Pokémon and instantly see its defensive type matchups.",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "Poké Matchup Lab field scanner" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Poké Matchup Lab",
      description: "Fuzzy-search any Pokémon and instantly see its defensive type matchups.",
      images: [`${origin}/og.png`],
    },
  };
}

const designContract = `<!--
THESIS: A professor's compact matchup archive turns fuzzy name lookup into an immediate defensive type readout; it refuses the generic dashboard grid.
OWN-WORLD: Pokedex-red casing, cream specimen labels, cool green scan glass, mechanical seams, and compact type capsules.
STORY: Search approximately, lock onto the intended Pokemon, then scan threats, resistances, immunities, and neutral attacks in descending urgency.
FIRST VIEWPORT: A single red field device holds search and specimen art on the left, with the full attack report in a paper tray on the right.
FORM: Professor's specimen drawer, fifth grounded direction; seed df6a4ece.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geist.variable}>
        <template id="design-contract" dangerouslySetInnerHTML={{ __html: designContract }} />
        {children}
      </body>
    </html>
  );
}
