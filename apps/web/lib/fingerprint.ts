/**
 * Device Fingerprinting Library
 *
 * Generates a browser fingerprint using available browser APIs.
 * This is a simple implementation that doesn't require external libraries.
 * For production, consider using @fingerprintjs/fingerprintjs library.
 */

export interface DeviceFingerprint {
  fingerprint: string;
  components: {
    userAgent: string;
    language: string;
    colorDepth: number;
    deviceMemory?: number;
    hardwareConcurrency?: number;
    screenResolution: string;
    availableScreenResolution: string;
    timezoneOffset: number;
    timezone?: string;
    sessionStorage: boolean;
    localStorage: boolean;
    indexedDb: boolean;
    platform: string;
    plugins: string[];
    canvas?: string;
    webgl?: string;
    webglVendor?: string;
    adBlock: boolean;
    hasLiedLanguages: boolean;
    hasLiedResolution: boolean;
    hasLiedOs: boolean;
    hasLiedBrowser: boolean;
    touchSupport: {
      maxTouchPoints: number;
      touchEvent: boolean;
      touchStart: boolean;
    };
  };
}

/**
 * Simple hash function for generating fingerprint
 */
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get canvas fingerprint
 */
function getCanvasFingerprint(): string | undefined {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const text = "PingTO.Me Device Fingerprint 🔒";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText(text, 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText(text, 4, 17);

    return hashCode(canvas.toDataURL());
  } catch (e) {
    return undefined;
  }
}

/**
 * Get WebGL fingerprint
 */
function getWebGLFingerprint(): { webgl?: string; webglVendor?: string } {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) return {};

    const debugInfo = (gl as any).getExtension("WEBGL_debug_renderer_info");
    const webglVendor = debugInfo
      ? (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : undefined;
    const webglRenderer = debugInfo
      ? (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : undefined;

    return {
      webgl: webglRenderer,
      webglVendor: webglVendor,
    };
  } catch (e) {
    return {};
  }
}

/**
 * Get installed plugins
 */
function getPlugins(): string[] {
  const plugins: string[] = [];

  // Modern browsers don't expose navigator.plugins anymore
  // This is a legacy check for older browsers
  if (navigator.plugins && navigator.plugins.length > 0) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      if (plugin && plugin.name) {
        plugins.push(plugin.name);
      }
    }
  }

  return plugins;
}

/**
 * Check for ad blocker
 */
function detectAdBlock(): boolean {
  // Simple ad block detection
  // In production, this would be more sophisticated
  const adBlockTest = document.createElement("div");
  adBlockTest.innerHTML = "&nbsp;";
  adBlockTest.className = "adsbox";
  adBlockTest.style.position = "absolute";
  adBlockTest.style.left = "-9999px";
  document.body.appendChild(adBlockTest);
  const isBlocked = adBlockTest.offsetHeight === 0;
  document.body.removeChild(adBlockTest);
  return isBlocked;
}

/**
 * Check for lies in browser information
 */
function detectLies(): {
  hasLiedLanguages: boolean;
  hasLiedResolution: boolean;
  hasLiedOs: boolean;
  hasLiedBrowser: boolean;
} {
  const screen = window.screen;
  const navigator = window.navigator;

  // Simple lie detection (can be expanded)
  return {
    hasLiedLanguages: false,
    hasLiedResolution: screen.width === 0 || screen.height === 0,
    hasLiedOs: false,
    hasLiedBrowser: false,
  };
}

/**
 * Get touch support information
 */
function getTouchSupport(): {
  maxTouchPoints: number;
  touchEvent: boolean;
  touchStart: boolean;
} {
  return {
    maxTouchPoints: navigator.maxTouchPoints || 0,
    touchEvent: "ontouchstart" in window,
    touchStart: "ontouchstart" in window,
  };
}

/**
 * Generate device fingerprint
 */
export async function generateFingerprint(): Promise<DeviceFingerprint> {
  const screen = window.screen;
  const navigator = window.navigator;
  const webglInfo = getWebGLFingerprint();
  const lies = detectLies();

  const components = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    colorDepth: screen.colorDepth,
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    screenResolution: `${screen.width}x${screen.height}`,
    availableScreenResolution: `${screen.availWidth}x${screen.availHeight}`,
    timezoneOffset: new Date().getTimezoneOffset(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionStorage: !!window.sessionStorage,
    localStorage: !!window.localStorage,
    indexedDb: !!window.indexedDB,
    platform: navigator.platform,
    plugins: getPlugins(),
    canvas: getCanvasFingerprint(),
    webgl: webglInfo.webgl,
    webglVendor: webglInfo.webglVendor,
    adBlock: detectAdBlock(),
    hasLiedLanguages: lies.hasLiedLanguages,
    hasLiedResolution: lies.hasLiedResolution,
    hasLiedOs: lies.hasLiedOs,
    hasLiedBrowser: lies.hasLiedBrowser,
    touchSupport: getTouchSupport(),
  };

  // Create fingerprint string from components
  const fingerprintString = JSON.stringify([
    components.userAgent,
    components.language,
    components.colorDepth,
    components.deviceMemory,
    components.hardwareConcurrency,
    components.screenResolution,
    components.timezoneOffset,
    components.timezone,
    components.platform,
    components.canvas,
    components.webgl,
    components.webglVendor,
  ]);

  const fingerprint = hashCode(fingerprintString);

  return {
    fingerprint,
    components,
  };
}

/**
 * Get stored fingerprint from localStorage or generate new one
 */
export async function getOrCreateFingerprint(): Promise<string> {
  try {
    const stored = localStorage.getItem("device_fingerprint");
    if (stored) {
      return stored;
    }

    const result = await generateFingerprint();
    localStorage.setItem("device_fingerprint", result.fingerprint);
    return result.fingerprint;
  } catch (e) {
    // If localStorage is not available, generate without storing
    const result = await generateFingerprint();
    return result.fingerprint;
  }
}

/**
 * Clear stored fingerprint (useful for testing)
 */
export function clearFingerprint(): void {
  try {
    localStorage.removeItem("device_fingerprint");
  } catch (e) {
    // Ignore errors
  }
}
