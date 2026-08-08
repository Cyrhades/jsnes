import React, { Component } from "react";
import { Controller } from "jsnes";
import ControlMapperRow from "./ControlMapperRow";

const getDefaultGamepadConfig = () => ({
  buttons: [
    { type: "button", code: 0, buttonId: Controller.BUTTON_B },
    { type: "button", code: 1, buttonId: Controller.BUTTON_A },
    { type: "button", code: 2, buttonId: Controller.BUTTON_TURBO_B },
    { type: "button", code: 3, buttonId: Controller.BUTTON_TURBO_A },
    { type: "button", code: 8, buttonId: Controller.BUTTON_SELECT },
    { type: "button", code: 9, buttonId: Controller.BUTTON_START },
    { type: "button", code: 12, buttonId: Controller.BUTTON_UP },
    { type: "button", code: 13, buttonId: Controller.BUTTON_DOWN },
    { type: "button", code: 14, buttonId: Controller.BUTTON_LEFT },
    { type: "button", code: 15, buttonId: Controller.BUTTON_RIGHT },
    { type: "axis", code: 0, value: -1, buttonId: Controller.BUTTON_LEFT },
    { type: "axis", code: 0, value: 1, buttonId: Controller.BUTTON_RIGHT },
    { type: "axis", code: 1, value: -1, buttonId: Controller.BUTTON_UP },
    { type: "axis", code: 1, value: 1, buttonId: Controller.BUTTON_DOWN },
  ],
});

class ControlsModal extends Component {
  constructor(props) {
    super(props);
    const gamepadConfig = props.gamepadConfig
      ? { ...props.gamepadConfig }
      : { playerGamepadId: [null, null], configs: {} };

    gamepadConfig.playerGamepadId = gamepadConfig.playerGamepadId || [
      null,
      null,
    ];
    gamepadConfig.configs = gamepadConfig.configs || {};

    this.state = {
      gamepadConfig,
      keys: props.keys || {},
      button: undefined,
      promptPlayer: 1,
      currentPromptButton: -1,
      connectedGamepads: [],
      modified: false,
    };
  }

  componentDidMount() {
    this.detectGamepads();
    window.addEventListener("gamepadconnected", this.detectGamepads);
    window.addEventListener("gamepaddisconnected", this.detectGamepads);
    window.addEventListener("keydown", this.detectGamepads);
    window.addEventListener("mousedown", this.detectGamepads);
    this.gamepadInterval = setInterval(this.detectGamepads, 200);
  }

  componentWillUnmount() {
    if (this.state.modified) {
      this.saveToStorage();
    }
    window.removeEventListener("gamepadconnected", this.detectGamepads);
    window.removeEventListener("gamepaddisconnected", this.detectGamepads);
    window.removeEventListener("keydown", this.detectGamepads);
    window.removeEventListener("mousedown", this.detectGamepads);
    if (this.gamepadInterval) clearInterval(this.gamepadInterval);
    this.removeKeyListener();
  }

  saveToStorage = () => {
    if (this.props.setKeys) {
      this.props.setKeys(this.state.keys);
    }
    if (this.props.setGamepadConfig) {
      this.props.setGamepadConfig(this.state.gamepadConfig);
    }
  };

  detectGamepads = () => {
    const rawGamepads = navigator.getGamepads
      ? navigator.getGamepads()
      : navigator.webkitGetGamepads
        ? navigator.webkitGetGamepads()
        : [];

    const activeGamepads = [];
    for (let i = 0; i < rawGamepads.length; i++) {
      const gp = rawGamepads[i];
      if (gp && gp.connected) {
        activeGamepads.push({
          index: gp.index,
          id: gp.id,
          buttonsCount: gp.buttons ? gp.buttons.length : 0,
          axesCount: gp.axes ? gp.axes.length : 0,
        });
      }
    }

    this.setState({ connectedGamepads: activeGamepads });
  };

  handleDeviceChange = (playerNumber, deviceId) => {
    const pIdx = playerNumber - 1;
    const playerGamepadId = [
      ...(this.state.gamepadConfig.playerGamepadId || [null, null]),
    ];
    const newGpId = deviceId === "keyboard" ? null : deviceId;
    playerGamepadId[pIdx] = newGpId;

    const configs = { ...this.state.gamepadConfig.configs };
    const rawConfigKey = newGpId
      ? newGpId.includes("|")
        ? newGpId.split("|")[1]
        : newGpId
      : null;

    if (
      rawConfigKey &&
      (!configs[rawConfigKey] ||
        !configs[rawConfigKey].buttons ||
        configs[rawConfigKey].buttons.length === 0)
    ) {
      configs[rawConfigKey] = getDefaultGamepadConfig();
    }

    const newGamepadConfig = {
      ...this.state.gamepadConfig,
      playerGamepadId,
      configs,
    };

    this.setState(
      {
        gamepadConfig: newGamepadConfig,
        modified: true,
      },
      this.saveToStorage,
    );
  };

  listenForKey = (buttonInfo) => {
    const [player, buttonId] = buttonInfo;
    this.removeKeyListener();

    this.setState({
      button: buttonInfo,
      promptPlayer: player,
      currentPromptButton: buttonId,
    });

    // Listen to physical Gamepad inputs
    this.props.promptButton(this.handleGamepadButtonDown);

    // Listen to Keyboard inputs
    document.addEventListener("keydown", this.handleKeyDown);
  };

  handleGamepadButtonDown = (buttonInfo) => {
    this.removeKeyListener();

    const [playerId, buttonId] = this.state.button;
    const gamepadId = buttonInfo.gamepadId;
    const gamepadConfig = this.state.gamepadConfig;

    const playerGamepadId = gamepadConfig.playerGamepadId.slice(0);
    playerGamepadId[playerId - 1] = gamepadId;

    const rejectButtonId = (b) => b.buttonId !== buttonId;

    const newButton = {
      code: buttonInfo.code,
      type: buttonInfo.type,
      buttonId: buttonId,
      value: buttonInfo.value,
    };

    const existingButtons = (
      gamepadConfig.configs[gamepadId] || { buttons: [] }
    ).buttons.filter(rejectButtonId);

    const newConfigs = {
      ...gamepadConfig.configs,
      [gamepadId]: {
        buttons: [...existingButtons, newButton],
      },
    };

    const newGamepadConfig = {
      configs: newConfigs,
      playerGamepadId: playerGamepadId,
    };

    this.setState(
      {
        gamepadConfig: newGamepadConfig,
        currentPromptButton: -1,
        modified: true,
      },
      this.saveToStorage,
    );
  };

  handleClear = ([playerId, buttonId]) => {
    // 1. Remove from keyboard keys
    const newKeys = {};
    for (let k in this.state.keys) {
      if (
        this.state.keys[k][0] !== playerId ||
        this.state.keys[k][1] !== buttonId
      ) {
        newKeys[k] = this.state.keys[k];
      }
    }

    // 2. Remove from gamepad configs
    const playerGamepadId = [
      ...(this.state.gamepadConfig.playerGamepadId || [null, null]),
    ];
    const targetGpId = playerGamepadId[playerId - 1];
    let newConfigs = { ...this.state.gamepadConfig.configs };

    if (targetGpId && newConfigs[targetGpId]) {
      const remainingButtons = (newConfigs[targetGpId].buttons || []).filter(
        (b) => b.buttonId !== buttonId,
      );
      newConfigs = {
        ...newConfigs,
        [targetGpId]: {
          buttons: remainingButtons,
        },
      };
    }

    const newGamepadConfig = {
      ...this.state.gamepadConfig,
      configs: newConfigs,
    };

    this.setState(
      {
        keys: newKeys,
        gamepadConfig: newGamepadConfig,
        currentPromptButton: -1,
        button: undefined,
        modified: true,
      },
      this.saveToStorage,
    );
  };

  handleKeyDown = (event) => {
    this.removeKeyListener();

    if (!this.state.button) return;
    const [playerId, buttonId] = this.state.button;

    // Pressing Escape, Delete or Backspace clears / unassigns the button
    if (
      event.key === "Escape" ||
      event.key === "Delete" ||
      event.key === "Backspace"
    ) {
      this.handleClear([playerId, buttonId]);
      return;
    }

    const keys = this.state.keys;

    // Filter out existing mapping for this specific player button
    const newKeys = {};
    for (let k in keys) {
      if (keys[k][0] !== playerId || keys[k][1] !== buttonId) {
        newKeys[k] = keys[k];
      }
    }

    const keyLabel =
      event.key.length > 1 ? event.key : String(event.key).toUpperCase();

    const updatedKeys = {
      ...newKeys,
      [event.keyCode]: [playerId, buttonId, keyLabel],
    };

    this.setState(
      {
        keys: updatedKeys,
        button: undefined,
        currentPromptButton: -1,
        modified: true,
      },
      this.saveToStorage,
    );
  };

  removeKeyListener = () => {
    if (this.props.promptButton) {
      this.props.promptButton(null);
    }
    document.removeEventListener("keydown", this.handleKeyDown);
  };

  resetDefaultControls = () => {
    const defaultKeys = {
      88: [1, Controller.BUTTON_A, "X"],
      90: [1, Controller.BUTTON_B, "Z"],
      17: [1, Controller.BUTTON_SELECT, "Ctrl"],
      13: [1, Controller.BUTTON_START, "Enter"],
      38: [1, Controller.BUTTON_UP, "ArrowUp"],
      40: [1, Controller.BUTTON_DOWN, "ArrowDown"],
      37: [1, Controller.BUTTON_LEFT, "ArrowLeft"],
      39: [1, Controller.BUTTON_RIGHT, "ArrowRight"],
      65: [1, Controller.BUTTON_TURBO_A, "A"],
      83: [1, Controller.BUTTON_TURBO_B, "S"],
      103: [2, Controller.BUTTON_A, "Num-7"],
      105: [2, Controller.BUTTON_B, "Num-9"],
      99: [2, Controller.BUTTON_SELECT, "Num-3"],
      97: [2, Controller.BUTTON_START, "Num-1"],
      104: [2, Controller.BUTTON_UP, "Num-8"],
      98: [2, Controller.BUTTON_DOWN, "Num-2"],
      100: [2, Controller.BUTTON_LEFT, "Num-4"],
      102: [2, Controller.BUTTON_RIGHT, "Num-6"],
    };

    const defaultGamepadConfig = { playerGamepadId: [null, null], configs: {} };

    this.setState(
      {
        keys: defaultKeys,
        gamepadConfig: defaultGamepadConfig,
        modified: true,
      },
      this.saveToStorage,
    );
  };

  handleClose = () => {
    this.saveToStorage();
    this.props.toggle();
  };

  render() {
    if (!this.props.isOpen) return null;

    const { connectedGamepads, gamepadConfig } = this.state;
    const p1Device = gamepadConfig.playerGamepadId?.[0] || "keyboard";
    const p2Device = gamepadConfig.playerGamepadId?.[1] || "keyboard";

    const availableGamepads = [...connectedGamepads];
    [
      gamepadConfig.playerGamepadId?.[0],
      gamepadConfig.playerGamepadId?.[1],
    ].forEach((savedId) => {
      if (savedId && savedId !== "keyboard") {
        const matchesAny = availableGamepads.some(
          (gp) => savedId === `idx:${gp.index}|${gp.id}` || savedId === gp.id,
        );
        if (!matchesAny) {
          const rawId = savedId.includes("|") ? savedId.split("|")[1] : savedId;
          availableGamepads.push({
            index: -1,
            id: rawId,
            savedKey: savedId,
            isSaved: true,
          });
        }
      }
    });

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) this.handleClose();
        }}
      >
        <div className="bg-slate-900/95 border border-indigo-500/30 text-white rounded-2xl shadow-2xl glow-indigo max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] glass-panel">
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
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Configuration des contrôles
                </h2>
                <p className="text-xs text-slate-400">
                  Clavier & Manettes physiques USB / Bluetooth
                </p>
              </div>
            </div>
            <button
              onClick={this.handleClose}
              className="text-slate-400 hover:text-white text-2xl leading-none w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Fermer"
            >
              &times;
            </button>
          </div>

          {/* Gamepad Status Banner */}
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    connectedGamepads.length > 0
                      ? "bg-emerald-400 animate-pulse glow-cyan"
                      : "bg-amber-400"
                  }`}
                />
                <span className="text-xs font-semibold text-slate-300 truncate">
                  {connectedGamepads.length > 0
                    ? `${connectedGamepads.length} manette(s) active(s) et détectée(s)`
                    : "Aucune manette active détectée"}
                </span>
              </div>
              {connectedGamepads.length > 0 ? (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded shrink-0">
                  Connecté
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded shrink-0">
                  Action requise
                </span>
              )}
            </div>
            {connectedGamepads.length === 0 && (
              <div className="text-[11px] text-amber-300/90 leading-normal bg-amber-950/30 border border-amber-800/40 rounded-lg p-2.5 flex items-start space-x-2">
                <svg
                  className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <strong>Appuyez sur un bouton de votre manette !</strong> Les
                  navigateurs web (Chrome, Edge, Firefox) ne rendent les
                  manettes détectables{" "}
                  <u>
                    qu'après que vous ayez appuyé sur n'importe quel bouton de
                    la manette
                  </u>
                  .
                </div>
              </div>
            )}
          </div>

          {/* Player Device Selector Controls */}
          <div className="px-6 pt-4 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
              {/* Player 1 Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-indigo-400 flex items-center space-x-1.5">
                  <span>Joueur 1</span>
                </label>
                <select
                  value={p1Device}
                  onChange={(e) => this.handleDeviceChange(1, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="keyboard">Clavier</option>
                  {availableGamepads.map((gp, idx) => {
                    const optVal =
                      gp.savedKey ||
                      (gp.index >= 0 ? `idx:${gp.index}|${gp.id}` : gp.id);
                    return (
                      <option key={optVal + idx} value={optVal}>
                        {gp.index >= 0
                          ? `Manette #${gp.index + 1}`
                          : "Manette enregistrée"}{" "}
                        (
                        {gp.id.length > 25
                          ? gp.id.substring(0, 25) + "..."
                          : gp.id}
                        )
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Player 2 Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-400 flex items-center space-x-1.5">
                  <span>Joueur 2</span>
                </label>
                <select
                  value={p2Device}
                  onChange={(e) => this.handleDeviceChange(2, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  <option value="keyboard">Clavier</option>
                  {availableGamepads.map((gp, idx) => {
                    const optVal =
                      gp.savedKey ||
                      (gp.index >= 0 ? `idx:${gp.index}|${gp.id}` : gp.id);
                    return (
                      <option key={optVal + idx} value={optVal}>
                        {gp.index >= 0
                          ? `Manette #${gp.index + 1}`
                          : "Manette enregistrée"}{" "}
                        (
                        {gp.id.length > 25
                          ? gp.id.substring(0, 25) + "..."
                          : gp.id}
                        )
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Mapping Table */}
          <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-4 w-1/3">Touche / Bouton</th>
                  <th className="py-2.5 px-3 w-1/3 text-indigo-400">
                    Joueur 1 ({p1Device === "keyboard" ? "Clavier" : "Manette"})
                  </th>
                  <th className="py-2.5 px-3 w-1/3 text-purple-400">
                    Joueur 2 ({p2Device === "keyboard" ? "Clavier" : "Manette"})
                  </th>
                </tr>
              </thead>
              <tbody>
                <ControlMapperRow
                  buttonName="Haut (Up)"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_UP}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  handleClear={this.handleClear}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Bas (Down)"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_DOWN}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  handleClear={this.handleClear}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Gauche (Left)"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_LEFT}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  handleClear={this.handleClear}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Droite (Right)"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_RIGHT}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  handleClear={this.handleClear}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Bouton A"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_A}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  handleClear={this.handleClear}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Bouton B"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_B}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  handleClear={this.handleClear}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Turbo A"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_TURBO_A}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  handleClear={this.handleClear}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Turbo B"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_TURBO_B}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  handleClear={this.handleClear}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Start"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_START}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  handleClear={this.handleClear}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Select"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_SELECT}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  handleClear={this.handleClear}
                  gamepadConfig={this.state.gamepadConfig}
                />
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
            <button
              onClick={this.resetDefaultControls}
              className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
            >
              Réinitialiser les contrôles
            </button>
            <button
              onClick={this.handleClose}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-lg transition-all cursor-pointer glow-indigo"
            >
              Fermer & Enregistrer
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ControlsModal;
