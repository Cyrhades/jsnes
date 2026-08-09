# JSNES (Fork by Cyrhades)

A modern JavaScript NES (Nintendo Entertainment System) emulator library and web interface.

This project is a fork based on the original work by Ben Firshman: [bfirsh/jsnes](https://github.com/bfirsh/jsnes).

---

## Emulation improvements

|                       Index (Original)                       |                         Index (Fork)                          |
| :----------------------------------------------------------: | :-----------------------------------------------------------: |
|     ![index original](./images/index_jsnes_original.jpg)     |     ![index fork](./images/index_jsnes_cyrhades_fork.png)     |
|                    Gremlins 2 (Original)                     |                       Gremlins 2 (Fork)                       |
| ![gremlins2 original](./images/gremlins2_jsnes_original.jpg) | ![gremlins2 fork](./images/gremlins2_jsnes_cyrhades_fork.png) |
|                     Tiny Toon (Original)                     |                       Tiny Toon (Fork)                        |
| ![tinytoons original](./images/tinytoons_jsnes_original.jpg) |  ![tinytoon fork](./images/tinytoon_jsnes_cyrhades_fork.png)  |
|                     Turtles 2 (Original)                     |                       Turtles 2 (Fork)                        |
|  ![turtles2 original](./images/turtles2_jsnes_original.jpg)  |  ![turtles2 fork](./images/turtles2_jsnes_cyrhades_fork.png)  |

---

## Features and Improvements

This fork introduces significant technical enhancements, new mapper support, audio timing fixes, and a completely redesigned web user interface:

### 1. Hardware Mapper Support

- **iNES Mapper 24 & 26 (Konami VRC6a / VRC6b)**: Full implementation of Konami's VRC6 ASIC mapper with 16KB + 8KB PRG ROM switching, 8 x 1KB CHR ROM switching, customizable mirroring, and scanline/cycle IRQ counters. Enables games such as _Akumajou Densetsu_ (_Castlevania III_ JP), _Akumajou Special: Boku Dracula-kun_ (_Kid Dracula_), _Madara_, and _Esper Dream 2_.
- **iNES Mapper 64 (RAMBO-1)**: Full implementation of Tengen's RAMBO-1 mapper (extension of MMC3 with 1KB CHR mode, PRG mode, extra registers R8, R9, R15, and scanline/CPU cycle IRQ counters). Enables games such as _Klax_, _Skull & Crossbones_, _Shinobi_, _Rolling Thunder_, and _Indiana Jones and the Temple of Doom_.

### 2. Audio Synchronization and Frame Timing Fix

- Fixed an audio buffer underrun bug where extra frame generation was erroneously triggered during active tab execution, causing 2x/3x speedup and stutter.
- Frame timer refactored to accumulate delta time with a maximum catch-up threshold, ensuring smooth 60 FPS playback and crisp audio.

### 3. ZIP Archive ROM Loading

- **In-Memory Decompression**: Uses `fflate` for zero-dependency parsing of `.zip` files.
- Automatically handles both single-ROM and multi-ROM ZIP archives.

### 4. Dynamic Title Screen Preview Generator

- **Headless Execution**: Runs the emulator for ~60 frames (~20ms) to capture a 256x240 ARGB pixel buffer of the game title screen.
- **Smart Monochrome Detection**: Detects black or uniform screens (such as copyright or intro splash screens in games like _Bionic Commando_) and automatically advances up to 300 frames (5 seconds) to capture the actual title screen.
- **Persistent Caching**: Uses a multi-tier RAM and `localStorage` cache for instant preview display.

### 5. Physical Gamepad and Controls Management

- **Live Gamepad Detection**: Queries `navigator.getGamepads()` in real-time with status indicators for connected USB and Bluetooth controllers (Xbox, PlayStation, 8BitDo, generic USB).
- **Hybrid Input Remapping**: Remap buttons using either keyboard keys or physical controller buttons and analog axes.
- **Reset Option**: One-click restoration of default control bindings.

### 6. Video Settings & Anti-Flicker (Unlimited Sprites)

- **Real-Time Video Adjustments**: Live configuration popup for **Luminance**, **Saturation**, and **Gamma** via SVG component transfer filters.
- **Anti-clignotement (Unlimited Sprites)**: Removes the NES hardware 8-sprites-per-scanline limit to prevent sprite flickering and disappearing sprites when multiple sprites align horizontally.
- **Non-Overlay Live Preview**: Floating settings popup positioned to display real-time video modifications with automatic pause on open.

### 7. Multi-Slot Save States System

- **IndexedDB & LocalStorage Snapshotting**: Full state serialization (`toJSON` / `fromJSON`) across 3 save slots, storing exact CPU, PPU, APU, and mapper states alongside timestamps and instant screenshot previews.
- **Universal Keyboard Shortcuts**:
  - **Save**: `Ctrl + S` (Quick Save Slot 1) or `Ctrl + 1..3` (AZERTY `&`, `é`, `"`, Numpad `1..3`).
  - **Load**: `Ctrl + Alt + L` / `Ctrl + Shift + L` (Quick Load Slot 1) or `Ctrl + Alt + 1..3` / `Ctrl + Shift + 1..3` (AZERTY `&`, `é`, `"`, Numpad `1..3`).
- **Auto-Pause & Resume**: Emulation automatically pauses when the Save States modal opens and resumes playback instantly upon loading a state.

### 8. Cartridge Hardware Inspector

- **ROM & Hardware Info Modal**: Displays SHA-256 hash, title/game name, target region (NTSC-J, NTSC-U, PAL), system type (Regular / NES 2.0), board/mapper specifications (e.g. TENGEN-800032, RAMBO-1, VRC6), and PRG-ROM / CHR-ROM memory bank sizes.

### 9. Console Hardware Reset & ROM Reload

- **NES Reset Button**: One-click **Recharger la ROM** menu option simulating the physical NES console hardware reset button, re-initializing CPU, PPU, APU, and mapper registers from the ROM binary buffer.

### 10. In-Browser Video & Audio Recording

- **Canvas & Web Audio MediaRecorder**: Captures 60 FPS video from the NES canvas (`captureStream(60)`) merged with real-time Web Audio API sound (`AudioWorkletNode -> MediaStreamDestination`).
- **Live On-Screen REC Indicator**: Glassmorphic `REC 🔴 00:15` overlay with live pulsing indicator and recording timer.
- **Automatic Export**: One-click stop automatically generates and downloads a `.webm` video file.

### 11. Game Genie Cheat Codes System

- **Game Genie & Hex Patch Decoding**: Intercepts NES CPU ROM reads in real-time to substitute memory values based on standard 6-letter (e.g. `AAUNYLPA`) and 8-letter (e.g. `AEUTLZZA`) Game Genie codes or raw Hex memory patches (`$ADDR:$VAL`).
- **Interactive Cheat Manager**: Modal dialog to add, label, toggle (ON/OFF), and delete cheat codes in real-time.
- **Per-Game Storage**: Active cheat codes are automatically saved to `localStorage` per game title and restored on game launch.

### 12. Modern Web UI & Navigation

- Dark-mode arcade aesthetic with glassmorphism panels, glow effects, and custom scrollbars.
- **CRT Scanlines Overlay**: Toggle vintage TV scanlines overlay filter.
- **PNG Screenshot Capture**: Download instant 256x240 PNG screenshots during gameplay.
- **ZIP Pack Library**: Multi-ROM ZIP files can be saved to "Ma bibliothèque locale" as ZIP Packs and re-opened at any time.
- **Non-blocking Modal Rendering**: Progressive background thumbnail queue for instant popup opening without UI freezing.
- **Clean Menu Navigation**: Organized menu sections with **Quitter** navigation link to exit back to the ROM Library.

---

## Installation

> git clone https://github.com/Cyrhades/jsnes

> cd jsnes/web

> npm install

> npm run dev

---

## Repository and Fork Metadata

- **Original Project**: [https://github.com/bfirsh/jsnes](https://github.com/bfirsh/jsnes) by Ben Firshman
- **Fork Repository**: [https://github.com/Cyrhades/jsnes](https://github.com/Cyrhades/jsnes)
- **Maintainer**: LECOMTE Cyril (<cyrhades76@gmail.com>)

---

## License

Licensed under the Apache License, Version 2.0. See `LICENSE` for details.
