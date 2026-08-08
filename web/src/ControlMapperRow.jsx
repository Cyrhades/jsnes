import React, { Component } from "react";

class ControlMapperRow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playerOneButton: "",
      playerTwoButton: "",
      waitingForKey: 0,
    };
  }

  componentDidMount() {
    this.updateButtons(this.props);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.keys !== this.props.keys ||
      prevProps.gamepadConfig !== this.props.gamepadConfig ||
      prevProps.currentPromptButton !== this.props.currentPromptButton
    ) {
      this.updateButtons(this.props);
    }
  }

  updateButtons(props) {
    const { keys, button, gamepadConfig, currentPromptButton } = props;
    const playerButtons = ["", ""];

    // 1. Check Keyboard bindings
    for (let key in keys) {
      if (keys[key][0] === 1 && keys[key][1] === button) {
        const label = keys[key][2] || `Key ${key}`;
        playerButtons[0] =
          label.startsWith("[Touche]") ||
          label.startsWith("[Bouton]") ||
          label.startsWith("[Axe]")
            ? label
            : `[Touche] ${label}`;
      } else if (keys[key][0] === 2 && keys[key][1] === button) {
        const label = keys[key][2] || `Key ${key}`;
        playerButtons[1] =
          label.startsWith("[Touche]") ||
          label.startsWith("[Bouton]") ||
          label.startsWith("[Axe]")
            ? label
            : `[Touche] ${label}`;
      }
    }

    // 2. Check Gamepad bindings (override if mapped)
    if (gamepadConfig && gamepadConfig.playerGamepadId) {
      const { playerGamepadId, configs } = gamepadConfig;
      [0, 1].forEach((pIdx) => {
        const gpId = playerGamepadId[pIdx];
        if (gpId && configs && configs[gpId]) {
          const mappedBtn = configs[gpId].buttons.find(
            (b) => b.buttonId === button,
          );
          if (mappedBtn) {
            if (mappedBtn.type === "button") {
              playerButtons[pIdx] = `[Bouton] ${mappedBtn.code}`;
            } else if (mappedBtn.type === "axis") {
              playerButtons[pIdx] =
                `[Axe] ${mappedBtn.code} (${mappedBtn.value > 0 ? "+" : "-"})`;
            }
          }
        }
      });
    }

    let waitingForKey = 0;
    if (currentPromptButton === button) {
      waitingForKey = props.promptPlayer || 1;
    }

    this.setState({
      playerOneButton: playerButtons[0],
      playerTwoButton: playerButtons[1],
      waitingForKey,
    });
  }

  handleClick(player) {
    this.props.handleClick([player, this.props.button]);
    this.setState({ waitingForKey: player });
  }

  render() {
    const { buttonName, button, currentPromptButton, promptPlayer } =
      this.props;
    const isWaitingP1 = currentPromptButton === button && promptPlayer === 1;
    const isWaitingP2 = currentPromptButton === button && promptPlayer === 2;

    return (
      <tr className="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors">
        <td className="py-3 px-4 text-sm font-semibold text-slate-200">
          {buttonName}
        </td>

        {/* Player 1 Slot */}
        <td className="py-2 px-3">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => this.handleClick(1)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-medium border transition-all text-left flex items-center justify-between cursor-pointer ${
                isWaitingP1
                  ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 animate-pulse glow-indigo"
                  : this.state.playerOneButton
                    ? "bg-slate-900 border-slate-700 text-indigo-300 hover:border-indigo-500/60"
                    : "bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700"
              }`}
            >
              <span className="truncate">
                {isWaitingP1
                  ? "Appuyez une touche (Échap=vider)..."
                  : this.state.playerOneButton || "Non assigné"}
              </span>
              {isWaitingP1 && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
              )}
            </button>
            {this.state.playerOneButton &&
              !isWaitingP1 &&
              this.props.handleClear && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    this.props.handleClear([1, button]);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-xs text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/40 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Vider / Désassigner ce bouton"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
          </div>
        </td>

        {/* Player 2 Slot */}
        <td className="py-2 px-3">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => this.handleClick(2)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-medium border transition-all text-left flex items-center justify-between cursor-pointer ${
                isWaitingP2
                  ? "bg-purple-600/30 border-purple-400 text-purple-200 animate-pulse glow-purple"
                  : this.state.playerTwoButton
                    ? "bg-slate-900 border-slate-700 text-purple-300 hover:border-purple-500/60"
                    : "bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700"
              }`}
            >
              <span className="truncate">
                {isWaitingP2
                  ? "Appuyez une touche (Échap=vider)..."
                  : this.state.playerTwoButton || "Non assigné"}
              </span>
              {isWaitingP2 && (
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping shrink-0" />
              )}
            </button>
            {this.state.playerTwoButton &&
              !isWaitingP2 &&
              this.props.handleClear && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    this.props.handleClear([2, button]);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-xs text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/40 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Vider / Désassigner ce bouton"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
          </div>
        </td>
      </tr>
    );
  }
}

export default ControlMapperRow;
