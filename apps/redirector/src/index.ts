import { Hono } from 'hono'

type Bindings = {
  LINKS_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/:slug', async (c) => {
  const url = new URL(c.req.url)
  const hostname = url.hostname
  const slug = url.pathname.slice(1) // remove leading slash

  const kv = c.env.LINKS_KV

  // Check for custom domain
  if (hostname !== 'localhost' && hostname !== 'pingto.me' && !hostname.endsWith('.pingto.me')) {
    // This is a custom domain request
    // 1. Check KV for domain mapping
    const domainTarget = await kv.get(`domain:${hostname}`)

    if (domainTarget) {
      // If root, redirect to bio page or target
      if (!slug) {
        return c.redirect(domainTarget, 301)
      }
      // If slug, it might be a link under this domain
      // For MVP, we'll just treat it as a normal link lookup but maybe enforce org scope later
    }
  }

  if (!slug) {
    return c.json({ message: 'Welcome to PingTO.Me Redirector' })
  }

  // 1. Check KV for Link
  const value = await kv.get(slug)
  if (value) {
    let destination = value;
    let metadata: any = {};

    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && parsed.url) {
        destination = parsed.url;
        metadata = parsed;
      }
    } catch (e) {
      // Legacy string value, treat as destination
    }

    // Check expiration
    if (metadata.expirationDate && new Date(metadata.expirationDate) < new Date()) {
      return c.text('Link Expired', 410);
    }

    // Check password (placeholder)
    if (metadata.passwordHash) {
      // In a real app, we would check for a session cookie or render a password form
      // For MVP, we'll just return a 403
      return c.text('Password Protected', 403);
    }

    // Async analytics (fire and forget)
    c.executionCtx.waitUntil(
      fetch('https://api.pingto.me/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          timestamp: new Date().toISOString(),
          userAgent: c.req.header('user-agent'),
          ip: c.req.header('cf-connecting-ip'),
          country: c.req.header('cf-ipcountry'),
        }),
      }).catch(err => console.error('Analytics error:', err))
    )

    console.log(`Redirecting ${slug} to ${destination}`)
    return c.redirect(destination, 301)
  }

  // 2. Fallback to DB (Mock for MVP)
  // In real implementation, call API or Supabase directly
  // const res = await fetch(`https://api.pingto.me/links/${slug}`)

  return c.text('Link not found', 404)
})

export default app
