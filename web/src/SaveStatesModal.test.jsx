import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import SaveStatesModal from "./SaveStatesModal";

describe("SaveStatesModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    romName: "Super Mario Bros",
    slots: [
      {
        slot: 1,
        timestamp: 1700000000000,
        screenshot: "data:image/png;base64,foo",
        state: {},
      },
    ],
    onSaveSlot: vi.fn(),
    onLoadSlot: vi.fn(),
    onDeleteSlot: vi.fn(),
  };

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <SaveStatesModal {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal with save state slots when isOpen is true", () => {
    render(<SaveStatesModal {...defaultProps} />);
    expect(screen.getByText("Sauvegardes d'état (Save States)")).toBeDefined();
    expect(screen.getByText("Super Mario Bros")).toBeDefined();
    expect(screen.getByText("Emplacement 1")).toBeDefined();
    expect(screen.getByText("Emplacement 2")).toBeDefined();
    expect(screen.getByText("Emplacement 3")).toBeDefined();
    expect(screen.getByText("Charger")).toBeDefined();
  });

  it("triggers save, load, and delete callbacks", () => {
    render(<SaveStatesModal {...defaultProps} />);

    // Load slot 1
    fireEvent.click(screen.getByText("Charger"));
    expect(defaultProps.onLoadSlot).toHaveBeenCalledWith(1);

    // Overwrite slot 1
    fireEvent.click(screen.getByText("Écraser"));
    expect(defaultProps.onSaveSlot).toHaveBeenCalledWith(1);

    // Save slot 2 (empty slot)
    const saveButtons = screen.getAllByText("Sauvegarder");
    fireEvent.click(saveButtons[0]);
    expect(defaultProps.onSaveSlot).toHaveBeenCalledWith(2);

    // Delete slot 1
    const deleteBtn = screen.getByTitle("Supprimer la sauvegarde");
    fireEvent.click(deleteBtn);
    expect(defaultProps.onDeleteSlot).toHaveBeenCalledWith(1);
  });
});
