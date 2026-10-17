/**
 * Parser for Intel HEX files (.hex) standard across AVR / Arduino toolchains
 */
export interface HexParseResult {
  startAddress: number;
  endAddress: number;
  data: Uint8Array;
  bytesCount: number;
}

export function parseIntelHex(hexString: string): HexParseResult {
  const lines = hexString.split(/\r?\n/);
  const memory = new Map<number, number>();
  let extendedAddress = 0;
  let minAddress = Infinity;
  let maxAddress = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex].trim();
    if (!rawLine || !rawLine.startsWith(':')) continue;

    const line = rawLine.substring(1);
    if (line.length < 10) continue;

    const byteCount = parseInt(line.substring(0, 2), 16);
    const address = parseInt(line.substring(2, 6), 16);
    const recordType = parseInt(line.substring(6, 8), 16);
    const dataStr = line.substring(8, 8 + byteCount * 2);

    if (recordType === 0) {
      // Data record
      const fullAddress = extendedAddress + address;
      for (let i = 0; i < byteCount; i++) {
        const byteVal = parseInt(dataStr.substring(i * 2, i * 2 + 2), 16);
        const currAddr = fullAddress + i;
        memory.set(currAddr, byteVal);
        if (currAddr < minAddress) minAddress = currAddr;
        if (currAddr > maxAddress) maxAddress = currAddr;
      }
    } else if (recordType === 1) {
      // End Of File
      break;
    } else if (recordType === 2) {
      // Extended Segment Address
      extendedAddress = parseInt(dataStr, 16) << 4;
    } else if (recordType === 4) {
      // Extended Linear Address
      extendedAddress = parseInt(dataStr, 16) << 16;
    }
  }

  if (memory.size === 0) {
    throw new Error('No valid program data found in Intel HEX file.');
  }

  const length = maxAddress - minAddress + 1;
  const result = new Uint8Array(length);
  // Default unwritten flash memory in AVR is 0xFF
  result.fill(0xff);

  for (const [addr, val] of memory.entries()) {
    result[addr - minAddress] = val;
  }

  return {
    startAddress: minAddress,
    endAddress: maxAddress,
    data: result,
    bytesCount: memory.size,
  };
}
