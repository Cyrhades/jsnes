import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { detectRomRegion } from "./utils.js";
import { toUint8Array } from "../../src/zip-loader.js";

/**
 * Mapper ID to Board / Chip type name map
 */
const MAPPER_NAMES = {
  0: "NROM",
  1: "MMC1",
  2: "UxROM",
  3: "CNROM",
  4: "MMC3 / TENGEN-800032",
  5: "MMC5",
  7: "AxROM",
  9: "MMC2",
  10: "MMC4",
  11: "Color Dreams",
  24: "VRC6a",
  26: "VRC6b",
  34: "BNROM / NINA-001",
  64: "RAMBO-1",
  71: "Camerica / BF9093",
  118: "TxSROM (MMC3)",
  119: "TQROM (MMC3)",
  140: "Jaleco JF-11/14",
  180: "Crazy Climber",
  240: "Genius Merchandising",
  241: "Famicom Jump 2",
};

/**
 * Computes SHA-256 hex string of a Uint8Array
 */
async function computeSha256(bytes) {
  if (typeof crypto !== "undefined" && crypto.subtle && crypto.subtle.digest) {
    try {
      const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // Fallback below
    }
  }
  // Simple fallback hash if SubtleCrypto is unavailable
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * Formats a number to 0xHEX string
 */
function toHex(val) {
  return "0x" + val.toString(16);
}

/**
 * Modal to display detailed Cartridge (ROM) hardware inspection data:
 * SHA-256, Name, Title, Region, System, Mapper Board, Memory layout, and iNES 16-byte raw header.
 */
function CartridgeModal({ isOpen, onClose, romData, romName }) {
  const [sha256, setSha256] = useState("Calcul en cours...");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && romData) {
      const bytes = toUint8Array(romData);
      computeSha256(bytes).then((hash) => setSha256(hash));
    }
  }, [isOpen, romData]);

  if (!isOpen || !romData) return null;

  const bytes = toUint8Array(romData);
  const isValidHeader =
    bytes.length >= 16 &&
    bytes[0] === 0x4e &&
    bytes[1] === 0x45 &&
    bytes[2] === 0x53 &&
    bytes[3] === 0x1a;

  // Header raw 16 bytes
  const headerBytes = isValidHeader ? bytes.slice(0, 16) : new Uint8Array(16);
  const headerDataHex = Array.from(headerBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");

  // iNES Header parsing
  const prgUnits = headerBytes[4] || 0;
  const chrUnits = headerBytes[5] || 0;
  const prgSize = prgUnits * 16384;
  const chrSize = chrUnits * 4096;

  const mapperId = ((headerBytes[6] >> 4) & 0x0f) | (headerBytes[7] & 0xf0);
  const isNES2 = (headerBytes[7] & 0x0c) === 0x08;
  const mapperName = MAPPER_NAMES[mapperId] || `Mapper ${mapperId}`;
  const chipType =
    mapperId === 4
      ? "MMC3 / RAMBO-1"
      : MAPPER_NAMES[mapperId] || `Mapper ${mapperId}`;

  const regionDetected = detectRomRegion(romName, bytes);
  const regionString =
    regionDetected === "PAL"
      ? "PAL"
      : regionDetected === "NTSC"
        ? "NTSC-U, NTSC-J"
        : "NTSC-J, NTSC-U";

  const systemString = isNES2 ? "NES 2.0" : "Regular (NTSC)";

  // Format YAML representation
  const yamlString = `game
  sha256: ${sha256}
  name:   ${romName || "NES Game"}
  title:  ${romName || "NES Game"}
  region: ${regionString}
  system: ${systemString}
  board:  ${mapperName} (Mapper ${mapperId})
    chip type=${chipType}
    memory
      type: ROM
      size: 0x10
      content: iNES
      data: ${headerDataHex}
    memory
      type: ROM
      size: ${toHex(prgSize)} (${Math.round(prgSize / 1024)} KB)
      content: Program
${
  chrSize > 0
    ? `    memory
      type: ROM
      size: ${toHex(chrSize)} (${Math.round(chrSize / 1024)} KB)
      content: Character`
    : `    memory
      type: RAM
      size: 0x2000 (8 KB)
      content: Character RAM`
}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(yamlString).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900/95 border border-emerald-500/30 text-white rounded-2xl shadow-2xl glow-cyan max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] glass-panel">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Informations Cartouche
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                {romName || "ROM NES"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            &times;
          </button>
        </div>

        {/* Code / Terminal View */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs leading-relaxed bg-slate-950/90 text-emerald-300 border-b border-slate-800/80">
          <pre className="whitespace-pre-wrap select-all font-mono text-emerald-400">
            {yamlString}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            <span>{copied ? "Copié !" : "Copier les informations"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-colors cursor-pointer shadow"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

CartridgeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  romData: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Uint8Array),
    PropTypes.instanceOf(ArrayBuffer),
  ]),
  romName: PropTypes.string,
};

export default CartridgeModal;
