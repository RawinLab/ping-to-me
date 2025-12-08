import { parseUserAgent, formatUserAgent } from "./user-agent-parser";

describe("User Agent Parser", () => {
  describe("parseUserAgent", () => {
    it("should parse Chrome on Windows user agent", () => {
      const ua =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      const result = parseUserAgent(ua);

      expect(result.browser).toBe("Chrome");
      expect(result.browserVersion).toBe("120.0");
      expect(result.os).toBe("Windows");
      expect(result.osVersion).toBe("10.0");
      expect(result.device).toBe("desktop");
    });

    it("should parse Safari on macOS user agent", () => {
      const ua =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
      const result = parseUserAgent(ua);

      expect(result.browser).toBe("Safari");
      expect(result.browserVersion).toBe("17.0");
      expect(result.os).toBe("macOS");
      expect(result.osVersion).toBe("10.15.7");
      expect(result.device).toBe("desktop");
    });

    it("should parse Firefox on Linux user agent", () => {
      const ua =
        "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0";
      const result = parseUserAgent(ua);

      expect(result.browser).toBe("Firefox");
      expect(result.browserVersion).toBe("119.0");
      expect(result.os).toBe("Linux");
      expect(result.device).toBe("desktop");
    });

    it("should parse Safari on iPhone user agent", () => {
      const ua =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
      const result = parseUserAgent(ua);

      expect(result.browser).toBe("Safari");
      expect(result.os).toBe("iOS");
      // OS version parsing may normalize underscores - check for both formats
      expect(result.osVersion).toMatch(/17[._]1/);
      expect(result.device).toBe("mobile");
      expect(result.deviceName).toBe("iPhone");
    });

    it("should parse Chrome on Android phone user agent", () => {
      const ua =
        "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36";
      const result = parseUserAgent(ua);

      expect(result.browser).toBe("Chrome");
      expect(result.os).toBe("Android");
      expect(result.osVersion).toBe("14");
      expect(result.device).toBe("mobile");
      expect(result.deviceName).toBe("Android Phone");
    });

    it("should parse Safari on iPad user agent", () => {
      const ua =
        "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1";
      const result = parseUserAgent(ua);

      expect(result.browser).toBe("Safari");
      expect(result.os).toBe("iOS");
      expect(result.osVersion).toBe("17.1");
      expect(result.device).toBe("tablet");
      expect(result.deviceName).toBe("iPad");
    });

    it("should parse Edge on Windows user agent", () => {
      const ua =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
      const result = parseUserAgent(ua);

      expect(result.browser).toBe("Edge");
      expect(result.browserVersion).toBe("120.0");
      expect(result.os).toBe("Windows");
      expect(result.device).toBe("desktop");
    });

    it("should handle undefined user agent", () => {
      const result = parseUserAgent(undefined);

      expect(result.browser).toBe("Unknown");
      expect(result.os).toBe("Unknown");
      expect(result.device).toBe("unknown");
    });

    it("should handle empty user agent", () => {
      const result = parseUserAgent("");

      expect(result.browser).toBe("Unknown");
      expect(result.os).toBe("Unknown");
      expect(result.device).toBe("unknown");
    });
  });

  describe("formatUserAgent", () => {
    it("should format desktop user agent", () => {
      const parsed = {
        browser: "Chrome",
        os: "Windows",
        device: "desktop",
      };
      const result = formatUserAgent(parsed);

      expect(result).toBe("Chrome on Windows");
    });

    it("should format mobile user agent with device name", () => {
      const parsed = {
        browser: "Safari",
        os: "iOS",
        device: "mobile",
        deviceName: "iPhone",
      };
      const result = formatUserAgent(parsed);

      expect(result).toBe("Safari on iPhone");
    });

    it("should format tablet user agent with device name", () => {
      const parsed = {
        browser: "Safari",
        os: "iOS",
        device: "tablet",
        deviceName: "iPad",
      };
      const result = formatUserAgent(parsed);

      expect(result).toBe("Safari on iPad");
    });

    it("should handle unknown browser and OS", () => {
      const parsed = {
        browser: "Unknown",
        os: "Unknown",
        device: "unknown",
      };
      const result = formatUserAgent(parsed);

      expect(result).toBe("Unknown device");
    });

    it("should handle missing browser", () => {
      const parsed = {
        browser: "Unknown",
        os: "Windows",
        device: "desktop",
      };
      const result = formatUserAgent(parsed);

      expect(result).toBe("on Windows");
    });
  });
});
