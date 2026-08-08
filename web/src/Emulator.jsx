import React, { Component } from "react";
import PropTypes from "prop-types";
import { Browser } from "jsnes";

/*
 * Thin React wrapper around jsnes.Browser.
 *
 * Delegates all canvas rendering, audio, keyboard, gamepad, and frame timing
 * to the Browser class. This component just manages the React lifecycle.
 */
class Emulator extends Component {
  render() {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        ref={(el) => {
          this.container = el;
        }}
      />
    );
  }

  componentDidMount() {
    try {
      this.browser = new Browser({
        container: this.container,
        romData: this.props.romData,
        onError: this.props.onError,
      });
      if (
        this.props.unlimitedSprites !== undefined &&
        this.browser.nes &&
        this.browser.nes.ppu
      ) {
        this.browser.nes.ppu.removeSpriteLimit = this.props.unlimitedSprites;
      }
    } catch (e) {
      if (this.props.onError) {
        this.props.onError(e);
      }
    }
  }

  componentWillUnmount() {
    if (this.browser) {
      this.browser.destroy();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.paused !== prevProps.paused) {
      if (this.props.paused) {
        this.browser.stop();
      } else {
        this.browser.start();
      }
    }
    if (
      this.props.unlimitedSprites !== prevProps.unlimitedSprites &&
      this.browser &&
      this.browser.nes &&
      this.browser.nes.ppu
    ) {
      this.browser.nes.ppu.removeSpriteLimit = this.props.unlimitedSprites;
    }
  }

  // Expose sub-components for RunPage/ControlsModal access
  get keyboardController() {
    return this.browser.keyboard;
  }

  get gamepadController() {
    return this.browser.gamepad;
  }

  fitInParent() {
    if (this.browser) {
      this.browser.fitInParent();
    }
  }

  screenshot() {
    return this.browser ? this.browser.screenshot() : null;
  }
}

Emulator.propTypes = {
  paused: PropTypes.bool,
  romData: PropTypes.string.isRequired,
};

export default Emulator;
