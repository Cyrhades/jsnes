import React, { Component } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import config from "./config";
import ControlsModal from "./ControlsModal";
import CartridgeModal from "./CartridgeModal";
import Emulator from "./Emulator";
import RomLibrary from "./RomLibrary";
import SaveStatesModal from "./SaveStatesModal";
import VideoSettingsModal from "./VideoSettingsModal";
import ZipRomModal from "./ZipRomModal";
import GameGenieModal from "./GameGenieModal";
import { loadBinary, detectRomRegion } from "./utils";
import { parseZip } from "../../src/zip-loader.js";
import { idbGet, idbSet, idbRemove } from "./idbStorage.js";

function withParams(Component) {
  return function WrappedComponent(props) {
    return (
      <Component {...props} params={useParams()} location={useLocation()} />
    );
  };
}

/*
 * The UI for the emulator. Also responsible for loading ROM from URL or file.
 */
class RunPage extends Component {
  constructor(props) {
    super(props);

    let savedVideoSettings = {
      luminance: 100,
      saturation: 100,
      gamma: 1.0,
      crtFilter: false,
    };
    try {
      const saved = localStorage.getItem("jsnes_video_settings");
      if (saved) {
        savedVideoSettings = { ...savedVideoSettings, ...JSON.parse(saved) };
      }
    } catch {
      // localStorage not available
    }

    this.state = {
      romName: null,
      romData: null,
      batteryRam: null,
      running: false,
      paused: false,
      crtFilter: savedVideoSettings.crtFilter,
      luminance: savedVideoSettings.luminance,
      saturation: savedVideoSettings.saturation,
      gamma: savedVideoSettings.gamma,
      videoModalOpen: false,
      controlsModalOpen: false,
      saveStatesModalOpen: false,
      cartridgeModalOpen: false,
      gameGenieModalOpen: false,
      cheatsEnabled: true,
      cheatCodes: [],
      saveStateSlots: [],
      zipModalOpen: false,
      zipRoms: [],
      unlimitedSprites: true,
      isRecordingVideo: false,
      recordingSeconds: 0,
      loading: true,
      loadedPercent: 3,
      error: null,
    };
  }

  render() {
    return (
      <div className="h-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
        {/* Modern Navbar */}
        <nav
          className="glass-panel border-b border-slate-800/80 px-4 py-3 flex items-center justify-between z-30 shrink-0 shadow-lg"
          ref={(el) => {
            this.navbar = el;
          }}
        >
          {/* Back button */}
          <div className="w-48">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 border border-slate-700/60 px-3.5 py-1.5 rounded-lg hover:border-indigo-500/50 transition-all no-underline shadow-sm"
            >
              <span>&lsaquo;</span>
              <span>Bibliothèque</span>
            </Link>
          </div>

          {/* Game Title & Status Badge */}
          <div className="flex items-center space-x-3 truncate mx-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0 glow-cyan" />
            <span className="font-bold text-white tracking-wide truncate text-sm sm:text-base">
              {this.state.romName || "Chargement..."}
            </span>
            {this.state.paused && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-md">
                En pause
              </span>
            )}
          </div>

          {/* Controls & Action Buttons Menu */}
          <div className="relative z-50">
            <button
              onClick={this.toggleMenu}
              className={`inline-flex items-center space-x-2 text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                this.state.menuOpen
                  ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 glow-indigo"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500"
              }`}
              title="Menu des options"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <span>Menu</span>
            </button>

            {/* Floating Options Menu Dropdown */}
            {this.state.menuOpen && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div className="fixed inset-0 z-40" onClick={this.closeMenu} />

                <div className="absolute right-0 mt-2 w-64 glass-panel bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 divide-y divide-slate-800/80 space-y-1 glow-purple animate-in fade-in zoom-in-95 duration-150">
                  {/* Menu Group 1: Playback Controls */}
                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        this.handlePauseResume();
                        this.closeMenu();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer bg-transparent border-0 text-left disabled:opacity-40"
                      disabled={!this.state.running}
                    >
                      <div className="flex items-center space-x-2.5">
                        {this.state.paused ? (
                          <svg
                            className="w-4 h-4 text-emerald-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 text-amber-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                          </svg>
                        )}
                        <span>{this.state.paused ? "Reprendre" : "Pause"}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          this.state.paused
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {this.state.paused ? "En pause" : "En cours"}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        this.reloadRom();
                        this.closeMenu();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer bg-transparent border-0 text-left disabled:opacity-40"
                      disabled={!this.state.romData || !!this.state.error}
                    >
                      <div className="flex items-center space-x-2.5">
                        <svg
                          className="w-4 h-4 text-sky-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span>Recharger la ROM</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Reset
                      </span>
                    </button>
                  </div>

                  {/* Menu Group 2: Display & Graphics settings */}
                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        this.toggleVideoModal();
                        this.closeMenu();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer bg-transparent border-0 text-left"
                    >
                      <div className="flex items-center space-x-2.5">
                        <svg
                          className="w-4 h-4 text-sky-400"
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
                        <span>Réglages vidéo</span>
                      </div>
                      <svg
                        className="w-3.5 h-3.5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Menu Group 3: Input, Storage & Cartridge info */}
                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        this.toggleControlsModal();
                        this.closeMenu();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer bg-transparent border-0 text-left disabled:opacity-40"
                      disabled={!!this.state.error}
                    >
                      <div className="flex items-center space-x-2.5">
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
                            d="M11 4a1 1 0 011 1v2a1 1 0 11-2 0V5a1 1 0 011-1zm-4 4a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1zm8 0a1 1 0 011 1v2a1 1 0 11-2 0V9a1 1 0 011-1zm-4 4a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z"
                          />
                        </svg>
                        <span>Manette</span>
                      </div>
                      <span className="text-slate-500 text-xs">&rsaquo;</span>
                    </button>

                    <button
                      onClick={() => {
                        this.toggleSaveStatesModal();
                        this.closeMenu();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer bg-transparent border-0 text-left disabled:opacity-40"
                      disabled={!this.state.romData || !!this.state.error}
                    >
                      <div className="flex items-center space-x-2.5">
                        <svg
                          className="w-4 h-4 text-indigo-400"
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
                        <span>Sauvegardes d'état</span>
                      </div>
                      <span className="text-slate-500 text-xs">&rsaquo;</span>
                    </button>

                    <button
                      onClick={() => {
                        this.toggleCartridgeModal();
                        this.closeMenu();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer bg-transparent border-0 text-left disabled:opacity-40"
                      disabled={!this.state.romData || !!this.state.error}
                    >
                      <div className="flex items-center space-x-2.5">
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
                            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                          />
                        </svg>
                        <span>Cartouche</span>
                      </div>
                      <span className="text-slate-500 text-xs">&rsaquo;</span>
                    </button>

                    <button
                      onClick={() => {
                        this.toggleGameGenieModal();
                        this.closeMenu();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer bg-transparent border-0 text-left disabled:opacity-40"
                      disabled={!this.state.romData || !!this.state.error}
                    >
                      <div className="flex items-center space-x-2.5">
                        <img
                          src="/img/game_genie.webp"
                          alt="Game Genie"
                          className="w-4 h-4 object-contain"
                        />
                        <span>Codes de triche (Game Genie)</span>
                      </div>
                      <span className="text-slate-500 text-xs">&rsaquo;</span>
                    </button>

                    <button
                      onClick={() => {
                        this.takeScreenshot();
                        this.closeMenu();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer bg-transparent border-0 text-left disabled:opacity-40"
                      disabled={!this.state.running || !!this.state.error}
                    >
                      <div className="flex items-center space-x-2.5">
                        <svg
                          className="w-4 h-4 text-pink-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>Capture d'écran</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        PNG
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        this.toggleVideoRecording();
                        this.closeMenu();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer bg-transparent border-0 text-left disabled:opacity-40"
                      disabled={!this.state.running || !!this.state.error}
                    >
                      <div className="flex items-center space-x-2.5">
                        {this.state.isRecordingVideo ? (
                          <div className="relative flex items-center justify-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute" />
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 relative" />
                          </div>
                        ) : (
                          <svg
                            className="w-4 h-4 text-purple-400"
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
                        )}
                        <span>
                          {this.state.isRecordingVideo
                            ? "Arrêter la vidéo"
                            : "Enregistrer une vidéo"}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          this.state.isRecordingVideo
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                            : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        }`}
                      >
                        {this.state.isRecordingVideo
                          ? this.formatRecordingTime(
                              this.state.recordingSeconds,
                            )
                          : "WebM"}
                      </span>
                    </button>
                  </div>

                  {/* Menu Group 4: Exit to ROM Library */}
                  <div className="py-1 space-y-0.5">
                    <Link
                      to="/"
                      onClick={this.closeMenu}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-all no-underline"
                    >
                      <div className="flex items-center space-x-2.5">
                        <svg
                          className="w-4 h-4 text-rose-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>Quitter</span>
                      </div>
                      <span className="text-rose-500 text-xs">&rsaquo;</span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Screen Container Arcade Box */}
        <div
          className="relative flex-1 flex justify-center items-center bg-black overflow-hidden"
          ref={(el) => {
            this.screenContainer = el;
          }}
        >
          {this.state.error ? (
            <div className="glass-panel p-8 rounded-2xl border border-red-500/30 text-center max-w-md space-y-4 glow-purple">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">
                Erreur de chargement
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {this.state.error}
              </p>
              <Link
                to="/"
                className="inline-block text-xs font-semibold px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors no-underline"
              >
                Retourner à la bibliothèque
              </Link>
            </div>
          ) : this.state.loading ? (
            <div className="max-w-md w-full px-6 text-center space-y-4">
              <div className="text-sm font-semibold text-indigo-400 animate-pulse">
                Chargement de la ROM...
              </div>
              <div className="bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-200"
                  style={{ width: this.state.loadedPercent + "%" }}
                />
              </div>
            </div>
          ) : this.state.romData ? (
            <>
              {this.state.isRecordingVideo && (
                <div className="absolute top-4 right-4 z-30 flex items-center space-x-2 bg-rose-950/80 border border-rose-500/50 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
                  <div className="relative flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute" />
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 relative" />
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-200">
                    REC {this.formatRecordingTime(this.state.recordingSeconds)}
                  </span>
                </div>
              )}
              <svg
                className="absolute w-0 h-0 overflow-hidden pointer-events-none"
                aria-hidden="true"
              >
                <filter id="video-gamma-filter">
                  <feComponentTransfer>
                    <feFuncR
                      type="gamma"
                      exponent={1 / Math.max(0.01, this.state.gamma)}
                    />
                    <feFuncG
                      type="gamma"
                      exponent={1 / Math.max(0.01, this.state.gamma)}
                    />
                    <feFuncB
                      type="gamma"
                      exponent={1 / Math.max(0.01, this.state.gamma)}
                    />
                  </feComponentTransfer>
                </filter>
              </svg>
              <div
                className={`relative w-full h-full flex items-center justify-center ${
                  this.state.crtFilter ? "crt-overlay" : ""
                }`}
                style={{
                  filter: `brightness(${this.state.luminance}%) saturate(${this.state.saturation}%) url(#video-gamma-filter)`,
                }}
              >
                <Emulator
                  romData={this.state.romData}
                  batteryRam={this.state.batteryRam}
                  paused={this.state.paused}
                  unlimitedSprites={this.state.unlimitedSprites}
                  onError={this.handleEmulatorError}
                  onBatteryRamWrite={this.handleBatteryRamWrite}
                  ref={(emulator) => {
                    this.emulator = emulator;
                    if (emulator && !this._cheatsApplied) {
                      this._cheatsApplied = true;
                      this.applyCheatsToEngine();
                    }
                  }}
                />
              </div>
            </>
          ) : null}

          {/* Controls Modal */}
          {this.state.controlsModalOpen && (
            <ControlsModal
              isOpen={this.state.controlsModalOpen}
              toggle={this.toggleControlsModal}
              keys={this.emulator.keyboardController.keys}
              setKeys={this.emulator.keyboardController.setKeys}
              promptButton={this.emulator.gamepadController.promptButton}
              gamepadConfig={this.emulator.gamepadController.gamepadConfig}
              setGamepadConfig={
                this.emulator.gamepadController.setGamepadConfig
              }
            />
          )}

          {/* Video Settings Modal */}
          <VideoSettingsModal
            isOpen={this.state.videoModalOpen}
            onClose={this.toggleVideoModal}
            luminance={this.state.luminance}
            saturation={this.state.saturation}
            gamma={this.state.gamma}
            crtFilter={this.state.crtFilter}
            unlimitedSprites={this.state.unlimitedSprites}
            onChangeLuminance={this.onChangeLuminance}
            onChangeSaturation={this.onChangeSaturation}
            onChangeGamma={this.onChangeGamma}
            onToggleCrtFilter={this.toggleCrtFilter}
            onToggleUnlimitedSprites={this.toggleUnlimitedSprites}
            onReset={this.resetVideoSettings}
          />

          {/* Save States Modal */}
          <SaveStatesModal
            isOpen={this.state.saveStatesModalOpen}
            onClose={this.toggleSaveStatesModal}
            romName={this.state.romName}
            slots={this.state.saveStateSlots}
            onSaveSlot={this.saveStateToSlot}
            onLoadSlot={this.loadStateFromSlot}
            onDeleteSlot={this.deleteStateSlot}
            hasBatteryRam={
              this.emulator &&
              this.emulator.browser &&
              this.emulator.browser.nes
                ? this.emulator.browser.nes.hasBatteryRam()
                : false
            }
            onExportSram={this.handleExportSram}
            onImportSram={this.handleImportSram}
          />

          {/* Cartridge Info Modal */}
          <CartridgeModal
            isOpen={this.state.cartridgeModalOpen}
            onClose={this.toggleCartridgeModal}
            romData={this.state.romData}
            romName={this.state.romName}
          />

          {/* Game Genie Cheat Codes Modal */}
          <GameGenieModal
            isOpen={this.state.gameGenieModalOpen}
            onClose={this.toggleGameGenieModal}
            codes={this.state.cheatCodes}
            enabled={this.state.cheatsEnabled}
            onToggleEnabled={this.handleToggleCheatsEnabled}
            onAddCode={this.handleAddCheatCode}
            onToggleCode={this.handleToggleCheatCode}
            onDeleteCode={this.handleDeleteCheatCode}
            onClearAll={this.handleClearAllCheatCodes}
          />

          {/* ZIP Multi-ROM Selection Modal */}
          <ZipRomModal
            isOpen={this.state.zipModalOpen}
            zipName={this.state.romName}
            roms={this.state.zipRoms}
            onSelectRom={this.handleSelectZipRom}
            onClose={this.closeZipModal}
          />
        </div>
      </div>
    );
  }

  componentDidMount() {
    window.addEventListener("resize", this.layout);
    window.addEventListener("keydown", this.handleGlobalKeyDown);
    this.layout();
    this.load();
    this.loadSaveStateSlots();
  }

  componentWillUnmount() {
    this.flushSramSave();
    window.removeEventListener("resize", this.layout);
    window.removeEventListener("keydown", this.handleGlobalKeyDown);
    if (this.currentRequest) {
      this.currentRequest.abort();
    }
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
  }

  load = () => {
    if (this.props.params.slug) {
      const slug = this.props.params.slug;
      const isLocalROM = /^local-/.test(slug);
      const romHash = slug.split("-")[1];
      const romInfo = isLocalROM
        ? RomLibrary.getRomInfoByHash(romHash)
        : config.ROMS[slug];

      if (!romInfo) {
        this.setState({ error: `ROM introuvable : ${slug}` });
        return;
      }

      if (isLocalROM) {
        this.setState({ romName: romInfo.name });
        RomLibrary.getRomData(romHash).then((localROMData) => {
          if (!localROMData) {
            this.setState({
              error: `Impossible de charger les données de la ROM : ${romInfo.name}`,
            });
          } else {
            this.handleLoaded(localROMData, romInfo.name);
          }
        });
      } else {
        this.setState({ romName: romInfo.description });
        this.currentRequest = loadBinary(
          romInfo.url,
          (err, data) => {
            if (err) {
              this.setState({ error: `Erreur de chargement : ${err.message}` });
            } else {
              this.handleLoaded(data, romInfo.description);
            }
          },
          this.handleProgress,
        );
      }
    } else if (this.props.location.state && this.props.location.state.file) {
      const file = this.props.location.state.file;
      this.setState({ romName: file.name });
      let reader = new FileReader();
      reader.readAsBinaryString(file);
      reader.onload = () => {
        this.currentRequest = null;
        this.handleLoaded(reader.result, file.name);
      };
    } else {
      this.setState({ error: "Aucune ROM fournie" });
    }
  };

  handleProgress = (e) => {
    if (e.lengthComputable) {
      this.setState({ loadedPercent: (e.loaded / e.total) * 100 });
    }
  };

  getSramStorageKey = (name = null) => {
    const currentName = name || this.state.romName;
    if (this.props.params.slug) {
      return `sram-${this.props.params.slug}`;
    }
    if (currentName) {
      return `sram-${currentName.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    }
    return null;
  };

  loadSramForRom = async (romName) => {
    const sramKey = this.getSramStorageKey(romName);
    if (!sramKey) return null;
    try {
      const savedSram = await idbGet(sramKey);
      if (savedSram) {
        if (typeof savedSram === "string") {
          try {
            return JSON.parse(savedSram);
          } catch {
            return savedSram;
          }
        }
        return savedSram;
      }
    } catch (e) {
      console.warn("Failed to load SRAM:", e);
    }
    return null;
  };

  handleBatteryRamWrite = () => {
    if (this.sramSaveTimeout) {
      clearTimeout(this.sramSaveTimeout);
    }
    this.sramSaveTimeout = setTimeout(() => {
      this.flushSramSave();
    }, 1000);
  };

  flushSramSave = () => {
    if (this.sramSaveTimeout) {
      clearTimeout(this.sramSaveTimeout);
      this.sramSaveTimeout = null;
    }
    if (
      !this.emulator ||
      !this.emulator.browser ||
      !this.emulator.browser.nes
    ) {
      return;
    }
    const nes = this.emulator.browser.nes;
    if (nes.hasBatteryRam()) {
      const key = this.getSramStorageKey();
      if (key) {
        const sramData = nes.getBatteryRam();
        idbSet(key, Array.from(sramData)).catch((err) =>
          console.warn("Failed to save SRAM:", err),
        );
      }
    }
  };

  handleExportSram = () => {
    if (
      !this.emulator ||
      !this.emulator.browser ||
      !this.emulator.browser.nes
    ) {
      return;
    }
    const nes = this.emulator.browser.nes;
    const sram = nes.getBatteryRam();
    const blob = new Blob([sram], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = `${(this.state.romName || "game").replace(/\.[^/.]+$/, "")}.sav`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  handleImportSram = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;
      const bytes = new Uint8Array(buffer);
      if (this.emulator && this.emulator.browser && this.emulator.browser.nes) {
        this.emulator.browser.nes.setBatteryRam(bytes);
        this.flushSramSave();
        alert("Sauvegarde SRAM (.sav) importée avec succès !");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  handleLoaded = (data, name) => {
    const zipResult = parseZip(data);
    const romNameResolved = name || this.state.romName;

    if (zipResult.isZip) {
      if (zipResult.type === "none") {
        this.setState({
          error: zipResult.error || "Aucune ROM NES valide dans le fichier ZIP",
          loading: false,
        });
        return;
      }

      if (zipResult.type === "single") {
        const targetName = zipResult.name || romNameResolved;
        this.loadSramForRom(targetName).then((sram) => {
          this.setState(
            {
              running: true,
              loading: false,
              romData: zipResult.romData,
              batteryRam: sram || null,
              romName: targetName,
            },
            () => this.loadCheats(),
          );
        });
        return;
      }

      if (zipResult.type === "multiple") {
        this.setState({
          zipModalOpen: true,
          zipRoms: zipResult.roms,
          romName: name || this.state.romName || "Archive.zip",
        });
        return;
      }
    }

    this.loadSramForRom(romNameResolved).then((sram) => {
      this.setState(
        {
          running: true,
          loading: false,
          romData: data,
          batteryRam: sram || null,
          romName: romNameResolved,
        },
        () => this.loadCheats(),
      );
    });
  };

  handleSelectZipRom = (rom) => {
    this.loadSramForRom(rom.name).then((sram) => {
      this.setState(
        {
          zipModalOpen: false,
          zipRoms: [],
          running: true,
          loading: false,
          romData: rom.data,
          batteryRam: sram || null,
          romName: rom.name,
        },
        () => this.loadCheats(),
      );
    });
  };

  closeZipModal = () => {
    this.setState({
      zipModalOpen: false,
      zipRoms: [],
      error: "Aucun jeu sélectionné dans l'archive ZIP",
      loading: false,
    });
  };

  handlePauseResume = () => {
    this.setState({ paused: !this.state.paused });
  };

  toggleMenu = () => {
    this.setState((prev) => ({ menuOpen: !prev.menuOpen }));
  };

  closeMenu = () => {
    this.setState({ menuOpen: false });
  };

  saveVideoSettingsCurrent = () => {
    try {
      localStorage.setItem(
        "jsnes_video_settings",
        JSON.stringify({
          luminance: this.state.luminance,
          saturation: this.state.saturation,
          gamma: this.state.gamma,
          crtFilter: this.state.crtFilter,
        }),
      );
    } catch {
      // localStorage not available
    }
  };

  toggleVideoModal = () => {
    this.setState((prev) => {
      const nextOpen = !prev.videoModalOpen;
      if (nextOpen) {
        return {
          videoModalOpen: true,
          paused: true,
          wasPausedBeforeVideoModal: prev.paused,
        };
      } else {
        return {
          videoModalOpen: false,
          paused: prev.wasPausedBeforeVideoModal || false,
        };
      }
    });
  };

  onChangeLuminance = (luminance) => {
    this.setState({ luminance }, this.saveVideoSettingsCurrent);
  };

  onChangeSaturation = (saturation) => {
    this.setState({ saturation }, this.saveVideoSettingsCurrent);
  };

  onChangeGamma = (gamma) => {
    this.setState({ gamma }, this.saveVideoSettingsCurrent);
  };

  toggleCrtFilter = () => {
    this.setState(
      (prev) => ({ crtFilter: !prev.crtFilter }),
      this.saveVideoSettingsCurrent,
    );
  };

  resetVideoSettings = () => {
    this.setState(
      {
        luminance: 100,
        saturation: 100,
        gamma: 1.0,
        crtFilter: false,
      },
      this.saveVideoSettingsCurrent,
    );
  };

  toggleUnlimitedSprites = () => {
    this.setState((prev) => ({ unlimitedSprites: !prev.unlimitedSprites }));
  };

  takeScreenshot = () => {
    if (this.emulator) {
      const img = this.emulator.screenshot();
      if (img && img.src) {
        const a = document.createElement("a");
        a.href = img.src;
        a.download = `${this.state.romName || "jsnes"}-screenshot.png`;
        a.click();
      }
    }
  };

  layout = () => {
    let navbarHeight = parseFloat(window.getComputedStyle(this.navbar).height);
    this.screenContainer.style.height = `${
      window.innerHeight - navbarHeight
    }px`;
    if (this.emulator) {
      this.emulator.fitInParent();
    }
  };

  handleEmulatorError = (error) => {
    this.setState({
      error: error.message,
      running: false,
      paused: false,
    });
  };

  toggleControlsModal = () => {
    this.setState({ controlsModalOpen: !this.state.controlsModalOpen });
  };

  getSaveStateKey = (slotNumber) => {
    const slug = this.props.params.slug || "game";
    return `jsnes_savestate_${slug}_slot${slotNumber}`;
  };

  parseSaveData = (raw) => {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.warn("Could not parse save data string:", e);
        return null;
      }
    }
    return null;
  };

  loadSaveStateSlots = async () => {
    const slots = [];
    for (let slot = 1; slot <= 3; slot++) {
      const key = this.getSaveStateKey(slot);
      try {
        const raw = await idbGet(key);
        const parsed = this.parseSaveData(raw);
        if (parsed) {
          slots.push(parsed);
        }
      } catch {
        // ignore
      }
    }
    this.setState({ saveStateSlots: slots });
  };

  saveStateToSlot = async (slotNumber) => {
    if (!this.emulator || !this.emulator.browser || !this.emulator.browser.nes)
      return;
    try {
      const state = this.emulator.browser.nes.toJSON();
      const screenshotImg = this.emulator.screenshot();
      const payload = {
        slot: slotNumber,
        timestamp: Date.now(),
        screenshot: screenshotImg ? screenshotImg.src : null,
        state,
      };
      const key = this.getSaveStateKey(slotNumber);
      await idbSet(key, payload);
      await this.loadSaveStateSlots();
    } catch (e) {
      console.error("Save state failed:", e);
    }
  };

  loadStateFromSlot = async (slotNumber) => {
    if (!this.emulator || !this.emulator.browser || !this.emulator.browser.nes)
      return;
    try {
      const key = this.getSaveStateKey(slotNumber);
      const raw = await idbGet(key);
      const parsed = this.parseSaveData(raw);
      if (parsed && parsed.state) {
        this.emulator.browser.nes.fromJSON(parsed.state);
        // Unpause emulation & close save states modal if open
        this.setState({
          saveStatesModalOpen: false,
          paused: false,
        });
      }
    } catch (e) {
      console.error("Load state failed:", e);
    }
  };

  deleteStateSlot = async (slotNumber) => {
    try {
      const key = this.getSaveStateKey(slotNumber);
      await idbRemove(key);
      await this.loadSaveStateSlots();
    } catch (e) {
      console.error("Delete save state failed:", e);
    }
  };

  toggleSaveStatesModal = () => {
    this.setState(
      (prev) => {
        const nextOpen = !prev.saveStatesModalOpen;
        if (nextOpen) {
          return {
            saveStatesModalOpen: true,
            paused: true,
            wasPausedBeforeSaveStatesModal: prev.paused,
          };
        } else {
          return {
            saveStatesModalOpen: false,
            paused: prev.wasPausedBeforeSaveStatesModal || false,
          };
        }
      },
      () => {
        if (this.state.saveStatesModalOpen) {
          this.loadSaveStateSlots();
        }
      },
    );
  };

  toggleCartridgeModal = () => {
    this.setState({ cartridgeModalOpen: !this.state.cartridgeModalOpen });
  };

  getSlotFromEvent = (e) => {
    if (!e) return null;
    const code = e.code || "";
    const key = e.key || "";

    // Check physical code or key character for Slot 1
    if (
      code === "Digit1" ||
      code === "Numpad1" ||
      key === "1" ||
      key === "&" ||
      (code.includes("Numpad") && (key === "1" || key === "End"))
    )
      return 1;

    // Check physical code or key character for Slot 2
    if (
      code === "Digit2" ||
      code === "Numpad2" ||
      key === "2" ||
      key === "é" ||
      (code.includes("Numpad") &&
        (key === "2" || key === "ArrowDown" || key === "Down"))
    )
      return 2;

    // Check physical code or key character for Slot 3
    if (
      code === "Digit3" ||
      code === "Numpad3" ||
      key === "3" ||
      key === '"' ||
      (code.includes("Numpad") &&
        (key === "3" || key === "PageDown" || key === "Next"))
    )
      return 3;

    return null;
  };

  handleGlobalKeyDown = (e) => {
    if (!e || e.repeat) return;
    if (
      e.target &&
      (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
    )
      return;

    const isCtrl = e.ctrlKey || e.metaKey;
    const isAlt = e.altKey;
    const isShift = e.shiftKey;

    // Quick Load (Slot 1): Ctrl+Alt+L or Ctrl+Shift+L
    if (isCtrl && (isAlt || isShift) && (e.key === "L" || e.key === "l")) {
      e.preventDefault();
      this.loadStateFromSlot(1);
      return;
    }

    // Quick Save (Slot 1): Ctrl+S or Shift+S (without Alt)
    if ((isCtrl || isShift) && !isAlt && (e.key === "S" || e.key === "s")) {
      e.preventDefault();
      this.saveStateToSlot(1);
      return;
    }

    const slot = this.getSlotFromEvent(e);
    if (slot !== null) {
      // Load Slot 1..3: Ctrl+Alt+[1..3] or Ctrl+Shift+[1..3]
      if (isCtrl && (isAlt || isShift)) {
        e.preventDefault();
        this.loadStateFromSlot(slot);
        return;
      }
      // Save Slot 1..3: Ctrl+[1..3] or Shift+[1..3] (without Alt)
      if ((isCtrl || isShift) && !isAlt) {
        e.preventDefault();
        this.saveStateToSlot(slot);
        return;
      }
    }

    // Function keys (F2 = Save 1, F4 = Load 1, F5 = Save 1, F8 = Load 1)
    if (e.key === "F2" || e.key === "F5") {
      e.preventDefault();
      this.saveStateToSlot(1);
    } else if (e.key === "F4" || e.key === "F8") {
      e.preventDefault();
      this.loadStateFromSlot(1);
    }
  };

  reloadRom = () => {
    if (this.emulator && this.emulator.browser && this.state.romData) {
      try {
        this.emulator.browser.loadROM(this.state.romData);
        this.emulator.browser.start();
        this.setState({
          paused: false,
          error: null,
        });
        // Re-apply Game Genie codes after ROM reload
        setTimeout(() => this.applyCheatsToEngine(), 50);
      } catch (e) {
        console.error("ROM reload failed:", e);
      }
    }
  };

  formatRecordingTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  startVideoRecording = () => {
    if (!this.emulator || !this.emulator.browser) return;
    try {
      const canvas = this.emulator.browser._screen?.canvas;
      if (!canvas || typeof canvas.captureStream !== "function") {
        alert("L'enregistrement vidéo n'est pas supporté par ce navigateur.");
        return;
      }

      const canvasStream = canvas.captureStream(60);
      let combinedStream = canvasStream;

      const speakers = this.emulator.browser._speakers;
      let audioDest = null;
      if (speakers && speakers.audioCtx && speakers.node) {
        try {
          audioDest = speakers.audioCtx.createMediaStreamDestination();
          speakers.node.connect(audioDest);
          combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...audioDest.stream.getAudioTracks(),
          ]);
        } catch (e) {
          console.warn("Could not attach audio track to video recording:", e);
        }
      }

      let mimeType = "";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
          mimeType = "video/webm;codecs=vp9,opus";
        } else if (
          MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ) {
          mimeType = "video/webm;codecs=vp8,opus";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          mimeType = "video/webm";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
        }
      }

      const recorderOptions = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioDest && speakers && speakers.node) {
          try {
            speakers.node.disconnect(audioDest);
          } catch {}
        }

        if (chunks.length > 0) {
          const finalMime = mimeType || "video/webm";
          const blob = new Blob(chunks, { type: finalMime });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          const slug = this.props.params.slug || "game";
          const ext = finalMime.includes("mp4") ? "mp4" : "webm";
          a.download = `nes-${slug}-${Date.now()}.${ext}`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        }
      };

      mediaRecorder.start(1000);
      this.mediaRecorder = mediaRecorder;
      this.recordingAudioDest = audioDest;

      this.setState({
        isRecordingVideo: true,
        recordingSeconds: 0,
      });

      this.recordingTimer = setInterval(() => {
        this.setState((prev) => ({
          recordingSeconds: prev.recordingSeconds + 1,
        }));
      }, 1000);
    } catch (e) {
      console.error("Failed to start video recording:", e);
    }
  };

  stopVideoRecording = () => {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    this.mediaRecorder = null;
    this.recordingAudioDest = null;
    this.setState({
      isRecordingVideo: false,
      recordingSeconds: 0,
    });
  };

  toggleVideoRecording = () => {
    if (this.state.isRecordingVideo) {
      this.stopVideoRecording();
    } else {
      this.startVideoRecording();
    }
  };

  getCheatsKey = () => {
    const slug = this.props.params.slug || "game";
    return `jsnes_cheats_${slug}`;
  };

  loadCheats = () => {
    this._cheatsApplied = false;
    try {
      const raw = localStorage.getItem(this.getCheatsKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        const cheatCodes = parsed.codes || [];
        const cheatsEnabled =
          parsed.enabled !== undefined ? parsed.enabled : true;
        this.setState({ cheatCodes, cheatsEnabled }, () => {
          this._waitAndApplyCheats();
        });
        return;
      }
    } catch {}
    this.setState({ cheatCodes: [], cheatsEnabled: true });
  };

  _waitAndApplyCheats = () => {
    // Retry until the emulator ref is available (React renders async)
    if (this.emulator && this.emulator.browser && this.emulator.browser.nes) {
      this._cheatsApplied = true;
      this.applyCheatsToEngine();
    } else {
      // Retry up to 2 seconds (40 x 50ms)
      if (!this._cheatsRetryCount) this._cheatsRetryCount = 0;
      this._cheatsRetryCount++;
      if (this._cheatsRetryCount < 40) {
        setTimeout(() => this._waitAndApplyCheats(), 50);
      } else {
        this._cheatsRetryCount = 0;
      }
    }
  };

  saveCheats = (cheatCodes, cheatsEnabled) => {
    try {
      localStorage.setItem(
        this.getCheatsKey(),
        JSON.stringify({ codes: cheatCodes, enabled: cheatsEnabled }),
      );
    } catch {}
  };

  applyCheatsToEngine = () => {
    if (!this.emulator || !this.emulator.browser || !this.emulator.browser.nes)
      return;
    const nes = this.emulator.browser.nes;
    nes.gameGenie.removeAllCodes();
    nes.gameGenie.setEnabled(this.state.cheatsEnabled);

    if (!this.state.cheatsEnabled) return;

    let appliedCount = 0;
    this.state.cheatCodes.forEach((item) => {
      if (item.active) {
        const codesToApply = item.rawCodes || [item.code];
        codesToApply.forEach((code) => {
          try {
            nes.gameGenie.addCode(code);
            appliedCount++;
          } catch (e) {
            console.warn("Failed to apply cheat code:", code, e);
          }
        });
      }
    });
    if (appliedCount > 0) {
      console.log(
        `[Game Genie] ${appliedCount} code(s) active in engine, patches:`,
        nes.gameGenie.patches.map((p) => ({
          addr: "$" + p.addr.toString(16).toUpperCase().padStart(4, "0"),
          val: "$" + p.value.toString(16).toUpperCase().padStart(2, "0"),
          key:
            p.key !== undefined
              ? "$" + p.key.toString(16).toUpperCase().padStart(2, "0")
              : "none",
        })),
      );
    }
  };

  toggleGameGenieModal = () => {
    this.setState((prev) => {
      const nextOpen = !prev.gameGenieModalOpen;
      if (nextOpen) {
        if (this.emulator && this.emulator.browser) {
          this.emulator.browser.stop();
        }
        return {
          gameGenieModalOpen: true,
          paused: true,
          wasPausedBeforeGameGenieModal: prev.paused,
        };
      } else {
        const shouldResume = !prev.wasPausedBeforeGameGenieModal;
        if (shouldResume && this.emulator && this.emulator.browser) {
          this.emulator.browser.start();
        }
        return {
          gameGenieModalOpen: false,
          paused: !shouldResume,
        };
      }
    });
  };

  handleAddCheatCode = (inputCode, description) => {
    if (!this.emulator || !this.emulator.browser || !this.emulator.browser.nes)
      return false;
    const nes = this.emulator.browser.nes;

    const tokens = inputCode
      .split(/[\s+,\/;]+/)
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0);

    if (tokens.length === 0) return false;

    const decodedList = [];
    const validCodes = [];

    for (const subCode of tokens) {
      const decoded = nes.gameGenie.decode(subCode);
      if (!decoded) {
        return false;
      }
      decodedList.push(decoded);
      validCodes.push(subCode);
    }

    const formattedCode = validCodes.join(" + ");
    const finalDesc = description.trim() || `Code ${formattedCode}`;

    const newCodeItem = {
      id: `cheat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      code: formattedCode,
      rawCodes: validCodes,
      description: finalDesc,
      active: true,
      decodedList: decodedList,
      decoded: decodedList[0],
    };

    const nextCodes = [...this.state.cheatCodes, newCodeItem];
    this.setState({ cheatCodes: nextCodes }, () => {
      this.saveCheats(nextCodes, this.state.cheatsEnabled);
      this.applyCheatsToEngine();
    });

    return true;
  };

  handleToggleCheatCode = (id, active) => {
    const nextCodes = this.state.cheatCodes.map((item) =>
      item.id === id ? { ...item, active } : item,
    );
    this.setState({ cheatCodes: nextCodes }, () => {
      this.saveCheats(nextCodes, this.state.cheatsEnabled);
      this.applyCheatsToEngine();
    });
  };

  handleDeleteCheatCode = (id) => {
    const nextCodes = this.state.cheatCodes.filter((item) => item.id !== id);
    this.setState({ cheatCodes: nextCodes }, () => {
      this.saveCheats(nextCodes, this.state.cheatsEnabled);
      this.applyCheatsToEngine();
    });
  };

  handleToggleCheatsEnabled = (enabled) => {
    this.setState({ cheatsEnabled: enabled }, () => {
      this.saveCheats(this.state.cheatCodes, enabled);
      this.applyCheatsToEngine();
    });
  };

  handleClearAllCheatCodes = () => {
    this.setState({ cheatCodes: [] }, () => {
      this.saveCheats([], this.state.cheatsEnabled);
      this.applyCheatsToEngine();
    });
  };
}

export default withParams(RunPage);
