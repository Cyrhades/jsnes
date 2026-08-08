import { parseZip } from "../../src/zip-loader.js";
import { generateRomThumbnail } from "./romThumbnail.js";

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
  getRomInfoByHash: function (hash) {
    return this.load().find((rom) => rom.hash === hash);
  },

  /**
   * Save a ROM file or ZIP file to local storage library.
   * If ZIP contains a single ROM, extracts and saves it automatically.
   * If ZIP contains multiple ROMs, saves as a ZIP Pack and returns pack info.
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
   * Save a multi-ROM ZIP archive as a Pack in local storage.
   */
  saveZipPack: function (packName, roms, rawByteString) {
    return hashFile(rawByteString).then((hash) => {
      const savedRomInfo = localStorage.getItem("savedRomInfo");
      const existingLibrary = savedRomInfo ? JSON.parse(savedRomInfo) : [];

      const pack = {
        isPack: true,
        name: packName,
        hash: hash,
        romCount: roms.length,
        added: Date.now(),
      };

      const filteredLibrary = existingLibrary.filter((r) => r.hash !== hash);
      const newRomInfo = JSON.stringify(filteredLibrary.concat([pack]));

      localStorage.setItem("savedRomInfo", newRomInfo);
      localStorage.setItem("blob-" + hash, rawByteString);

      return {
        ...pack,
        roms: roms,
        isZip: true,
        type: "multiple",
        zipName: packName,
      };
    });
  },

  /**
   * Reload all ROM entries from a saved ZIP Pack hash.
   */
  getZipPackRoms: function (hash) {
    const romInfo = this.getRomInfoByHash(hash);
    if (!romInfo) return null;

    const rawByteString = localStorage.getItem("blob-" + hash);
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
   * Save raw ROM binary string to local storage with specified name.
   */
  saveRawRom: function (name, byteString) {
    return Promise.all([
      hashFile(byteString),
      generateRomThumbnail(byteString, 60, 300, name),
    ]).then(([hash, thumbnail]) => {
      const savedRomInfo = localStorage.getItem("savedRomInfo");
      const existingLibrary = savedRomInfo ? JSON.parse(savedRomInfo) : [];

      const rom = {
        isPack: false,
        name: name,
        hash: hash,
        added: Date.now(),
        thumbnail: thumbnail || null,
      };

      const filteredLibrary = existingLibrary.filter((r) => r.hash !== hash);
      const newRomInfo = JSON.stringify(filteredLibrary.concat([rom]));

      localStorage.setItem("savedRomInfo", newRomInfo);
      localStorage.setItem("blob-" + hash, byteString);

      return rom;
    });
  },

  /**
   * Save a selected ROM extracted from a multi-ROM ZIP.
   */
  saveExtractedRom: function (romName, romUint8Data) {
    const romDataStr = uint8ToBinaryString(romUint8Data);
    return this.saveRawRom(romName, romDataStr);
  },

  load: function () {
    const localData = localStorage.getItem("savedRomInfo");
    if (!localData) return [];
    try {
      const savedRomInfo = JSON.parse(localData);
      return savedRomInfo || [];
    } catch {
      return [];
    }
  },

  delete: function (hash) {
    const existingLibrary = this.load();
    localStorage.removeItem("blob-" + hash);
    localStorage.setItem(
      "savedRomInfo",
      JSON.stringify(existingLibrary.filter((rom) => rom.hash !== hash)),
    );
  },
};

export default RomLibrary;
