import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import VideoSettingsModal from "./VideoSettingsModal";

describe("VideoSettingsModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    luminance: 100,
    saturation: 100,
    gamma: 1.0,
    crtFilter: false,
    unlimitedSprites: true,
    onChangeLuminance: vi.fn(),
    onChangeSaturation: vi.fn(),
    onChangeGamma: vi.fn(),
    onToggleCrtFilter: vi.fn(),
    onToggleUnlimitedSprites: vi.fn(),
    onReset: vi.fn(),
  };

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <VideoSettingsModal {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal with controls when isOpen is true", () => {
    render(<VideoSettingsModal {...defaultProps} />);
    expect(screen.getByText("Réglages vidéo")).toBeDefined();
    expect(screen.getByText("Luminance")).toBeDefined();
    expect(screen.getByText("Saturation")).toBeDefined();
    expect(screen.getByText("Gamma")).toBeDefined();
    expect(screen.getByText("Filtre CRT")).toBeDefined();
    expect(screen.getByText("Anti-clignotement")).toBeDefined();
    expect(screen.getAllByText("100%").length).toBe(2);
    expect(screen.getByText("1.00")).toBeDefined();
  });

  it("triggers onChange callbacks on slider input", () => {
    render(<VideoSettingsModal {...defaultProps} />);
    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBe(3);

    // Luminance slider
    fireEvent.change(sliders[0], { target: { value: "120" } });
    expect(defaultProps.onChangeLuminance).toHaveBeenCalledWith(120);

    // Saturation slider
    fireEvent.change(sliders[1], { target: { value: "80" } });
    expect(defaultProps.onChangeSaturation).toHaveBeenCalledWith(80);

    // Gamma slider
    fireEvent.change(sliders[2], { target: { value: "1.25" } });
    expect(defaultProps.onChangeGamma).toHaveBeenCalledWith(1.25);
  });

  it("triggers CRT, unlimitedSprites toggle and reset callbacks", () => {
    render(
      <VideoSettingsModal
        {...defaultProps}
        crtFilter={true}
        unlimitedSprites={true}
      />,
    );
    const toggleButtons = screen.getAllByText("ACTIVÉ");
    expect(toggleButtons.length).toBe(2);

    fireEvent.click(toggleButtons[0]);
    expect(defaultProps.onToggleCrtFilter).toHaveBeenCalled();

    fireEvent.click(toggleButtons[1]);
    expect(defaultProps.onToggleUnlimitedSprites).toHaveBeenCalled();

    const resetBtn = screen.getByText("Réinitialiser");
    fireEvent.click(resetBtn);
    expect(defaultProps.onReset).toHaveBeenCalled();
  });
});
