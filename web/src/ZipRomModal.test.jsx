import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import ZipRomModal from "./ZipRomModal";

describe("ZipRomModal", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ZipRomModal
        isOpen={false}
        zipName="test.zip"
        roms={[{ name: "Mario.nes", data: new Uint8Array([1, 2, 3]) }]}
        onSelectRom={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders ROM list when isOpen is true", () => {
    const roms = [
      { name: "Mario.nes", data: new Uint8Array([1, 2, 3]) },
      { name: "Zelda.nes", data: new Uint8Array([4, 5, 6]) },
    ];
    render(
      <ZipRomModal
        isOpen={true}
        zipName="Games.zip"
        roms={roms}
        onSelectRom={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Games.zip")).toBeDefined();
    expect(screen.getByText("Mario.nes")).toBeDefined();
    expect(screen.getByText("Zelda.nes")).toBeDefined();
  });

  it("triggers onSelectRom callback when a ROM entry is clicked", () => {
    const onSelect = vi.fn();
    const roms = [{ name: "Mario.nes", data: new Uint8Array([1, 2, 3]) }];

    render(
      <ZipRomModal
        isOpen={true}
        zipName="Games.zip"
        roms={roms}
        onSelectRom={onSelect}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Mario.nes"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(roms[0]);
  });
});
