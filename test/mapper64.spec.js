import { describe, it } from "node:test";
import assert from "node:assert/strict";
import NES from "../src/nes.js";
import Mapper64 from "../src/mappers/mapper64.js";

describe("Mapper64 (RAMBO-1)", () => {
  it("initializes Mapper64 correctly", () => {
    const nes = new NES();
    const mapper = new Mapper64(nes);
    assert.strictEqual(Mapper64.mapperName, "RAMBO-1");
    assert.strictEqual(mapper.kBit, 0);
  });

  it("handles bank switching commands", () => {
    const nes = new NES();
    const mapper = new Mapper64(nes);
    mapper.load8kRomBank = (bank, address) => {
      mapper[`bank_${address.toString(16)}`] = bank;
    };
    mapper.load1kVromBank = (bank, address) => {
      mapper[`vrom_${address.toString(16)}`] = bank;
    };
    nes.rom = { romCount: 8, valid: true };

    // Select PRG command 6 ($8000)
    mapper.write(0x8000, 6);
    mapper.write(0x8001, 4);
    assert.strictEqual(mapper.r6, 4);

    // Select PRG command 7 ($A000)
    mapper.write(0x8000, 7);
    mapper.write(0x8001, 5);
    assert.strictEqual(mapper.r7, 5);

    // Select RAMBO-1 extra PRG command 15 ($C000)
    mapper.write(0x8000, 15);
    mapper.write(0x8001, 2);
    assert.strictEqual(mapper.r15, 2);

    // Select RAMBO-1 K bit (1KB CHR mode)
    mapper.write(0x8000, 0x20 | 8); // Command 8, K bit set
    assert.strictEqual(mapper.kBit, 1);
    mapper.write(0x8001, 10);
    assert.strictEqual(mapper.r8, 10);
  });

  it("handles IRQ latch and mode controls", () => {
    const nes = new NES();
    const mapper = new Mapper64(nes);
    nes.rom = { romCount: 8, valid: true };

    // Set IRQ Latch
    mapper.write(0xc000, 12);
    assert.strictEqual(mapper.irqLatchValue, 12);

    // Write $C001 to reload counter & set mode
    mapper.write(0xc001, 0); // Scanline mode
    assert.strictEqual(mapper.irqCounter, 12);
    assert.strictEqual(mapper.irqMode, 0);

    // Enable IRQ
    mapper.write(0xe001, 0);
    assert.strictEqual(mapper.irqEnable, 1);

    // Clock IRQ down to 0
    for (let i = 0; i < 13; i++) {
      mapper.clockIrqCounter();
    }

    // Disable IRQ
    mapper.write(0xe000, 0);
    assert.strictEqual(mapper.irqEnable, 0);
  });
});
