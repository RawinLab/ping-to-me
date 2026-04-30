import { Hono } from "hono";
import { renderInterstitial } from "./templates/interstitial";

type Bindings = {
  LINKS_KV: KVNamespace;
  API_URL: string;
  ANALYTICS_API_KEY: string;
};

interface OgPreview {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}

interface LinkMetadata {
  url: string;
  passwordHash?: string;
  expirationDate?: string;
  deepLinkFallback?: string;
  redirectType?: number;
  status?: string;
  // Phase 4 fields
  maxClicks?: number;
  currentClicks?: number;
  redirectRules?: RedirectRule[];
  variants?: LinkVariant[];
  // Interstitial fields
  interstitial?: boolean;
  countdownSeconds?: number;
  ogPreview?: OgPreview | null;
}

interface RedirectRule {
  id: string;
  priority: number;
  countries?: string[];
  devices?: string[];
  browsers?: string[];
  os?: string[];
  languages?: string[];
  dateRange?: { start?: string; end?: string };
  timeRange?: { start?: string; end?: string };
  targetUrl: string;
  redirectType: number;
  isActive: boolean;
}

interface LinkVariant {
  id: string;
  targetUrl: string;
  weight: number;
  isActive: boolean;
}

interface RequestContext {
  country?: string;
  device?: string;
  browser?: string;
  os?: string;
  language?: string;
  currentTime?: Date;
}

/**
 * Parse User-Agent to detect device, browser, and OS
 */
function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  const lowerUA = ua.toLowerCase();

  // Device detection
  let device = 'desktop';
  if (/mobile|android|iphone|ipod/i.test(lowerUA)) {
    device = 'mobile';
  } else if (/tablet|ipad/i.test(lowerUA)) {
    device = 'tablet';
  }

  // Browser detection
  let browser = 'unknown';
  if (/edg/i.test(lowerUA)) {
    browser = 'edge';
  } else if (/chrome/i.test(lowerUA)) {
    browser = 'chrome';
  } else if (/safari/i.test(lowerUA) && !/chrome/i.test(lowerUA)) {
    browser = 'safari';
  } else if (/firefox/i.test(lowerUA)) {
    browser = 'firefox';
  } else if (/opera|opr/i.test(lowerUA)) {
    browser = 'opera';
  }

  // OS detection
  let os = 'unknown';
  if (/windows/i.test(lowerUA)) {
    os = 'windows';
  } else if (/iphone|ipad/i.test(lowerUA)) {
    os = 'ios';
  } else if (/mac/i.test(lowerUA)) {
    os = 'macos';
  } else if (/android/i.test(lowerUA)) {
    os = 'android';
  } else if (/linux/i.test(lowerUA)) {
    os = 'linux';
  }

  return { device, browser, os };
}

/**
 * Check if a redirect rule matches the current context
 */
function matchesRule(rule: RedirectRule, context: RequestContext): boolean {
  // Country check
  if (rule.countries?.length && context.country) {
    if (!rule.countries.includes(context.country)) {
      return false;
    }
  }

  // Device check
  if (rule.devices?.length && context.device) {
    if (!rule.devices.includes(context.device)) {
      return false;
    }
  }

  // Browser check
  if (rule.browsers?.length && context.browser) {
    if (!rule.browsers.includes(context.browser.toLowerCase())) {
      return false;
    }
  }

  // OS check
  if (rule.os?.length && context.os) {
    if (!rule.os.includes(context.os.toLowerCase())) {
      return false;
    }
  }

  // Language check
  if (rule.languages?.length && context.language) {
    const langCode = context.language.split('-')[0].toLowerCase();
    if (!rule.languages.some(l => l.toLowerCase().startsWith(langCode))) {
      return false;
    }
  }

  // Date range check
  if (rule.dateRange) {
    const now = context.currentTime || new Date();
    if (rule.dateRange.start && new Date(rule.dateRange.start) > now) {
      return false;
    }
    if (rule.dateRange.end && new Date(rule.dateRange.end) < now) {
      return false;
    }
  }

  // Time range check (HH:mm format)
  if (rule.timeRange) {
    const now = context.currentTime || new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (rule.timeRange.start && currentTime < rule.timeRange.start) {
      return false;
    }
    if (rule.timeRange.end && currentTime > rule.timeRange.end) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate redirect rules and return the first matching rule
 */
function evaluateRedirectRules(
  rules: RedirectRule[],
  context: RequestContext
): RedirectRule | null {
  // Filter active rules and sort by priority (higher first)
  const sortedRules = [...rules]
    .filter(r => r.isActive)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (matchesRule(rule, context)) {
      return rule;
    }
  }

  return null;
}

/**
 * Select a variant using weighted random selection
 */
function selectVariant(variants: LinkVariant[]): LinkVariant | null {
  const activeVariants = variants.filter(v => v.isActive);

  if (activeVariants.length === 0) {
    return null;
  }

  if (activeVariants.length === 1) {
    return activeVariants[0];
  }

  const totalWeight = activeVariants.reduce((sum, v) => sum + v.weight, 0);

  if (totalWeight === 0) {
    // If all weights are 0, select randomly with equal probability
    const randomIndex = Math.floor(Math.random() * activeVariants.length);
    return activeVariants[randomIndex];
  }

  let random = Math.random() * totalWeight;

  for (const variant of activeVariants) {
    random -= variant.weight;
    if (random <= 0) {
      return variant;
    }
  }

  // Fallback to last variant
  return activeVariants[activeVariants.length - 1];
}

const app = new Hono<{ Bindings: Bindings }>();

app.get("/:slug", async (c) => {
  const url = new URL(c.req.url);
  const hostname = url.hostname;
  const slug = url.pathname.slice(1); // remove leading slash

  const kv = c.env.LINKS_KV;
  const apiUrl = c.env.API_URL || "http://localhost:3000";

  // Check for custom domain
  if (
    hostname !== "localhost" &&
    hostname !== "pingto.me" &&
    !hostname.endsWith(".pingto.me")
  ) {
    // This is a custom domain request
    // 1. Check KV for domain mapping
    const domainTarget = await kv.get(`domain:${hostname}`);

    if (domainTarget) {
      // If root, redirect to bio page or target
      if (!slug) {
        return c.redirect(domainTarget, 301);
      }
      // If slug, it might be a link under this domain
      // For MVP, we'll just treat it as a normal link lookup but maybe enforce org scope later
    }
  }

  if (!slug) {
    return c.json({ message: "Welcome to PingTO.Me Redirector" });
  }

  // 1. Check KV for Link
  let value = await kv.get(slug);

  // 2. Fallback to API if not in KV
  if (!value) {
    try {
      const res = await fetch(`${apiUrl}/links/${slug}/lookup`);
      if (res.ok) {
        const data = (await res.json()) as any;
        value = JSON.stringify({
          url: data.originalUrl,
          passwordHash: data.passwordHash,
          expirationDate: data.expirationDate,
          deepLinkFallback: data.deepLinkFallback,
          redirectType: data.redirectType,
          status: data.status,
          maxClicks: data.maxClicks,
          currentClicks: data.currentClicks,
          redirectRules: data.redirectRules,
          variants: data.variants,
          interstitial: data.interstitial ?? false,
          countdownSeconds: data.countdownSeconds ?? 0,
          ogPreview: data.ogPreview,
        });
        // Cache in KV for next time
        c.executionCtx.waitUntil(kv.put(slug, value, { expirationTtl: 3600 })); // Cache for 1 hour
      }
    } catch (e) {
      console.error("API lookup failed:", e);
    }
  }

  if (value) {
    let destination = value;
    let metadata: LinkMetadata = {} as LinkMetadata;

    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && parsed.url) {
        destination = parsed.url;
        metadata = parsed;
      }
    } catch (e) {
      // Legacy string value, treat as destination
    }

    // Check link status BEFORE other checks
    if (metadata.status && metadata.status !== "ACTIVE") {
      if (metadata.status === "DISABLED") {
        return c.text("Link is disabled", 403);
      }
      if (metadata.status === "BANNED") {
        return c.text("Link has been removed", 410);
      }
      if (metadata.status === "EXPIRED") {
        return c.text("Link has expired", 410);
      }
      if (metadata.status === "ARCHIVED") {
        return c.text("Link is archived", 410);
      }
    }

    // Check expiration
    if (
      metadata.expirationDate &&
      new Date(metadata.expirationDate) < new Date()
    ) {
      return c.text("Link Expired", 410);
    }

    // Phase 4: Check click-based expiration
    if (metadata.maxClicks && metadata.currentClicks !== undefined) {
      if (metadata.currentClicks >= metadata.maxClicks) {
        return c.text("Link has reached its click limit", 410);
      }
    }

    // Check password (placeholder)
    if (metadata.passwordHash) {
      // In a real app, we would check for a session cookie or render a password form
      // For MVP, we'll just return a 403
      return c.text("Password Protected", 403);
    }

    // Parse User-Agent and get request context
    const userAgent = c.req.header("user-agent") || '';
    const { device, browser, os } = parseUserAgent(userAgent);
    const country = c.req.header("cf-ipcountry") || '';
    const language = c.req.header("accept-language")?.split(',')[0] || '';

    const requestContext: RequestContext = {
      country,
      device,
      browser,
      os,
      language,
      currentTime: new Date()
    };

    // Phase 4: Smart Redirects - Check redirect rules
    let matchedRule: RedirectRule | null = null;
    if (metadata.redirectRules?.length) {
      matchedRule = evaluateRedirectRules(metadata.redirectRules, requestContext);

      if (matchedRule) {
        // Use matched rule's target URL and redirect type
        destination = matchedRule.targetUrl;
      }
    }

    // Phase 4: A/B Testing - Select variant (only if no rule matched)
    let selectedVariant: LinkVariant | null = null;
    if (!matchedRule && metadata.variants?.length) {
      selectedVariant = selectVariant(metadata.variants);

      if (selectedVariant) {
        destination = selectedVariant.targetUrl;
      }
    }

    // Detect click source - QR codes add utm_source=qr or qr=1 to URL
    const clickSource =
      url.searchParams.get("utm_source") === "qr" ||
      url.searchParams.get("qr") === "1"
        ? "QR"
        : "DIRECT";

    // Async analytics (fire and forget)
    c.executionCtx.waitUntil(
      fetch(`${apiUrl}/analytics/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": c.env.ANALYTICS_API_KEY,
        },
        body: JSON.stringify({
          slug,
          timestamp: new Date().toISOString(),
          userAgent: userAgent,
          ip: c.req.header("cf-connecting-ip"),
          country: country,
          source: clickSource,
          referrer: c.req.header("referer") || "direct",
          // Phase 4 analytics fields
          variantId: selectedVariant?.id,
          matchedRuleId: matchedRule?.id,
          device: device,
          browser: browser,
          os: os,
        }),
      }).catch((err) => console.error("Analytics error:", err)),
    );

    // Get redirect type from matched rule or metadata (default to 301 if not specified)
    let redirectCode = 301;
    if (matchedRule) {
      redirectCode = matchedRule.redirectType;
    } else if (metadata.redirectType) {
      redirectCode = parseInt(metadata.redirectType.toString());
    }

    // Validate redirect code (only allow 301 or 302)
    const validRedirectCode = (redirectCode === 301 || redirectCode === 302) ? redirectCode : 301;

    console.log(`Redirecting ${slug} to ${destination} with ${validRedirectCode}`);

    if (metadata.interstitial) {
      const html = renderInterstitial({
        destination,
        countdownSeconds: metadata.countdownSeconds ?? 0,
        ogPreview: metadata.ogPreview,
        slug,
      });
      return c.html(html);
    }

    return c.redirect(destination, validRedirectCode);
  }

  return c.text("Link not found", 404);
});

export default app;
