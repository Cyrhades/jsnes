import React, { useState } from "react";
import PropTypes from "prop-types";

/**
 * GameGenieModal - UI component to enter, toggle, and manage Game Genie / Hex cheat codes.
 */
export default function GameGenieModal({
  isOpen,
  onClose,
  codes,
  enabled,
  onToggleEnabled,
  onAddCode,
  onToggleCode,
  onDeleteCode,
  onClearAll,
}) {
  const [inputCode, setInputCode] = useState("");
  const [inputDescription, setInputDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    setErrorMsg("");
    const trimmedCode = inputCode.trim().toUpperCase();
    if (!trimmedCode) {
      setErrorMsg("Veuillez saisir un code.");
      return;
    }

    const description = inputDescription.trim() || `Code ${trimmedCode}`;
    const success = onAddCode(trimmedCode, description);
    if (success) {
      setInputCode("");
      setInputDescription("");
    } else {
      setErrorMsg(
        "Code invalide. Format attendu : 6 ou 8 lettres (ex: AAUNYLPA) ou Adresse:Valeur (ex: 11D9:AD).",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl glass-panel bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] glow-purple"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center space-x-3">
            <img
              src="/img/game_genie.webp"
              alt="Game Genie"
              className="h-10 w-auto object-contain rounded-lg shadow-md border border-rose-500/40 p-1 bg-black/60 shrink-0"
            />
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Codes de triche (Game Genie)
              </h2>
              <p className="text-xs text-slate-400">
                Modifier la mémoire du jeu avec des codes Game Genie ou Hex
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Global Toggle */}
        <div className="px-6 py-3 bg-slate-950/30 border-b border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-slate-300">
            Activer les codes de triche dans le jeu
          </span>
          <button
            type="button"
            onClick={() => onToggleEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enabled ? "bg-amber-500" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Add Code Form */}
          <form onSubmit={handleAdd} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ajouter un nouveau code
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Code(s) (6/8 lettres ou Hex, séparés par espace/+)
                </label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="ex: LEXVGYAA + ZAVNLGAA"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500 uppercase tracking-widest placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={inputDescription}
                  onChange={(e) => setInputDescription(e.target.value)}
                  placeholder="ex: Aller au dernier niveau"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-lg">
                ⚠️ {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 py-2.5 rounded-lg transition-colors cursor-pointer shadow-md flex items-center justify-center space-x-1.5"
            >
              <span>+ Ajouter le(s) code(s)</span>
            </button>
          </form>

          {/* Active Codes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Codes enregistrés ({codes.length})
              </h3>
              {codes.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                >
                  Tout supprimer
                </button>
              )}
            </div>

            {codes.length === 0 ? (
              <div className="text-center py-6 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/30 flex flex-col items-center justify-center space-y-2">
                <img
                  src="/img/game_genie.webp"
                  alt="Game Genie Logo"
                  className="h-12 w-auto object-contain opacity-75 hover:opacity-100 transition-opacity"
                />
                <p className="text-xs text-slate-400 italic">
                  Aucun code de triche configuré pour ce jeu.
                </p>
                <p className="text-[11px] text-slate-500">
                  Exemples Double Dragon :{" "}
                  <span className="font-mono text-amber-400 font-bold">
                    AAUNYLPA
                  </span>{" "}
                  (Chrono),{" "}
                  <span className="font-mono text-amber-400 font-bold">
                    LEXVGYAA + ZAVNLGAA
                  </span>{" "}
                  (Dernier niveau).
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {codes.map((item) => {
                  const list =
                    item.decodedList || (item.decoded ? [item.decoded] : []);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                        item.active
                          ? "bg-slate-950/70 border-amber-500/40 shadow-sm"
                          : "bg-slate-950/30 border-slate-800 opacity-60"
                      }`}
                    >
                      <div className="flex items-start space-x-3 truncate">
                        <button
                          type="button"
                          onClick={() => onToggleCode(item.id, !item.active)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out mt-0.5 ${
                            item.active ? "bg-amber-500" : "bg-slate-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                              item.active ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <div className="truncate">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-mono font-bold text-amber-300 text-xs tracking-wider">
                              {item.code}
                            </span>
                            <span className="text-xs font-medium text-white truncate">
                              {item.description}
                            </span>
                          </div>
                          {list.length > 0 && (
                            <div className="space-y-0.5 mt-1">
                              {list.map((dec, idx) => (
                                <div
                                  key={idx}
                                  className="text-[10px] text-slate-400 font-mono"
                                >
                                  {list.length > 1 && (
                                    <span className="text-amber-400 font-bold mr-1">
                                      #{idx + 1}:
                                    </span>
                                  )}
                                  Addr: $
                                  {dec.addr
                                    .toString(16)
                                    .toUpperCase()
                                    .padStart(4, "0")}{" "}
                                  | Val: $
                                  {dec.value
                                    .toString(16)
                                    .toUpperCase()
                                    .padStart(2, "0")}
                                  {dec.key !== undefined &&
                                    ` | Key: $${dec.key.toString(16).toUpperCase().padStart(2, "0")}`}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteCode(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 ml-2"
                        title="Supprimer ce code"
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <p className="text-[11px] text-slate-400">
            Combine plusieurs codes avec + ou espace (ex: LEXVGYAA + ZAVNLGAA)
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

GameGenieModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  codes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      active: PropTypes.bool.isRequired,
      decoded: PropTypes.object,
    }),
  ).isRequired,
  enabled: PropTypes.bool.isRequired,
  onToggleEnabled: PropTypes.func.isRequired,
  onAddCode: PropTypes.func.isRequired,
  onToggleCode: PropTypes.func.isRequired,
  onDeleteCode: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired,
};
