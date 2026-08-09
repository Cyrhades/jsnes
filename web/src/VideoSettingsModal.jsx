import React from "react";
import PropTypes from "prop-types";

/**
 * Floating panel for adjusting emulator video rendering settings:
 * - Luminance (Brightness)
 * - Saturation
 * - Gamma Correction
 * - CRT Scanline Filter Toggle
 * - Anti-clignotement (Unlimited Sprites)
 */
function VideoSettingsModal({
  isOpen,
  onClose,
  luminance,
  saturation,
  gamma,
  crtFilter,
  unlimitedSprites,
  onChangeLuminance,
  onChangeSaturation,
  onChangeGamma,
  onToggleCrtFilter,
  onToggleUnlimitedSprites,
  onReset,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-4 z-50 p-2 max-w-sm sm:max-w-md w-full animate-fade-in pointer-events-none">
      <div className="pointer-events-auto bg-slate-900/95 border border-indigo-500/30 text-white rounded-2xl shadow-2xl glow-indigo w-full overflow-hidden flex flex-col glass-panel max-h-[calc(100vh-5rem)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
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
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Réglages vidéo
              </h2>
              <p className="text-[11px] text-slate-400">
                Rendu visuel en temps réel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            &times;
          </button>
        </div>

        {/* Form Controls */}
        <div className="p-5 space-y-4">
          {/* Luminance */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-200">Luminance</label>
              <span className="font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded text-[11px]">
                {luminance}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={luminance}
              onChange={(e) => onChangeLuminance(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-200">Saturation</label>
              <span className="font-mono text-purple-300 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded text-[11px]">
                {saturation}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={saturation}
              onChange={(e) => onChangeSaturation(Number(e.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Gamma */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-200">Gamma</label>
              <span className="font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded text-[11px]">
                {Number(gamma).toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.50"
              max="2.00"
              step="0.05"
              value={gamma}
              onChange={(e) => onChangeGamma(Number(e.target.value))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Filtre CRT Toggle */}
          <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <svg
                className="w-4 h-4 text-sky-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 022 2z"
                />
              </svg>
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Filtre CRT
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Effet d'écran à balayage rétro
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleCrtFilter}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                crtFilter
                  ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 glow-indigo"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              {crtFilter ? "ACTIVÉ" : "DÉSACTIVÉ"}
            </button>
          </div>

          {/* Anti-clignotement (Sprites illimités) */}
          <div className="pt-2.5 border-t border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <svg
                  className="w-4 h-4 text-purple-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="text-xs font-semibold text-slate-200">
                  Anti-clignotement
                </span>
              </div>

              <button
                type="button"
                onClick={onToggleUnlimitedSprites}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  unlimitedSprites
                    ? "bg-purple-600/30 border-purple-400 text-purple-200 glow-purple"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                {unlimitedSprites ? "ACTIVÉ" : "DÉSACTIVÉ"}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed pl-6">
              Sur la NES d'origine, lorsque trop de sprites sont alignés
              horizontalement, la console alterne leur affichage, ce qui
              provoque un clignotement. Activer cette option supprime cette
              limite.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-lg transition-colors cursor-pointer shadow"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

VideoSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  luminance: PropTypes.number.isRequired,
  saturation: PropTypes.number.isRequired,
  gamma: PropTypes.number.isRequired,
  crtFilter: PropTypes.bool.isRequired,
  unlimitedSprites: PropTypes.bool.isRequired,
  onChangeLuminance: PropTypes.func.isRequired,
  onChangeSaturation: PropTypes.func.isRequired,
  onChangeGamma: PropTypes.func.isRequired,
  onToggleCrtFilter: PropTypes.func.isRequired,
  onToggleUnlimitedSprites: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default VideoSettingsModal;
