const LOWERCASE_WORDS = new Set(["de", "del", "la", "las", "los", "y", "e"]);

export function toTitleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && LOWERCASE_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
