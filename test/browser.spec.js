import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import Browser from "../src/browser/index.js";

describe("Browser focus/blur auto-pause", function () {
  let listeners = {};
  let originalWindow = globalThis.window;
  let originalDocument = globalThis.document;

  beforeEach(() => {
    listeners = { window: {}, document: {} };

    const dummyCanvas = {
      getContext: () => ({
        createImageData: () => ({ data: new Uint8ClampedArray(256 * 240 * 4) }),
        getImageData: () => ({ data: new Uint8ClampedArray(256 * 240 * 4) }),
        fillRect: () => {},
        putImageData: () => {},
      }),
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    globalThis.window = {
      addEventListener: (event, fn) => {
        listeners.window[event] = listeners.window[event] || [];
        listeners.window[event].push(fn);
      },
      removeEventListener: (event, fn) => {
        if (listeners.window[event]) {
          listeners.window[event] = listeners.window[event].filter(
            (f) => f !== fn,
          );
        }
      },
      requestAnimationFrame: () => 1,
      cancelAnimationFrame: () => {},
    };

    globalThis.document = {
      hidden: false,
      createElement: () => dummyCanvas,
      addEventListener: (event, fn) => {
        listeners.document[event] = listeners.document[event] || [];
        listeners.document[event].push(fn);
      },
      removeEventListener: (event, fn) => {
        if (listeners.document[event]) {
          listeners.document[event] = listeners.document[event].filter(
            (f) => f !== fn,
          );
        }
      },
    };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });

  const triggerEvent = (target, event) => {
    if (listeners[target] && listeners[target][event]) {
      for (const fn of listeners[target][event]) {
        fn();
      }
    }
  };

  const createDummyContainer = () => {
    const container = {
      clientWidth: 256,
      clientHeight: 240,
      appendChild: (child) => {
        child.parentNode = container;
      },
      removeChild: (child) => {
        child.parentNode = null;
      },
    };
    return container;
  };

  it("pauses on window blur and resumes on window focus", function () {
    const browser = new Browser({ container: createDummyContainer() });
    browser.start();
    assert.strictEqual(browser._frameTimer.running, true);

    // Window loses focus
    triggerEvent("window", "blur");
    assert.strictEqual(browser._frameTimer.running, false);
    assert.strictEqual(browser._pausedByBlur, true);

    // Window regains focus
    triggerEvent("window", "focus");
    assert.strictEqual(browser._frameTimer.running, true);
    assert.strictEqual(browser._pausedByBlur, false);

    browser.destroy();
  });

  it("pauses when document visibility becomes hidden and resumes when visible", function () {
    const browser = new Browser({ container: createDummyContainer() });
    browser.start();
    assert.strictEqual(browser._frameTimer.running, true);

    // Tab becomes hidden
    globalThis.document.hidden = true;
    triggerEvent("document", "visibilitychange");
    assert.strictEqual(browser._frameTimer.running, false);
    assert.strictEqual(browser._pausedByBlur, true);

    // Tab becomes visible
    globalThis.document.hidden = false;
    triggerEvent("document", "visibilitychange");
    assert.strictEqual(browser._frameTimer.running, true);
    assert.strictEqual(browser._pausedByBlur, false);

    browser.destroy();
  });

  it("does not auto-resume on focus if game was manually stopped", function () {
    const browser = new Browser({ container: createDummyContainer() });
    browser.start();

    // Blur occurs
    triggerEvent("window", "blur");
    assert.strictEqual(browser._frameTimer.running, false);

    // User explicitly calls stop while blurred
    browser.stop();
    assert.strictEqual(browser._pausedByBlur, false);

    // Focus returns
    triggerEvent("window", "focus");
    assert.strictEqual(browser._frameTimer.running, false);

    browser.destroy();
  });

  it("removes event listeners on destroy", function () {
    const browser = new Browser({ container: createDummyContainer() });
    assert.strictEqual(listeners.window.blur.length, 1);
    assert.strictEqual(listeners.window.focus.length, 1);
    assert.strictEqual(listeners.document.visibilitychange.length, 1);

    browser.destroy();
    assert.strictEqual(listeners.window.blur.length, 0);
    assert.strictEqual(listeners.window.focus.length, 0);
    assert.strictEqual(listeners.document.visibilitychange.length, 0);
  });
});
