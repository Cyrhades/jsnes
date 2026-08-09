export const handleError = (error, errorInfo) => {
  console.error(error);
};

export function loadBinary(path, callback, handleProgress) {
  var req = new XMLHttpRequest();
  req.open("GET", path);
  req.overrideMimeType("text/plain; charset=x-user-defined");
  req.onload = function () {
    if (this.status === 200) {
      if (req.responseText.match(/^<!doctype html>/i)) {
        // Got HTML back, so it is probably falling back to index.html due to 404
        return callback(new Error("Page not found"));
      }

      callback(null, this.responseText);
    } else if (this.status === 0) {
      // Aborted, so ignore error
    } else {
      callback(new Error(req.statusText));
    }
  };
  req.onerror = function () {
    callback(new Error(req.statusText));
  };
  req.onprogress = handleProgress;
  req.send();
  return req;
}

/**
 * Detects TV region (PAL or NTSC) from ROM name or binary header.
 */
export function detectRomRegion(name = "", binaryData = null) {
  if (
    binaryData &&
    (typeof binaryData === "string" ||
      binaryData instanceof Uint8Array ||
      binaryData.length)
  ) {
    const getByte = (idx) =>
      typeof binaryData === "string"
        ? binaryData.charCodeAt(idx) & 0xff
        : binaryData[idx];

    // Check NES header "NES\x1A"
    if (
      getByte(0) === 0x4e &&
      getByte(1) === 0x45 &&
      getByte(2) === 0x53 &&
      getByte(3) === 0x1a
    ) {
      const isNES2 = (getByte(7) & 0x0c) === 0x08;
      if (isNES2) {
        const timing = getByte(12) & 0x03;
        if (timing === 1 || timing === 3) return "PAL";
        if (timing === 0) return "NTSC";
      } else {
        const b9 = getByte(9);
        const b10 = getByte(10);
        if ((b9 & 1) !== 0 || (b10 & 3) === 2) return "PAL";
      }
    }
  }

  // Name-based detection fallback (No-Intro / GoodNES naming conventions)
  const lower = (name || "").toLowerCase();
  if (
    lower.includes("(e)") ||
    lower.includes("(europe)") ||
    lower.includes("(eur)") ||
    lower.includes("(pal)") ||
    lower.includes("pal") ||
    lower.includes("(f)") ||
    lower.includes("(g)") ||
    lower.includes("(i)") ||
    lower.includes("(s)") ||
    lower.includes("(uk)") ||
    lower.includes("(australia)")
  ) {
    return "PAL";
  }

  return "NTSC";
}
