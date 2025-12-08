/**
 * User Agent Parser Utility
 * Parses user agent strings into readable device, browser, and OS information
 */

export interface ParsedUserAgent {
  browser: string;
  browserVersion?: string;
  os: string;
  osVersion?: string;
  device: string; // 'desktop' | 'mobile' | 'tablet' | 'unknown'
  deviceName?: string;
}

/**
 * Parse user agent string into structured information
 */
export function parseUserAgent(userAgent?: string): ParsedUserAgent {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'unknown',
    };
  }

  const ua = userAgent.toLowerCase();

  // Detect browser
  const browser = detectBrowser(ua);

  // Detect operating system
  const os = detectOS(ua);

  // Detect device type
  const device = detectDevice(ua);

  return {
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version,
    device: device.type,
    deviceName: device.name,
  };
}

/**
 * Detect browser from user agent
 */
function detectBrowser(ua: string): { name: string; version?: string } {
  const browsers = [
    { name: 'Edge', pattern: /edg(?:e|ios|a)?\/(\d+(\.\d+)?)/ },
    { name: 'Opera', pattern: /(?:opera|opr)\/(\d+(\.\d+)?)/ },
    { name: 'Chrome', pattern: /chrome\/(\d+(\.\d+)?)/ },
    { name: 'Safari', pattern: /version\/(\d+(\.\d+)?).+safari/ },
    { name: 'Firefox', pattern: /firefox\/(\d+(\.\d+)?)/ },
    { name: 'IE', pattern: /(?:msie |trident.+rv:)(\d+(\.\d+)?)/ },
  ];

  for (const browser of browsers) {
    const match = ua.match(browser.pattern);
    if (match) {
      return {
        name: browser.name,
        version: match[1],
      };
    }
  }

  return { name: 'Unknown' };
}

/**
 * Detect operating system from user agent
 */
function detectOS(ua: string): { name: string; version?: string } {
  const operatingSystems = [
    { name: 'Windows', pattern: /windows nt (\d+(\.\d+)?)/ },
    { name: 'macOS', pattern: /mac os x (\d+[._]\d+([._]\d+)?)/ },
    { name: 'iOS', pattern: /(?:iphone|ipad|ipod).+os (\d+([._]\d+)?)/ },
    { name: 'Android', pattern: /android (\d+(\.\d+)?)/ },
    { name: 'Linux', pattern: /linux/ },
    { name: 'Chrome OS', pattern: /cros/ },
  ];

  for (const os of operatingSystems) {
    const match = ua.match(os.pattern);
    if (match) {
      let version = match[1];
      // Normalize version (replace underscores with dots)
      if (version) {
        version = version.replace(/_/g, '.');
      }
      return {
        name: os.name,
        version,
      };
    }
  }

  return { name: 'Unknown' };
}

/**
 * Detect device type from user agent
 */
function detectDevice(ua: string): { type: string; name?: string } {
  // Mobile devices
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('ipod')) {
    if (ua.includes('iphone')) return { type: 'mobile', name: 'iPhone' };
    if (ua.includes('android')) return { type: 'mobile', name: 'Android Phone' };
    return { type: 'mobile', name: 'Mobile' };
  }

  // Tablets
  if (ua.includes('ipad') || ua.includes('tablet') || ua.includes('kindle')) {
    if (ua.includes('ipad')) return { type: 'tablet', name: 'iPad' };
    if (ua.includes('android')) return { type: 'tablet', name: 'Android Tablet' };
    return { type: 'tablet', name: 'Tablet' };
  }

  // Desktop
  return { type: 'desktop', name: 'Desktop' };
}

/**
 * Format parsed user agent into a readable string
 * Example: "Chrome on macOS" or "Safari on iPhone"
 */
export function formatUserAgent(parsed: ParsedUserAgent): string {
  const parts: string[] = [];

  // Browser
  if (parsed.browser !== 'Unknown') {
    parts.push(parsed.browser);
  }

  // Device name (for mobile/tablet) or OS
  if (parsed.deviceName && parsed.device !== 'desktop') {
    parts.push(`on ${parsed.deviceName}`);
  } else if (parsed.os !== 'Unknown') {
    parts.push(`on ${parsed.os}`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Unknown device';
}

/**
 * Get device icon name for UI rendering
 */
export function getDeviceIcon(device: string): string {
  switch (device) {
    case 'mobile':
      return 'smartphone';
    case 'tablet':
      return 'tablet';
    case 'desktop':
      return 'monitor';
    default:
      return 'help-circle';
  }
}
