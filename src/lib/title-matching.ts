function stripDiacritics(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeMovieTitle(title: string) {
  return stripDiacritics(title)
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/&/g, " and ")
    .replace(/\b(movie|film|telugu|the|a|an)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactNormalizedMovieTitle(title: string) {
  return normalizeMovieTitle(title).replace(/\s+/g, "");
}

function levenshteinDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost
      );
    }

    for (let j = 0; j < current.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

export function getTitleSimilarityScore(a: string, b: string) {
  const normalizedA = normalizeMovieTitle(a);
  const normalizedB = normalizeMovieTitle(b);

  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 1;

  const compactA = compactNormalizedMovieTitle(a);
  const compactB = compactNormalizedMovieTitle(b);

  if (compactA === compactB) return 0.98;
  if (compactA.includes(compactB) || compactB.includes(compactA)) return 0.93;

  const tokensA = normalizedA.split(" ").filter(Boolean);
  const tokensB = normalizedB.split(" ").filter(Boolean);
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const overlap = Array.from(setA).filter((token) => setB.has(token)).length;
  const tokenScore = overlap / Math.max(setA.size, setB.size, 1);

  const distance = levenshteinDistance(compactA, compactB);
  const characterScore =
    1 - distance / Math.max(compactA.length, compactB.length, 1);

  return Math.max(0, Math.min(0.97, tokenScore * 0.45 + characterScore * 0.55));
}

/**
 * Romanized Telugu is written inconsistently: long vowels are doubled by some
 * and single by others (రా → "Raa" vs "Ra", సా → "Saa" vs "Sa"), consonants
 * are sometimes geminated ("Rakkasa" vs "Rakasa"), and w/v are interchangeable.
 * Collapsing consecutive duplicate letters and normalizing w→v yields a
 * canonical key so these spellings compare as equal.
 *
 * This reflects transliteration noise specific to Indic scripts, so callers
 * should only use it for Telugu titles — applying it to, say, English titles
 * would wrongly merge legitimately doubled letters ("aa" in "Aaron").
 */
export function canonicalizeTeluguRomanization(title: string): string {
  return compactNormalizedMovieTitle(title)
    .replace(/w/g, "v")
    .replace(/(.)\1+/g, "$1");
}

/**
 * Title similarity tuned for Telugu transliteration variants. Returns the
 * stronger of the plain score and a score computed on the Telugu-canonical
 * forms, so "Raakaasa" matches "Rakasa".
 */
export function getTeluguTitleSimilarityScore(a: string, b: string): number {
  const base = getTitleSimilarityScore(a, b);
  const canonicalA = canonicalizeTeluguRomanization(a);
  const canonicalB = canonicalizeTeluguRomanization(b);

  if (!canonicalA || !canonicalB) return base;
  if (canonicalA === canonicalB) return Math.max(base, 0.99);
  if (canonicalA.includes(canonicalB) || canonicalB.includes(canonicalA)) {
    return Math.max(base, 0.93);
  }
  return Math.max(base, getTitleSimilarityScore(canonicalA, canonicalB));
}
