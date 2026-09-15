/**
 * Dalvik Executable (.dex) String Pool Extractor
 * Extracts all string constants, URLs, API keys, class names, and method references
 * from compiled DEX bytecode archives.
 */
export function extractDexStrings(dexBuffer: Buffer): string[] {
  const strings: string[] = [];
  if (dexBuffer.length < 0x70) return strings;

  // Check DEX magic: "dex\n"
  const magic = dexBuffer.toString("utf8", 0, 4);
  if (magic !== "dex\n") return strings;

  const stringIdsSize = dexBuffer.readUInt32LE(0x38);
  const stringIdsOff = dexBuffer.readUInt32LE(0x3c);

  if (stringIdsOff >= dexBuffer.length) return strings;

  for (let i = 0; i < stringIdsSize; i++) {
    const idPos = stringIdsOff + i * 4;
    if (idPos + 4 > dexBuffer.length) break;

    const dataOff = dexBuffer.readUInt32LE(idPos);
    if (dataOff >= dexBuffer.length) continue;

    // Read ULEB128 encoded size
    let p = dataOff;
    let size = 0;
    let shift = 0;
    while (p < dexBuffer.length) {
      const byte = dexBuffer[p++];
      size |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }

    // Read null-terminated string
    let end = p;
    while (end < dexBuffer.length && dexBuffer[end] !== 0) {
      end++;
    }

    if (end > p) {
      try {
        const str = dexBuffer.toString("utf8", p, end);
        if (str.length > 0) {
          strings.push(str);
        }
      } catch {
        // ignore malformed utf-8 sequences
      }
    }
  }

  return strings;
}
