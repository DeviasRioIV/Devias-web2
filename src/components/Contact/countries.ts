// Build-time country list for the phone dropdown.
//
// Runs in the Astro frontmatter (server), so `world-countries` never reaches
// the client bundle — the options are plain HTML by the time they ship.
import countriesData from "world-countries";

export interface Country {
  /** Lowercase ISO 3166-1 alpha-2 code, for flag-icons (`fi fi-<iso2>`). */
  iso2: string;
  /** Localized country name. */
  name: string;
  /** International calling code, e.g. "+54". */
  dial: string;
}

interface RawCountry {
  cca2: string;
  name: { common: string };
  idd: { root?: string; suffixes?: string[] };
  translations: Record<string, { common: string }>;
}

// world-countries stores the calling code split into a root and suffixes.
// A single suffix means root+suffix is the full code (e.g. +5 / "4" → +54).
// Many suffixes means they are area codes sharing one root (e.g. +1, +7).
function dialCode({ root, suffixes }: RawCountry["idd"]): string {
  if (!root) return "";
  return suffixes && suffixes.length === 1 ? root + suffixes[0] : root;
}

/** Every country with a calling code, sorted by localized name. */
export function getCountries(lang: string): Country[] {
  const spanish = lang === "es";
  return (countriesData as unknown as RawCountry[])
    .filter((c) => c.idd?.root)
    .map((c) => ({
      iso2: c.cca2.toLowerCase(),
      name: spanish ? c.translations?.spa?.common ?? c.name.common : c.name.common,
      dial: dialCode(c.idd),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));
}
