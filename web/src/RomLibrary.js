import { parseZip } from "../../src/zip-loader.js";
import { generateRomThumbnail } from "./romThumbnail.js";
import { idbGet, idbSet, idbRemove } from "./idbStorage.js";

const pFileReader = function (file) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.onload = resolve;
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};

const uint8ToBinaryString = (uint8) => {
  let str = "";
  const len = uint8.length;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(uint8[i]);
  }
  return str;
};

const hashFile = function (byteString) {
  const asHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);

  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return crypto.subtle.digest("SHA-1", ab).then(asHex);
};

const RomLibrary = {
  /**
   * Synchronous lookup for ROM metadata by hash.
   */
  getRomInfoByHash: function (hash) {
    return this.load().find((rom) => rom.hash === hash);
  },

  /**
   * Async retrieval of raw ROM binary string by hash.
   */
  getRomData: function (hash) {
    return idbGet("blob-" + hash);
  },

  /**
   * Save a ROM file or ZIP file to IndexedDB/localStorage library.
   */
  save: function (file) {
    return pFileReader(file).then((readFile) => {
      const rawByteString = readFile.target.result;
      const zipResult = parseZip(rawByteString);

      if (zipResult.isZip) {
        if (zipResult.type === "none") {
          return Promise.reject(
            new Error(
              zipResult.error || "No valid NES ROM files found in ZIP archive",
            ),
          );
        }

        if (zipResult.type === "multiple") {
          return this.saveZipPack(file.name, zipResult.roms, rawByteString);
        }

        // Single ROM in ZIP
        const romDataStr = uint8ToBinaryString(zipResult.romData);
        const romName = zipResult.name || file.name;
        return this.saveRawRom(romName, romDataStr);
      }

      // Standard non-ZIP ROM file
      return this.saveRawRom(file.name, rawByteString);
    });
  },

  /**
   * Save a multi-ROM ZIP archive as a Pack in IndexedDB.
   */
  saveZipPack: async function (packName, roms, rawByteString) {
    const hash = await hashFile(rawByteString);
    const existingLibrary = await this.loadAsync();

    const pack = {
      isPack: true,
      name: packName,
      hash: hash,
      romCount: roms.length,
      added: Date.now(),
    };

    const filteredLibrary = existingLibrary.filter((r) => r.hash !== hash);
    const newRomInfo = JSON.stringify(filteredLibrary.concat([pack]));

    await idbSet("savedRomInfo", newRomInfo);
    await idbSet("blob-" + hash, rawByteString);

    return {
      ...pack,
      roms: roms,
      isZip: true,
      type: "multiple",
      zipName: packName,
    };
  },

  /**
   * Reload all ROM entries from a saved ZIP Pack hash.
   */
  getZipPackRoms: async function (hash) {
    const romInfo = this.getRomInfoByHash(hash);
    if (!romInfo) return null;

    const rawByteString = await idbGet("blob-" + hash);
    if (!rawByteString) return null;

    const zipResult = parseZip(rawByteString);
    if (zipResult.isZip && zipResult.type === "multiple") {
      return {
        zipName: romInfo.name,
        roms: zipResult.roms,
      };
    }
    return null;
  },

  /**
   * Save raw ROM binary string to IndexedDB with specified name.
   */
  saveRawRom: async function (name, byteString) {
    const [hash, thumbnail] = await Promise.all([
      hashFile(byteString),
      generateRomThumbnail(byteString, 60, 300, name),
    ]);

    const existingLibrary = await this.loadAsync();

    const rom = {
      isPack: false,
      name: name,
      hash: hash,
      added: Date.now(),
      thumbnail: thumbnail || null,
    };

    const filteredLibrary = existingLibrary.filter((r) => r.hash !== hash);
    const newRomInfo = JSON.stringify(filteredLibrary.concat([rom]));

    await idbSet("savedRomInfo", newRomInfo);
    await idbSet("blob-" + hash, byteString);

    return rom;
  },

  /**
   * Save a selected ROM extracted from a multi-ROM ZIP.
   */
  saveExtractedRom: function (romName, romUint8Data) {
    const romDataStr = uint8ToBinaryString(romUint8Data);
    return this.saveRawRom(romName, romDataStr);
  },

  /**
   * Synchronous load from localStorage fallback / in-memory.
   */
  load: function () {
    try {
      const localData = localStorage.getItem("savedRomInfo");
      if (!localData) return [];
      return JSON.parse(localData) || [];
    } catch {
      return [];
    }
  },

  /**
   * Asynchronous load from IndexedDB with auto-migration.
   */
  loadAsync: async function () {
    try {
      const localData = await idbGet("savedRomInfo");
      if (!localData) return [];
      if (typeof localData === "string") {
        return JSON.parse(localData) || [];
      }
      return Array.isArray(localData) ? localData : [];
    } catch {
      return [];
    }
  },

  /**
   * Delete a ROM or ZIP pack entry by hash.
   */
  delete: async function (hash) {
    const existingLibrary = await this.loadAsync();
    await idbRemove("blob-" + hash);
    const updatedLibrary = existingLibrary.filter((rom) => rom.hash !== hash);
    await idbSet("savedRomInfo", JSON.stringify(updatedLibrary));
    return updatedLibrary;
  },
};

export default RomLibrary;
