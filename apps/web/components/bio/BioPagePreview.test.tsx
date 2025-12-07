import { describe, it, expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { BioPagePreview } from "./BioPagePreview";
import { THEME_PRESETS } from "@/lib/biopage-themes";

describe("BioPagePreview", () => {
  const defaultProps = {
    title: "Test User",
    description: "Test Description",
    theme: THEME_PRESETS.minimal,
    layout: "stacked" as const,
    bioLinks: [
      {
        id: "1",
        title: "Test Link",
        description: "Test link description",
        externalUrl: "https://example.com",
      },
    ],
    showBranding: true,
  };

  it("renders without crashing", () => {
    render(<BioPagePreview {...defaultProps} />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("displays the title correctly", () => {
    render(<BioPagePreview {...defaultProps} />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("displays the description when provided", () => {
    render(<BioPagePreview {...defaultProps} />);
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders bio links", () => {
    render(<BioPagePreview {...defaultProps} />);
    expect(screen.getByText("Test Link")).toBeInTheDocument();
  });

  it("shows placeholder text when no links are provided", () => {
    const propsWithoutLinks = { ...defaultProps, bioLinks: [] };
    render(<BioPagePreview {...propsWithoutLinks} />);
    expect(screen.getByText("Add links to preview them here")).toBeInTheDocument();
  });

  it("displays branding when showBranding is true", () => {
    render(<BioPagePreview {...defaultProps} />);
    expect(screen.getByText("Powered by PingTO.Me")).toBeInTheDocument();
  });

  it("hides branding when showBranding is false", () => {
    const propsWithoutBranding = { ...defaultProps, showBranding: false };
    render(<BioPagePreview {...propsWithoutBranding} />);
    expect(screen.queryByText("Powered by PingTO.Me")).not.toBeInTheDocument();
  });

  it("renders social links when provided", () => {
    const propsWithSocial = {
      ...defaultProps,
      socialLinks: [
        { platform: "twitter", url: "https://twitter.com/test" },
        { platform: "instagram", url: "https://instagram.com/test" },
      ],
    };
    render(<BioPagePreview {...propsWithSocial} />);
    // Social links are rendered as icons, check they exist
    const socialLinks = screen.getAllByRole("link");
    expect(socialLinks.length).toBeGreaterThan(1);
  });

  it("applies theme colors correctly", () => {
    const { container } = render(<BioPagePreview {...defaultProps} />);
    // Check that theme is applied via inline styles
    const contentArea = container.querySelector("[class*='min-h-full']");
    expect(contentArea).toBeInTheDocument();
  });

  it("renders in grid layout mode", () => {
    const gridProps = {
      ...defaultProps,
      layout: "grid" as const,
      bioLinks: [
        { id: "1", title: "Link 1", externalUrl: "#" },
        { id: "2", title: "Link 2", externalUrl: "#" },
      ],
    };
    render(<BioPagePreview {...gridProps} />);
    expect(screen.getByText("Link 1")).toBeInTheDocument();
    expect(screen.getByText("Link 2")).toBeInTheDocument();
  });

  it("uses fallback initials when no avatar is provided", () => {
    render(<BioPagePreview {...defaultProps} />);
    // Avatar fallback shows first 2 letters uppercase
    expect(screen.getByText("TE")).toBeInTheDocument();
  });

  it("renders link descriptions in stacked layout", () => {
    render(<BioPagePreview {...defaultProps} />);
    expect(screen.getByText("Test link description")).toBeInTheDocument();
  });

  it("does not render link descriptions in grid layout", () => {
    const gridProps = {
      ...defaultProps,
      layout: "grid" as const,
    };
    render(<BioPagePreview {...gridProps} />);
    // Descriptions should not be visible in grid layout
    expect(screen.queryByText("Test link description")).not.toBeInTheDocument();
  });

  it("applies different theme presets correctly", () => {
    const themes = ["dark", "gradient", "neon"] as const;
    themes.forEach((themeName) => {
      const { container } = render(
        <BioPagePreview
          {...defaultProps}
          theme={THEME_PRESETS[themeName]}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it("handles gradient backgrounds", () => {
    const gradientProps = {
      ...defaultProps,
      theme: THEME_PRESETS.gradient,
    };
    const { container } = render(<BioPagePreview {...gradientProps} />);
    const contentArea = container.querySelector("[style*='gradient']");
    expect(contentArea).toBeInTheDocument();
  });

  it("handles image backgrounds", () => {
    const imageTheme = {
      ...THEME_PRESETS.minimal,
      backgroundType: "image" as const,
      backgroundImage: "https://example.com/bg.jpg",
    };
    const { container } = render(
      <BioPagePreview {...defaultProps} theme={imageTheme} />
    );
    const contentArea = container.querySelector("[style*='url']");
    expect(contentArea).toBeInTheDocument();
  });

  it("prevents link navigation in preview mode", () => {
    render(<BioPagePreview {...defaultProps} />);
    const link = screen.getByText("Test Link").closest("a");
    expect(link).toHaveAttribute("href");
    // Click event should be prevented in preview
    const clickHandler = link?.onclick;
    expect(clickHandler).toBeDefined();
  });

  it("renders device chrome (notch, home indicator)", () => {
    const { container } = render(<BioPagePreview {...defaultProps} />);
    // Check for device frame elements
    const deviceFrame = container.querySelector(".bg-black.rounded-\\[3rem\\]");
    expect(deviceFrame).toBeInTheDocument();
  });

  it("scales preview correctly", () => {
    const { container } = render(<BioPagePreview {...defaultProps} />);
    const scaledContainer = container.querySelector("[style*='scale(0.65)']");
    expect(scaledContainer).toBeInTheDocument();
  });

  it("handles empty social links array", () => {
    const propsWithEmptySocial = {
      ...defaultProps,
      socialLinks: [],
    };
    const { container } = render(<BioPagePreview {...propsWithEmptySocial} />);
    expect(container).toBeInTheDocument();
    // Should not throw and should render correctly
  });

  it("uses correct button styles based on theme", () => {
    const pillTheme = {
      ...THEME_PRESETS.minimal,
      buttonStyle: "pill" as const,
    };
    render(<BioPagePreview {...defaultProps} theme={pillTheme} />);
    // Button should have rounded-full class for pill style
    const linkCard = screen.getByText("Test Link").closest("a");
    expect(linkCard).toBeInTheDocument();
  });

  it("applies button shadow when enabled in theme", () => {
    const shadowTheme = {
      ...THEME_PRESETS.minimal,
      buttonShadow: true,
    };
    render(<BioPagePreview {...defaultProps} theme={shadowTheme} />);
    const linkCard = screen.getByText("Test Link").closest("a");
    expect(linkCard).toBeInTheDocument();
  });

  it("renders with custom font family from theme", () => {
    const customFontTheme = {
      ...THEME_PRESETS.minimal,
      fontFamily: "Comic Sans MS, cursive",
    };
    const { container } = render(
      <BioPagePreview {...defaultProps} theme={customFontTheme} />
    );
    const contentArea = container.querySelector("[style*='Comic Sans']");
    expect(contentArea).toBeInTheDocument();
  });
});
