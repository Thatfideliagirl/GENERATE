/** Business name initials for a stand in logo. Atelier OP gives AO. A single word gives its first letter. */
export function initialsOf(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s&-]/gu, ' ')
    .split(/[\s&-]+/)
    .filter((w) => w && !/^(and|the|of)$/i.test(w))
  if (!words.length) return '?'
  return words
    .slice(0, 2)
    .map((w) => Array.from(w)[0])
    .join('')
    .toUpperCase()
}
