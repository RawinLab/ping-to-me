import { Hono } from "hono";

type Bindings = {
  LINKS_KV: KVNamespace;
  API_URL: string;
};

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
    let metadata: any = {};

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

    // Check password (placeholder)
    if (metadata.passwordHash) {
      // In a real app, we would check for a session cookie or render a password form
      // For MVP, we'll just return a 403
      return c.text("Password Protected", 403);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          timestamp: new Date().toISOString(),
          userAgent: c.req.header("user-agent"),
          ip: c.req.header("cf-connecting-ip"),
          country: c.req.header("cf-ipcountry"),
          source: clickSource,
        }),
      }).catch((err) => console.error("Analytics error:", err)),
    );

    console.log(`Redirecting ${slug} to ${destination}`);
    return c.redirect(destination, 301);
  }

  return c.text("Link not found", 404);
});

export default app;
