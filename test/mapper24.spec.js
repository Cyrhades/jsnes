import { describe, it } from "node:test";
import assert from "node:assert/strict";
import NES from "../src/nes.js";
import Mapper24 from "../src/mappers/mapper24.js";
import Mapper26 from "../src/mappers/mapper26.js";

describe("Mapper24 & Mapper26 (Konami VRC6a / VRC6b)", () => {
  it("initializes Mapper24 and Mapper26 correctly", () => {
    const nes = new NES();
    const m24 = new Mapper24(nes);
    const m26 = new Mapper26(nes);

    assert.strictEqual(Mapper24.mapperName, "VRC6a");
    assert.strictEqual(Mapper26.mapperName, "VRC6b");
    assert.strictEqual(m24.a0a1Swapped, false);
    assert.strictEqual(m26.a0a1Swapped, true);
  });

  it("handles PRG and CHR bank switching in Mapper24 (VRC6a)", () => {
    const nes = new NES();
    const mapper = new Mapper24(nes);
    const loaded8k = [];
    const loaded1k = [];

    mapper.load8kRomBank = (bank, address) => {
      loaded8k.push({ bank, address });
    };
    mapper.load1kVromBank = (bank, address) => {
      loaded1k.push({ bank, address });
    };

    // PRG 16KB bank 2 at $8000
    mapper.write(0x8000, 2);
    assert.deepStrictEqual(loaded8k[0], { bank: 4, address: 0x8000 });
    assert.deepStrictEqual(loaded8k[1], { bank: 5, address: 0xa000 });

    // PRG 8KB bank 7 at $C000
    mapper.write(0xc000, 7);
    assert.deepStrictEqual(loaded8k[2], { bank: 7, address: 0xc000 });

    // CHR 1KB bank 10 at $0400 (reg 1 at $D000)
    mapper.write(0xd001, 10);
    assert.strictEqual(mapper.chrRegs[1], 10);
    assert.ok(loaded1k.some((b) => b.bank === 10 && b.address === 0x0400));

    // CHR 1KB bank 15 at $1800 (reg 6 / reg 2 at $E000)
    mapper.write(0xe002, 15);
    assert.strictEqual(mapper.chrRegs[6], 15);
    assert.ok(loaded1k.some((b) => b.bank === 15 && b.address === 0x1800));
  });

  it("handles address line swapping in Mapper26 (VRC6b)", () => {
    const nes = new NES();
    const mapper = new Mapper26(nes);
    const loaded1k = [];

    mapper.load1kVromBank = (bank, address) => {
      loaded1k.push({ bank, address });
    };

    // For VRC6b (Mapper 26), A0 and A1 are swapped:
    // Writing to $D001 sets reg 2 ($0800) instead of reg 1 ($0400).
    mapper.write(0xd001, 12);
    assert.strictEqual(mapper.chrRegs[2], 12);
    assert.ok(loaded1k.some((b) => b.bank === 12 && b.address === 0x0800));

    // Writing to $D002 sets reg 1 ($0400) instead of reg 2 ($0800).
    mapper.write(0xd002, 14);
    assert.strictEqual(mapper.chrRegs[1], 14);
    assert.ok(loaded1k.some((b) => b.bank === 14 && b.address === 0x0400));
  });

  it("handles VRC6 IRQ latch and counter control", () => {
    const nes = new NES();
    const mapper = new Mapper24(nes);
    nes.rom = { romCount: 8, valid: true };

    // Set IRQ Latch
    mapper.write(0xf000, 100);
    assert.strictEqual(mapper.irqLatch, 100);

    // Enable IRQ (reg 1 = $F001)
    mapper.write(0xf001, 0x02);
    assert.strictEqual(mapper.irqEnabled, true);
    assert.strictEqual(mapper.irqCounter, 100);

    // Clock IRQ counter until it triggers
    mapper.irqCounter = 0xff;
    let irqFired = false;
    nes.cpu.requestIrq = (type) => {
      if (type === nes.cpu.IRQ_NORMAL) irqFired = true;
    };

    mapper.clockIrqCounter();
    assert.strictEqual(irqFired, true);
    assert.strictEqual(mapper.irqCounter, 100);

    // Acknowledge IRQ (reg 2 = $F002)
    mapper.write(0xf002, 0);
    assert.strictEqual(mapper.irqEnabled, false);
  });
});
