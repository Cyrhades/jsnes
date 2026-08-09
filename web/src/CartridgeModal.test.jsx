import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import CartridgeModal from "./CartridgeModal";

describe("CartridgeModal", () => {
  const sampleHeader = new Uint8Array([
    0x4e, 0x45, 0x53, 0x1a, 0x08, 0x10, 0x00, 0x48, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x01,
  ]);

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    romData: sampleHeader,
    romName: "Shinobi (USA) (Unl)",
  };

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <CartridgeModal {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders cartridge hardware information and header hex dump", async () => {
    render(<CartridgeModal {...defaultProps} />);
    expect(screen.getByText("Informations Cartouche")).toBeDefined();

    await waitFor(() => {
      expect(
        screen.getAllByText((content) =>
          content.includes("Shinobi (USA) (Unl)"),
        ).length,
      ).toBeGreaterThan(0);
    });

    expect(
      screen.getAllByText((content) => content.includes("4e 45 53 1a 08 10"))
        .length,
    ).toBeGreaterThan(0);
  });
});
