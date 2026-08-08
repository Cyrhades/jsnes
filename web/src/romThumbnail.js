import NES from "../../src/nes.js";

const memoryCache = new Map();

/**
 * Get cache key for a ROM's binary data or optional custom hint string.
 */
export function getCacheKey(romData, cacheKeyHint) {
  if (cacheKeyHint) return "thumb_" + cacheKeyHint;
  let len = romData ? romData.length : 0;
  let sampleSum = 0;
  if (romData && len > 0) {
    const isString = typeof romData === "string";
    for (let i = 0; i < Math.min(len, 200); i += 5) {
      const val = isString ? romData.charCodeAt(i) : romData[i];
      sampleSum = (sampleSum + val) & 0xfffffff;
    }
  }
  return `thumb_${len}_${sampleSum}`;
}

/**
 * Check if a 256x240 frame buffer is mostly a single uniform color (e.g. black screen or copyright text on black).
 * @param {Int32Array} buffer - ARGB pixel buffer
 * @param {number} threshold - Fraction threshold (default: 0.85 = 85%)
 * @returns {boolean} True if the frame is dominated by a single background color
 */
export function isMostlyMonochrome(buffer, threshold = 0.85) {
  if (!buffer || buffer.length === 0) return true;

  const colorCounts = new Map();
  const totalPixels = buffer.length;

  for (let i = 0; i < totalPixels; i++) {
    const rgb = buffer[i] & 0x00ffffff;
    const count = (colorCounts.get(rgb) || 0) + 1;
    colorCounts.set(rgb, count);
  }

  let maxCount = 0;
  for (const count of colorCounts.values()) {
    if (count > maxCount) {
      maxCount = count;
    }
  }

  return maxCount / totalPixels >= threshold;
}

/**
 * Generate a PNG Data URL thumbnail of a ROM's title screen.
 * Includes multi-layer caching (in-memory + localStorage) to avoid redundant emulation.
 *
 * @param {Uint8Array|string|ArrayBuffer} romData - Binary ROM data
 * @param {number} [initialFrames=60] - Number of initial frames (1 sec)
 * @param {number} [extendedFrames=300] - Extended frames to wait if mostly black (5 sec)
 * @param {string} [cacheKeyHint] - Optional unique identifier/name for caching
 * @returns {Promise<string|null>} Data URL of the generated PNG image or null on error
 */
export function generateRomThumbnail(
  romData,
  initialFrames = 60,
  extendedFrames = 300,
  cacheKeyHint = "",
) {
  return new Promise((resolve) => {
    try {
      const cacheKey = getCacheKey(romData, cacheKeyHint);

      // Check in-memory cache
      if (memoryCache.has(cacheKey)) {
        resolve(memoryCache.get(cacheKey));
        return;
      }

      // Check localStorage cache
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          memoryCache.set(cacheKey, cached);
          resolve(cached);
          return;
        }
      } catch {
        // localStorage unavailable/disabled
      }

      let lastFrameBuffer = null;

      const nes = new NES({
        onFrame: (buffer) => {
          lastFrameBuffer = buffer;
        },
        emulateSound: false,
      });

      nes.loadROM(romData);

      // Step 1: Run initial frames (~1 second)
      for (let i = 0; i < initialFrames; i++) {
        nes.frame();
      }

      // Step 2: Check if initial frame is mostly black / uniform (e.g. > 85% single color)
      if (lastFrameBuffer && isMostlyMonochrome(lastFrameBuffer, 0.85)) {
        // Advance to ~5 seconds (300 frames) to reach actual title screen graphics
        for (let i = initialFrames; i < extendedFrames; i++) {
          nes.frame();
        }
      }

      if (!lastFrameBuffer) {
        resolve(null);
        return;
      }

      // Render 256x240 pixel buffer to offscreen canvas
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      const imgData = ctx.createImageData(256, 240);
      const data = imgData.data;

      let p = 0;
      for (let i = 0; i < lastFrameBuffer.length; i++) {
        const pixel = lastFrameBuffer[i];
        data[p] = (pixel >> 16) & 0xff; // Red
        data[p + 1] = (pixel >> 8) & 0xff; // Green
        data[p + 2] = pixel & 0xff; // Blue
        data[p + 3] = 0xff; // Alpha
        p += 4;
      }

      ctx.putImageData(imgData, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");

      // Save to memory and localStorage cache
      memoryCache.set(cacheKey, dataUrl);
      try {
        localStorage.setItem(cacheKey, dataUrl);
      } catch {
        // storage full or blocked
      }

      resolve(dataUrl);
    } catch (e) {
      console.warn("Could not generate ROM title screen thumbnail:", e);
      resolve(null);
    }
  });
}

export default generateRomThumbnail;
