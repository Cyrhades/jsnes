import React, { Component } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import config from "./config";
import ControlsModal from "./ControlsModal";
import Emulator from "./Emulator";
import RomLibrary from "./RomLibrary";
import VideoSettingsModal from "./VideoSettingsModal";
import ZipRomModal from "./ZipRomModal";
import { loadBinary, detectRomRegion } from "./utils";
import { parseZip } from "../../src/zip-loader.js";

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
      running: false,
      paused: false,
      crtFilter: savedVideoSettings.crtFilter,
      luminance: savedVideoSettings.luminance,
      saturation: savedVideoSettings.saturation,
      gamma: savedVideoSettings.gamma,
      videoModalOpen: false,
      unlimitedSprites: true,
      controlsModalOpen: false,
      zipModalOpen: false,
      zipRoms: [],
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
                  {/* Menu Group 1: Navigation & Game state */}
                  <div className="py-1 space-y-0.5">
                    <Link
                      to="/"
                      onClick={this.closeMenu}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all no-underline"
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
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        <span>Bibliothèque</span>
                      </div>
                      <span className="text-slate-500 text-xs">&rsaquo;</span>
                    </Link>

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

                  {/* Menu Group 3: Input & Actions */}
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
                        <span>Capture</span>
                      </div>
                      <span className="text-slate-500 text-xs">&rsaquo;</span>
                    </button>
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
                  paused={this.state.paused}
                  unlimitedSprites={this.state.unlimitedSprites}
                  onError={this.handleEmulatorError}
                  ref={(emulator) => {
                    this.emulator = emulator;
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
    this.layout();
    this.load();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.layout);
    if (this.currentRequest) {
      this.currentRequest.abort();
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

  handleLoaded = (data, name) => {
    const zipResult = parseZip(data);

    if (zipResult.isZip) {
      if (zipResult.type === "none") {
        this.setState({
          error: zipResult.error || "Aucune ROM NES valide dans le fichier ZIP",
          loading: false,
        });
        return;
      }

      if (zipResult.type === "single") {
        this.setState({
          running: true,
          loading: false,
          romData: zipResult.romData,
          romName: zipResult.name || name || this.state.romName,
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

    this.setState({
      running: true,
      loading: false,
      romData: data,
      romName: name || this.state.romName,
    });
  };

  handleSelectZipRom = (rom) => {
    this.setState({
      zipModalOpen: false,
      zipRoms: [],
      running: true,
      loading: false,
      romData: rom.data,
      romName: rom.name,
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
}

export default withParams(RunPage);
