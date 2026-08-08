import React, { Component } from "react";
import { Controller } from "jsnes";
import ControlMapperRow from "./ControlMapperRow";

class ControlsModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gamepadConfig: props.gamepadConfig || {},
      keys: props.keys || {},
      button: undefined,
      promptPlayer: 1,
      currentPromptButton: -1,
      connectedGamepads: [],
      modified: false,
    };

    this.state.gamepadConfig.playerGamepadId =
      this.state.gamepadConfig.playerGamepadId || [null, null];
    this.state.gamepadConfig.configs =
      this.state.gamepadConfig.configs || {};
  }

  componentDidMount() {
    this.detectGamepads();
    window.addEventListener("gamepadconnected", this.detectGamepads);
    window.addEventListener("gamepaddisconnected", this.detectGamepads);
    this.gamepadInterval = setInterval(this.detectGamepads, 1000);
  }

  componentWillUnmount() {
    if (this.state.modified) {
      this.props.setKeys(this.state.keys);
      this.props.setGamepadConfig(this.state.gamepadConfig);
    }
    window.removeEventListener("gamepadconnected", this.detectGamepads);
    window.removeEventListener("gamepaddisconnected", this.detectGamepads);
    if (this.gamepadInterval) clearInterval(this.gamepadInterval);
    this.removeKeyListener();
  }

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

    this.setState({
      gamepadConfig: {
        configs: newConfigs,
        playerGamepadId: playerGamepadId,
      },
      currentPromptButton: -1,
      modified: true,
    });
  };

  handleKeyDown = (event) => {
    this.removeKeyListener();

    const [playerId, buttonId] = this.state.button;
    const keys = this.state.keys;

    // Filter out existing mapping for this specific player button
    const newKeys = {};
    for (let k in keys) {
      if (keys[k][0] !== playerId || keys[k][1] !== buttonId) {
        newKeys[k] = keys[k];
      }
    }

    const keyLabel =
      event.key.length > 1
        ? event.key
        : String(event.key).toUpperCase();

    this.setState({
      keys: {
        ...newKeys,
        [event.keyCode]: [playerId, buttonId, keyLabel],
      },
      button: undefined,
      currentPromptButton: -1,
      modified: true,
    });
  };

  removeKeyListener = () => {
    this.props.promptButton(null);
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
    };

    this.setState({
      keys: defaultKeys,
      gamepadConfig: { playerGamepadId: [null, null], configs: {} },
      modified: true,
    });
  };

  render() {
    if (!this.props.isOpen) return null;

    const { connectedGamepads } = this.state;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) this.props.toggle();
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
              onClick={this.props.toggle}
              className="text-slate-400 hover:text-white text-2xl leading-none w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Fermer"
            >
              &times;
            </button>
          </div>

          {/* Gamepad Status Banner */}
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
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
                  ? `Manette détectée : ${connectedGamepads[0].id}`
                  : "Aucune manette physique détectée (Branchez votre manette et appuyez sur une touche)"}
              </span>
            </div>
            {connectedGamepads.length > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded shrink-0">
                Connecté
              </span>
            )}
          </div>

          {/* Mapping Table */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-4 w-1/3">Touche / Bouton</th>
                  <th className="py-2.5 px-3 w-1/3 text-indigo-400">
                    Joueur 1
                  </th>
                  <th className="py-2.5 px-3 w-1/3 text-purple-400">
                    Joueur 2
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
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Bas (Down)"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_DOWN}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Gauche (Left)"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_LEFT}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Droite (Right)"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_RIGHT}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Bouton A"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_A}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Bouton B"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_B}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Turbo A"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_TURBO_A}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Turbo B"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_TURBO_B}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Start"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_START}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
                  gamepadConfig={this.state.gamepadConfig}
                />
                <ControlMapperRow
                  buttonName="Select"
                  currentPromptButton={this.state.currentPromptButton}
                  promptPlayer={this.state.promptPlayer}
                  button={Controller.BUTTON_SELECT}
                  keys={this.state.keys}
                  handleClick={this.listenForKey}
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
              onClick={this.props.toggle}
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
