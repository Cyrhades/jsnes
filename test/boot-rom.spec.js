import { describe, it } from "node:test";
import assert from "node:assert/strict";
import NES from "../src/nes.js";
import {
  generateNesBootRom,
  generateNesBootRomString,
} from "../src/boot-rom.js";

describe("NES Boot ROM Generator (src/boot-rom.js)", () => {
  it("generates a valid 16KB PRG + 8KB CHR NES ROM binary", () => {
    const romBytes = generateNesBootRom("TEST GAME");

    // Total size = 16 bytes header + 16384 bytes PRG + 8192 bytes CHR = 24592 bytes
    assert.strictEqual(romBytes.length, 24592);

    // iNES Header checks ("NES\x1A")
    assert.strictEqual(romBytes[0], 0x4e); // 'N'
    assert.strictEqual(romBytes[1], 0x45); // 'E'
    assert.strictEqual(romBytes[2], 0x53); // 'S'
    assert.strictEqual(romBytes[3], 0x1a);

    // PRG & CHR count
    assert.strictEqual(romBytes[4], 1); // 1 x 16KB PRG
    assert.strictEqual(romBytes[5], 1); // 1 x 8KB CHR
  });

  it("loads and executes cleanly in JSNES emulator", () => {
    const nes = new NES();
    const romString = generateNesBootRomString("ARCADE BOOT");

    assert.doesNotThrow(() => {
      nes.loadROM(romString);
    });

    assert.strictEqual(nes.rom.valid, true);

    // Run 60 frames of the NES Boot ROM
    assert.doesNotThrow(() => {
      for (let i = 0; i < 60; i++) {
        nes.frame();
      }
    });
  });
});
