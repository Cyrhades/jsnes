import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import {
  isZipData,
  isSupportedRomFile,
  parseZip,
  toUint8Array,
} from "../src/zip-loader.js";

describe("zip-loader", () => {
  describe("toUint8Array", () => {
    it("handles Uint8Array input", () => {
      const arr = new Uint8Array([1, 2, 3]);
      assert.strictEqual(toUint8Array(arr), arr);
    });

    it("handles ArrayBuffer input", () => {
      const buffer = new Uint8Array([4, 5, 6]).buffer;
      const res = toUint8Array(buffer);
      assert.ok(res instanceof Uint8Array);
      assert.deepStrictEqual(Array.from(res), [4, 5, 6]);
    });

    it("handles binary string input", () => {
      const str = String.fromCharCode(65, 66, 67);
      const res = toUint8Array(str);
      assert.deepStrictEqual(Array.from(res), [65, 66, 67]);
    });
  });

  describe("isZipData", () => {
    it("returns true for data starting with PK signature", () => {
      const zipBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]);
      assert.strictEqual(isZipData(zipBytes), true);
    });

    it("returns false for non-ZIP data", () => {
      const nesBytes = new Uint8Array([0x4e, 0x45, 0x53, 0x1a]);
      assert.strictEqual(isZipData(nesBytes), false);
    });
  });

  describe("isSupportedRomFile", () => {
    it("identifies .nes files", () => {
      assert.strictEqual(isSupportedRomFile("SuperMario.nes"), true);
      assert.strictEqual(isSupportedRomFile("folder/Zelda.NES"), true);
    });

    it("rejects non-ROM files and macOS metadata", () => {
      assert.strictEqual(isSupportedRomFile("readme.txt"), false);
      assert.strictEqual(isSupportedRomFile("__MACOSX/._game.nes"), false);
      assert.strictEqual(isSupportedRomFile(".hidden.nes"), false);
    });
  });

  describe("parseZip", () => {
    it("returns not_zip for raw ROM data", () => {
      const rawRom = new Uint8Array([0x4e, 0x45, 0x53, 0x1a, 0x01, 0x02]);
      const result = parseZip(rawRom);
      assert.strictEqual(result.isZip, false);
      assert.strictEqual(result.type, "not_zip");
      assert.deepStrictEqual(result.romData, rawRom);
    });

    it("parses ZIP with a single .nes ROM file", () => {
      const romContent = strToU8("NES_HEADER_DUMMY_DATA");
      const zipData = zipSync({
        "mario.nes": romContent,
        "readme.txt": strToU8("Instructions"),
      });

      const result = parseZip(zipData);
      assert.strictEqual(result.isZip, true);
      assert.strictEqual(result.type, "single");
      assert.strictEqual(result.name, "mario.nes");
      assert.deepStrictEqual(result.romData, romContent);
      assert.strictEqual(result.roms.length, 1);
    });

    it("parses ZIP with multiple .nes ROM files", () => {
      const rom1 = strToU8("ROM_DATA_1");
      const rom2 = strToU8("ROM_DATA_2");

      const zipData = zipSync({
        "games/mario.nes": rom1,
        "games/zelda.nes": rom2,
        "notes.txt": strToU8("Info"),
      });

      const result = parseZip(zipData);
      assert.strictEqual(result.isZip, true);
      assert.strictEqual(result.type, "multiple");
      assert.strictEqual(result.roms.length, 2);
      assert.strictEqual(result.roms[0].name, "mario.nes");
      assert.strictEqual(result.roms[1].name, "zelda.nes");
      assert.deepStrictEqual(result.roms[0].data, rom1);
      assert.deepStrictEqual(result.roms[1].data, rom2);
    });

    it("returns type none when ZIP has no valid ROM files", () => {
      const zipData = zipSync({
        "image.png": strToU8("PNG_DATA"),
        "text.txt": strToU8("TXT_DATA"),
      });

      const result = parseZip(zipData);
      assert.strictEqual(result.isZip, true);
      assert.strictEqual(result.type, "none");
      assert.ok(result.error.includes("No valid NES ROM"));
    });

    it("handles invalid/corrupted ZIP gracefully", () => {
      const invalidZip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x99, 0x99]);
      const result = parseZip(invalidZip);
      assert.strictEqual(result.isZip, true);
      assert.strictEqual(result.type, "none");
      assert.ok(result.error.includes("Failed to decompress"));
    });
  });
});
