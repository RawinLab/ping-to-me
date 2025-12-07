/**
 * BackgroundPicker Component Tests
 *
 * Unit tests for the BackgroundPicker component
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BackgroundPicker } from "./BackgroundPicker";
import userEvent from "@testing-library/user-event";

describe("BackgroundPicker", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe("Tabs Navigation", () => {
    it("renders all three tabs", () => {
      render(
        <BackgroundPicker
          backgroundType="solid"
          backgroundColor="#ffffff"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole("tab", { name: /solid/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /gradient/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /image/i })).toBeInTheDocument();
    });

    it("shows solid tab content by default when backgroundType is solid", () => {
      render(
        <BackgroundPicker
          backgroundType="solid"
          backgroundColor="#ffffff"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Background Color")).toBeInTheDocument();
    });

    it("switches to gradient tab when clicked", async () => {
      render(
        <BackgroundPicker
          backgroundType="solid"
          backgroundColor="#ffffff"
          onChange={mockOnChange}
        />
      );

      const gradientTab = screen.getByRole("tab", { name: /gradient/i });
      fireEvent.click(gradientTab);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            backgroundType: "gradient",
          })
        );
      });
    });

    it("switches to image tab when clicked", async () => {
      render(
        <BackgroundPicker
          backgroundType="solid"
          backgroundColor="#ffffff"
          onChange={mockOnChange}
        />
      );

      const imageTab = screen.getByRole("tab", { name: /image/i });
      fireEvent.click(imageTab);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            backgroundType: "image",
          })
        );
      });
    });
  });

  describe("Solid Mode", () => {
    it("displays color picker for background color", () => {
      render(
        <BackgroundPicker
          backgroundType="solid"
          backgroundColor="#3B82F6"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Background Color")).toBeInTheDocument();
    });

    it("shows preview of solid color", () => {
      const { container } = render(
        <BackgroundPicker
          backgroundType="solid"
          backgroundColor="#FF5733"
          onChange={mockOnChange}
        />
      );

      const preview = container.querySelector(".h-32");
      expect(preview).toHaveStyle({ backgroundColor: "#FF5733" });
    });
  });

  describe("Gradient Mode", () => {
    it("displays two color pickers for gradient", () => {
      render(
        <BackgroundPicker
          backgroundType="gradient"
          backgroundColor="#ffffff"
          backgroundGradient="linear-gradient(to bottom, #667eea, #764ba2)"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Start Color")).toBeInTheDocument();
      expect(screen.getByText("End Color")).toBeInTheDocument();
    });

    it("displays direction selector", () => {
      render(
        <BackgroundPicker
          backgroundType="gradient"
          backgroundColor="#ffffff"
          backgroundGradient="linear-gradient(to bottom, #667eea, #764ba2)"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Direction")).toBeInTheDocument();
    });

    it("parses gradient string correctly", () => {
      const { container } = render(
        <BackgroundPicker
          backgroundType="gradient"
          backgroundColor="#ffffff"
          backgroundGradient="linear-gradient(to right, #FF0000, #00FF00)"
          onChange={mockOnChange}
        />
      );

      const preview = container.querySelector(".h-32");
      expect(preview).toHaveStyle({
        background: "linear-gradient(to right, #FF0000, #00FF00)",
      });
    });

    it("uses default gradient if none provided", () => {
      const { container } = render(
        <BackgroundPicker
          backgroundType="gradient"
          backgroundColor="#ffffff"
          onChange={mockOnChange}
        />
      );

      const preview = container.querySelector(".h-32");
      expect(preview).toHaveStyle({
        background: "linear-gradient(to bottom, #667eea, #764ba2)",
      });
    });
  });

  describe("Image Mode", () => {
    it("displays image URL input", () => {
      render(
        <BackgroundPicker
          backgroundType="image"
          backgroundColor="#ffffff"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText(/image url/i)).toBeInTheDocument();
    });

    it("displays opacity slider", () => {
      render(
        <BackgroundPicker
          backgroundType="image"
          backgroundColor="#ffffff"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText(/overlay opacity/i)).toBeInTheDocument();
    });

    it("shows placeholder when no image URL", () => {
      render(
        <BackgroundPicker
          backgroundType="image"
          backgroundColor="#ffffff"
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText(/enter an image url to see preview/i)
      ).toBeInTheDocument();
    });

    it("calls onChange when image URL changes", async () => {
      render(
        <BackgroundPicker
          backgroundType="image"
          backgroundColor="#ffffff"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/image url/i) as HTMLInputElement;
      fireEvent.change(input, {
        target: { value: "https://example.com/image.jpg" },
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            backgroundType: "image",
            backgroundImage: "https://example.com/image.jpg",
          })
        );
      });
    });

    it("displays image preview when URL is provided", () => {
      const imageUrl = "https://example.com/test.jpg";
      const { container } = render(
        <BackgroundPicker
          backgroundType="image"
          backgroundColor="#ffffff"
          backgroundImage={imageUrl}
          onChange={mockOnChange}
        />
      );

      const preview = container.querySelector(".bg-cover");
      expect(preview).toHaveStyle({
        backgroundImage: `url(${imageUrl})`,
      });
    });
  });

  describe("Gradient Helper Functions", () => {
    it("handles vertical gradient direction", () => {
      const { container } = render(
        <BackgroundPicker
          backgroundType="gradient"
          backgroundColor="#ffffff"
          backgroundGradient="linear-gradient(to bottom, #667eea, #764ba2)"
          onChange={mockOnChange}
        />
      );

      const preview = container.querySelector(".h-32");
      expect(preview).toHaveStyle({
        background: "linear-gradient(to bottom, #667eea, #764ba2)",
      });
    });

    it("handles horizontal gradient direction", () => {
      const { container } = render(
        <BackgroundPicker
          backgroundType="gradient"
          backgroundColor="#ffffff"
          backgroundGradient="linear-gradient(to right, #667eea, #764ba2)"
          onChange={mockOnChange}
        />
      );

      const preview = container.querySelector(".h-32");
      expect(preview).toHaveStyle({
        background: "linear-gradient(to right, #667eea, #764ba2)",
      });
    });

    it("handles diagonal gradient direction", () => {
      const { container } = render(
        <BackgroundPicker
          backgroundType="gradient"
          backgroundColor="#ffffff"
          backgroundGradient="linear-gradient(to bottom right, #667eea, #764ba2)"
          onChange={mockOnChange}
        />
      );

      const preview = container.querySelector(".h-32");
      expect(preview).toHaveStyle({
        background: "linear-gradient(to bottom right, #667eea, #764ba2)",
      });
    });
  });

  describe("Props Integration", () => {
    it("passes all props correctly to onChange", () => {
      const { rerender } = render(
        <BackgroundPicker
          backgroundType="solid"
          backgroundColor="#FF0000"
          backgroundGradient="linear-gradient(to bottom, #667eea, #764ba2)"
          backgroundImage="https://example.com/image.jpg"
          onChange={mockOnChange}
        />
      );

      // Should maintain other props when changing type
      const gradientTab = screen.getByRole("tab", { name: /gradient/i });
      fireEvent.click(gradientTab);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundType: "gradient",
          backgroundColor: "#FF0000",
          backgroundGradient: "linear-gradient(to bottom, #667eea, #764ba2)",
          backgroundImage: "https://example.com/image.jpg",
        })
      );
    });
  });

  describe("Preview Sections", () => {
    it("shows preview label for all modes", () => {
      const { rerender } = render(
        <BackgroundPicker
          backgroundType="solid"
          backgroundColor="#ffffff"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Preview")).toBeInTheDocument();

      rerender(
        <BackgroundPicker
          backgroundType="gradient"
          backgroundColor="#ffffff"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Preview")).toBeInTheDocument();

      rerender(
        <BackgroundPicker
          backgroundType="image"
          backgroundColor="#ffffff"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Preview")).toBeInTheDocument();
    });
  });
});
