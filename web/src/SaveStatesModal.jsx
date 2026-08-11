import React from "react";
import PropTypes from "prop-types";

/**
 * Modal dialog for managing Save State slots (Slot 1, Slot 2, Slot 3).
 * Shows screenshot thumbnails, timestamps, and controls to save, load, or delete state snapshots.
 */
function SaveStatesModal({
  isOpen,
  onClose,
  romName,
  slots,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
  hasBatteryRam,
  onExportSram,
  onImportSram,
}) {
  if (!isOpen) return null;

  const slotList = [1, 2, 3].map((slotNum) => {
    const existing = (slots || []).find((s) => s.slot === slotNum);
    return (
      existing || {
        slot: slotNum,
        timestamp: null,
        screenshot: null,
        state: null,
      }
    );
  });

  const formatDate = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900/95 border border-indigo-500/30 text-white rounded-2xl shadow-2xl glow-indigo max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] glass-panel">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
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
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Sauvegardes d'état (Save States)
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-xs">
                {romName || "Jeu NES"}
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

        {/* Battery RAM (SRAM / EEPROM) Section */}
        {hasBatteryRam && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7h8m0 0v8a2 2 0 01-2 2H8"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-300">
                  Sauvegarde Cartouche SRAM / EEPROM
                </h4>
                <p className="text-[11px] text-slate-300">
                  Fichier de sauvegarde d'origine sur pile (.sav).
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={onExportSram}
                className="text-xs font-semibold text-emerald-200 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Exporter .sav
              </button>
              <label className="text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                Importer .sav
                <input
                  type="file"
                  accept=".sav,.ram,.srm"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onImportSram(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {/* Content Slots */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {slotList.map((item) => {
            const hasData = !!item.timestamp;
            return (
              <div
                key={item.slot}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
              >
                {/* Thumbnail / Placeholder */}
                <div className="w-36 h-28 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shrink-0 flex items-center justify-center relative">
                  {hasData && item.screenshot ? (
                    <img
                      src={item.screenshot}
                      alt={`Sauvegarde Slot ${item.slot}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-1.5 text-slate-600">
                      <svg
                        className="w-8 h-8 opacity-60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        Vide
                      </span>
                    </div>
                  )}
                  <span className="absolute top-1.5 left-1.5 bg-slate-900/90 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                    Slot {item.slot}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h3 className="text-sm font-bold text-white">
                    Emplacement {item.slot}
                  </h3>
                  {hasData ? (
                    <p className="text-xs text-indigo-300 font-mono">
                      {formatDate(item.timestamp)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Aucune sauvegarde enregistrée
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Sauvegarder :{" "}
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-[10px]">
                      Ctrl + {item.slot}
                    </kbd>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Charger :{" "}
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-[10px]">
                      Ctrl + Alt + {item.slot}
                    </kbd>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0">
                  {hasData && (
                    <button
                      type="button"
                      onClick={() => onLoadSlot(item.slot)}
                      className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow flex items-center space-x-1.5"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                      </svg>
                      <span>Charger</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSaveSlot(item.slot)}
                    className="text-xs font-semibold text-slate-200 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    {hasData ? "Écraser" : "Sauvegarder"}
                  </button>

                  {hasData && (
                    <button
                      type="button"
                      onClick={() => onDeleteSlot(item.slot)}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-2 rounded-lg border border-rose-900/50 transition-colors cursor-pointer"
                      title="Supprimer la sauvegarde"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <p className="text-[11px] text-slate-400">
            Sauvegarde :{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">
              Ctrl + S
            </kbd>{" "}
            ou{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">
              Ctrl + 1..3
            </kbd>
            &nbsp;&nbsp;&nbsp; &bull; &nbsp;&nbsp;&nbsp; Charger :{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">
              Ctrl + Alt + L
            </kbd>{" "}
            ou{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">
              Ctrl + Alt + 1..3
            </kbd>{" "}
            (Slots)
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition-colors cursor-pointer shadow"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

SaveStatesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  romName: PropTypes.string,
  slots: PropTypes.array,
  onSaveSlot: PropTypes.func.isRequired,
  onLoadSlot: PropTypes.func.isRequired,
  onDeleteSlot: PropTypes.func.isRequired,
  hasBatteryRam: PropTypes.bool,
  onExportSram: PropTypes.func,
  onImportSram: PropTypes.func,
};

export default SaveStatesModal;
