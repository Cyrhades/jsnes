import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { generateRomThumbnail } from "./romThumbnail.js";

/**
 * Non-blocking modal to display multiple ROM files contained in a single ZIP archive.
 * Displays immediately with a clean default "NES" graphic placeholder, then loads
 * title screen thumbnails progressively in a background queue without freezing the UI.
 */
function ZipRomModal({ isOpen, zipName, roms, onSelectRom, onClose }) {
  const [thumbnails, setThumbnails] = useState({});

  useEffect(() => {
    if (isOpen && roms && roms.length > 0) {
      let isMounted = true;
      let timerId = null;

      // Create a background non-blocking queue to process thumbnails one-by-one
      const queue = [...roms];

      const processNext = () => {
        if (!isMounted || queue.length === 0) return;

        const rom = queue.shift();
        if (rom && rom.data && !thumbnails[rom.name]) {
          generateRomThumbnail(rom.data, 60, 300, rom.name).then((thumb) => {
            if (isMounted && thumb) {
              setThumbnails((prev) => ({ ...prev, [rom.name]: thumb }));
            }
            // Schedule next item on the next micro-tick so UI stays responsive
            timerId = setTimeout(processNext, 10);
          });
        } else {
          timerId = setTimeout(processNext, 5);
        }
      };

      // Start non-blocking processing
      timerId = setTimeout(processNext, 10);

      return () => {
        isMounted = false;
        if (timerId) clearTimeout(timerId);
      };
    }
  }, [isOpen, roms]);

  if (!isOpen || !roms || roms.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-gray-900/90 border border-indigo-500/30 text-white rounded-2xl shadow-2xl glow-indigo max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh] glass-panel">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
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
                  d="M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Archive ZIP multi-ROMs
              </h2>
              <p className="text-xs text-gray-400 truncate max-w-xs">
                {zipName || "Archive.zip"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            &times;
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            {roms.length} jeux trouvés dans l'archive :
          </p>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {roms.map((rom, index) => {
              const sizeKB = rom.data
                ? Math.round(rom.data.length / 1024)
                : null;
              const thumb = thumbnails[rom.name];

              return (
                <button
                  key={rom.name + "-" + index}
                  onClick={() => onSelectRom(rom)}
                  className="w-full text-left p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/90 hover:border-indigo-500/60 transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-sm hover:shadow-indigo-500/10"
                >
                  <div className="flex items-center space-x-3.5 overflow-hidden mr-3">
                    {/* Title Screen Thumbnail Preview or NES Badge Placeholder */}
                    <div className="w-16 h-14 bg-black rounded-md overflow-hidden border border-gray-700 shrink-0 flex items-center justify-center relative">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={rom.name}
                          className="w-full h-full object-cover animate-fade-in"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center">
                          <span className="text-xs font-extrabold tracking-widest text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                            NES
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="truncate">
                      <span className="font-semibold text-gray-100 group-hover:text-indigo-300 block truncate transition-colors text-sm">
                        {rom.name}
                      </span>
                      {sizeKB && (
                        <span className="text-xs text-gray-400 block mt-1">
                          {sizeKB} KB • NES ROM
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-indigo-400 font-medium text-xs bg-indigo-950/60 border border-indigo-800/60 px-3 py-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    Lancer &rsaquo;
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3.5 border-t border-gray-800 bg-gray-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg border border-gray-700 cursor-pointer transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

ZipRomModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  zipName: PropTypes.string,
  roms: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      data: PropTypes.instanceOf(Uint8Array),
    }),
  ),
  onSelectRom: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ZipRomModal;
