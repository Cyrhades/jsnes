import { describe, it, expect } from "vitest";
import { isMostlyMonochrome } from "./romThumbnail";

describe("isMostlyMonochrome", () => {
  it("returns true for a solid black buffer", () => {
    // 256x240 pixels of black (0xff000000)
    const blackBuffer = new Int32Array(256 * 240).fill(0xff000000);
    expect(isMostlyMonochrome(blackBuffer, 0.85)).toBe(true);
  });

  it("returns true when > 85% of pixels are a single background color", () => {
    const buffer = new Int32Array(100);
    // 90 pixels black, 10 pixels white
    buffer.fill(0xff000000, 0, 90);
    buffer.fill(0xffffffff, 90, 100);
    expect(isMostlyMonochrome(buffer, 0.85)).toBe(true);
  });

  it("returns false for a colorful image with varied colors", () => {
    const buffer = new Int32Array(100);
    // 10 different colors evenly distributed
    for (let i = 0; i < 100; i++) {
      buffer[i] = 0xff000000 + (i % 10) * 0x101010;
    }
    expect(isMostlyMonochrome(buffer, 0.85)).toBe(false);
  });
});
