/**
 * ThemeSelector Component Tests
 *
 * Unit tests for the ThemeSelector component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeSelector } from "./ThemeSelector";
import { THEME_NAMES, THEME_METADATA } from "@/lib/biopage-themes";

describe("ThemeSelector", () => {
  it("renders all theme options", () => {
    const mockOnChange = jest.fn();
    render(<ThemeSelector value="minimal" onChange={mockOnChange} />);

    // Check that all themes are rendered
    THEME_NAMES.forEach((themeName) => {
      const metadata = THEME_METADATA[themeName];
      expect(screen.getByText(metadata.label)).toBeInTheDocument();
    });
  });

  it("highlights the selected theme", () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <ThemeSelector value="dark" onChange={mockOnChange} />
    );

    // The selected theme should have the Check icon
    const checkIcons = container.querySelectorAll('svg[class*="lucide-check"]');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it("calls onChange when a theme is clicked", () => {
    const mockOnChange = jest.fn();
    render(<ThemeSelector value="minimal" onChange={mockOnChange} />);

    // Click on the Dark theme
    const darkThemeButton = screen.getByText("Dark").closest("button");
    if (darkThemeButton) {
      fireEvent.click(darkThemeButton);
      expect(mockOnChange).toHaveBeenCalledWith("dark");
    }
  });

  it("displays theme descriptions", () => {
    const mockOnChange = jest.fn();
    render(<ThemeSelector value="minimal" onChange={mockOnChange} />);

    // Check that descriptions are rendered
    THEME_NAMES.forEach((themeName) => {
      const metadata = THEME_METADATA[themeName];
      expect(screen.getByText(metadata.description)).toBeInTheDocument();
    });
  });

  it("renders with correct grid layout classes", () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <ThemeSelector value="minimal" onChange={mockOnChange} />
    );

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("grid-cols-2", "md:grid-cols-3");
  });

  it("shows sample button in theme preview", () => {
    const mockOnChange = jest.fn();
    render(<ThemeSelector value="minimal" onChange={mockOnChange} />);

    const sampleButtons = screen.getAllByText("Sample Button");
    expect(sampleButtons.length).toBe(THEME_NAMES.length);
  });

  it("handles theme change correctly", () => {
    const mockOnChange = jest.fn();
    const { rerender } = render(
      <ThemeSelector value="minimal" onChange={mockOnChange} />
    );

    // Click on ocean theme
    const oceanButton = screen.getByText("Neon").closest("button");
    if (oceanButton) {
      fireEvent.click(oceanButton);
      expect(mockOnChange).toHaveBeenCalledWith("neon");
    }

    // Simulate parent component updating the value
    rerender(<ThemeSelector value="neon" onChange={mockOnChange} />);

    // The new theme should now be selected
    const checkIcons = screen.getByText("Neon")
      .closest("button")
      ?.querySelector('svg[class*="lucide-check"]');
    expect(checkIcons).toBeTruthy();
  });
});
