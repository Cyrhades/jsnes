import React, { Component } from "react";
import { useNavigate } from "react-router-dom";
import config from "./config";

import RomLibrary from "./RomLibrary";
import ZipRomModal from "./ZipRomModal";
import { generateRomThumbnail } from "./romThumbnail";
import { loadBinary, detectRomRegion } from "./utils";

function withNavigate(Component) {
  return function WrappedComponent(props) {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  };
}

class ListPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      romLibrary: RomLibrary.load(),
      zipModalOpen: false,
      zipName: "",
      zipRoms: [],
      sampleThumbnails: {},
      isDragging: false,
    };
    this.fileInputRef = React.createRef();
  }

  componentDidMount() {
    this.updateLibrary();
    this.loadSampleThumbnails();
  }

  loadSampleThumbnails = () => {
    // Generate thumbnails for default sample ROMs
    Object.keys(config.ROMS).forEach((key) => {
      const romInfo = config.ROMS[key];
      if (romInfo && romInfo.url) {
        loadBinary(romInfo.url, (err, data) => {
          if (!err && data) {
            generateRomThumbnail(data, 60, 300, key).then((thumb) => {
              if (thumb) {
                this.setState((prev) => ({
                  sampleThumbnails: {
                    ...prev.sampleThumbnails,
                    [key]: thumb,
                  },
                }));
              }
            });
          }
        });
      }
    });
  };

  render() {
    return (
      <div
        className="min-h-full bg-slate-950 text-slate-100 py-10 px-4 sm:px-8 flex flex-col items-center"
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop}
      >
        <div className="max-w-5xl w-full space-y-10">
          {/* Header Hero */}
          <header className="text-center space-y-4 pt-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider glow-indigo">
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
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <span>Émulateur NES JavaScript</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              JSNES Arcade
            </h1>
            <p className="max-w-xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
              Jouez à vos jeux Nintendo NES directement dans votre navigateur.
              Glissez-déposez n'importe quel fichier{" "}
              <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">
                .nes
              </code>{" "}
              ou{" "}
              <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">
                .zip
              </code>
              .
            </p>
            <div className="pt-2">
              <a
                href="https://github.com/Cyrhades/jsnes"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
              >
                <span>Code source sur GitHub</span>
                <span>&rarr;</span>
              </a>
            </div>
          </header>

          {/* Interactive Drag & Drop Area */}
          <div
            onClick={() => this.fileInputRef.current?.click()}
            className={`glass-panel border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 group ${
              this.state.isDragging
                ? "border-indigo-400 bg-indigo-950/40 glow-indigo scale-[1.01]"
                : "border-slate-700/80 hover:border-indigo-500/60 hover:bg-slate-900/60 hover:shadow-indigo-500/10"
            }`}
          >
            <input
              type="file"
              ref={this.fileInputRef}
              onChange={this.handleFileInput}
              accept=".nes,.zip"
              className="hidden"
            />
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600/20 transition-all">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
              Glissez-déposez votre ROM ou Pack ZIP ici
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Formats pris en charge : <strong>.nes</strong> ou archives{" "}
              <strong>.zip</strong> (mono et multi-ROMs)
            </p>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all cursor-pointer glow-indigo"
            >
              Parcourir un fichier...
            </button>
          </div>

          {/* Demo ROMs Grid */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Jeux de démonstration</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(config.ROMS)
                .sort()
                .map((key) => {
                  const rom = config.ROMS[key];
                  const thumb = this.state.sampleThumbnails[key];

                  return (
                    <div
                      key={key}
                      onClick={() =>
                        this.navigateToPath("/run/" + encodeURIComponent(key))
                      }
                      className="group glass-panel rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-indigo-500/20 hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div className="space-y-3">
                        <div className="w-full h-36 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative flex items-center justify-center group-hover:border-indigo-500/40 transition-colors">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={rom.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <svg
                              className="w-10 h-10 text-slate-700 group-hover:text-indigo-400/60 transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z"
                              />
                            </svg>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded border ${
                                detectRomRegion(rom.name) === "PAL"
                                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                                  : "bg-sky-950/80 text-sky-300 border-sky-500/40"
                              }`}
                            >
                              {detectRomRegion(rom.name)}
                            </span>
                            <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors text-base truncate">
                              {rom.name}
                            </h3>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {rom.description || "Jeu NES officiel"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold group-hover:text-indigo-300">
                        <span>Lancer le jeu</span>
                        <span className="group-hover:translate-x-1 transition-transform">
                          &rsaquo;
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* Local Played Library & Packs Grid */}
          {this.state.romLibrary.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-slate-900">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <span>
                    Ma bibliothèque locale ({this.state.romLibrary.length})
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {this.state.romLibrary
                  .sort((a, b) => new Date(b.added) - new Date(a.added))
                  .map((rom) => (
                    <div
                      key={rom.hash}
                      onClick={() => this.handleLibraryCardClick(rom)}
                      className="group glass-panel rounded-xl p-4 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/80 transition-all duration-200 flex flex-col justify-between shadow-md relative cursor-pointer"
                    >
                      <div className="space-y-3">
                        <div className="w-full h-36 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative flex items-center justify-center">
                          {rom.isPack ? (
                            <div className="w-full h-full bg-indigo-950/40 border border-indigo-500/30 flex flex-col items-center justify-center p-4 text-center">
                              <svg
                                className="w-10 h-10 text-indigo-400 mb-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1.5"
                                  d="M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                />
                              </svg>
                              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-900/80 border border-indigo-700 px-2.5 py-1 rounded-md">
                                PACK • {rom.romCount || 0} JEUX
                              </span>
                            </div>
                          ) : rom.thumbnail ? (
                            <img
                              src={rom.thumbnail}
                              alt={rom.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <svg
                              className="w-10 h-10 text-slate-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z"
                              />
                            </svg>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            {rom.isPack ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700 px-1.5 py-0.5 rounded">
                                PACK ZIP
                              </span>
                            ) : (
                              <span
                                className={`px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded border ${
                                  detectRomRegion(rom.name, rom.data) === "PAL"
                                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                                    : "bg-sky-950/80 text-sky-300 border-sky-500/40"
                                }`}
                              >
                                {detectRomRegion(rom.name, rom.data)}
                              </span>
                            )}
                            <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors text-base truncate pr-6">
                              {rom.name}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Ajouté le {new Date(rom.added).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          this.deleteRom(rom.hash);
                        }}
                        className="absolute top-6 right-6 w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/50 flex items-center justify-center transition-all cursor-pointer z-10"
                        title="Supprimer de la bibliothèque"
                      >
                        &times;
                      </button>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-purple-400 font-semibold group-hover:text-purple-300">
                        <span>
                          {rom.isPack
                            ? "Ouvrir le Pack ZIP"
                            : "Jouer maintenant"}
                        </span>
                        <span className="group-hover:translate-x-1 transition-transform">
                          &rsaquo;
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* Multi-ROM ZIP Selection Modal */}
        <ZipRomModal
          isOpen={this.state.zipModalOpen}
          zipName={this.state.zipName}
          roms={this.state.zipRoms}
          onSelectRom={this.handleSelectZipRom}
          onClose={this.closeZipModal}
        />
      </div>
    );
  }

  deleteRom = (hash) => {
    RomLibrary.delete(hash).then(() => {
      this.updateLibrary();
    });
  };

  updateLibrary = () => {
    RomLibrary.loadAsync().then((romLibrary) => {
      this.setState({ romLibrary });
    });
  };

  handleLibraryCardClick = async (rom) => {
    if (rom.isPack) {
      const packData = await RomLibrary.getZipPackRoms(rom.hash);
      if (packData) {
        this.setState({
          zipModalOpen: true,
          zipName: packData.zipName,
          zipRoms: packData.roms,
        });
      } else {
        alert("Impossible d'ouvrir le pack ZIP.");
      }
    } else {
      this.navigateToPath("/run/local-" + rom.hash);
    }
  };

  handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!this.state.isDragging) {
      this.setState({ isDragging: true });
    }
  };

  handleDragLeave = (e) => {
    e.preventDefault();
    if (this.state.isDragging) {
      this.setState({ isDragging: false });
    }
  };

  handleFileInput = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      this.processFile(file);
    }
  };

  handleDrop = (e) => {
    e.preventDefault();
    this.setState({ isDragging: false });

    const file = e.dataTransfer.items
      ? e.dataTransfer.items[0].getAsFile()
      : e.dataTransfer.files[0];

    if (file) {
      this.processFile(file);
    }
  };

  processFile = (file) => {
    RomLibrary.save(file)
      .then((result) => {
        if (result && result.isZip && result.type === "multiple") {
          this.updateLibrary();
          this.setState({
            zipModalOpen: true,
            zipName: result.zipName,
            zipRoms: result.roms,
          });
        } else if (result && result.hash) {
          this.updateLibrary();
          this.navigateToPath("/run/local-" + result.hash);
        }
      })
      .catch((err) => {
        alert(err.message || "Erreur lors du traitement de la ROM");
      });
  };

  handleSelectZipRom = (rom) => {
    RomLibrary.saveExtractedRom(rom.name, rom.data)
      .then((savedRom) => {
        this.setState({ zipModalOpen: false, zipRoms: [] });
        this.updateLibrary();
        this.navigateToPath("/run/local-" + savedRom.hash);
      })
      .catch((err) => {
        alert(err.message || "Erreur d'extraction de la ROM");
      });
  };

  closeZipModal = () => {
    this.setState({ zipModalOpen: false, zipRoms: [] });
  };

  navigateToPath = (targetPath) => {
    if (this.props.navigate) {
      this.props.navigate(targetPath);
    } else if (this.props.history) {
      this.props.history.push({ pathname: targetPath });
    }
  };
}

export default withNavigate(ListPage);
