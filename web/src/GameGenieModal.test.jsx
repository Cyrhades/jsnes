import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GameGenieModal from "./GameGenieModal.jsx";

describe("GameGenieModal", () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    codes: [
      {
        id: "1",
        code: "AAUNYLPA",
        description: "Freeze timer",
        active: true,
        decoded: { addr: 0x11d9, value: 0xad },
      },
    ],
    enabled: true,
    onToggleEnabled: vi.fn(),
    onAddCode: vi.fn(),
    onToggleCode: vi.fn(),
    onDeleteCode: vi.fn(),
    onClearAll: vi.fn(),
  };

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <GameGenieModal {...mockProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal header and code list when open", () => {
    render(<GameGenieModal {...mockProps} />);
    expect(
      screen.getByText("Codes de triche (Game Genie)"),
    ).toBeInTheDocument();
    expect(screen.getByText("AAUNYLPA")).toBeInTheDocument();
    expect(screen.getByText("Freeze timer")).toBeInTheDocument();
  });

  it("triggers onAddCode when form is submitted with valid code", () => {
    mockProps.onAddCode.mockReturnValue(true);
    render(<GameGenieModal {...mockProps} />);

    const inputCode = screen.getByPlaceholderText("ex: AAUNYLPA");
    const inputDesc = screen.getByPlaceholderText(
      "ex: Chrono gelé / Vies inf.",
    );
    const submitBtn = screen.getByText("+ Ajouter le code");

    fireEvent.change(inputCode, { target: { value: "XTKYOEZK" } });
    fireEvent.change(inputDesc, { target: { value: "More energy" } });
    fireEvent.click(submitBtn);

    expect(mockProps.onAddCode).toHaveBeenCalledWith("XTKYOEZK", "More energy");
  });
});
