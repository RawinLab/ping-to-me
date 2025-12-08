// Bot detection patterns
const BOT_PATTERNS = [
  // Search engines
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandex/i,

  // Social media crawlers
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /pinterest/i,
  /telegrambot/i,
  /whatsapp/i,

  // CLI tools
  /curl/i,
  /wget/i,
  /httpie/i,

  // API testing
  /postman/i,
  /insomnia/i,

  // Programming languages/libraries
  /python-requests/i,
  /python-urllib/i,
  /node-fetch/i,
  /axios/i,
  /go-http-client/i,
  /java/i,
  /php/i,

  // Generic patterns
  /bot/i,
  /spider/i,
  /crawler/i,
  /scraper/i,
  /headless/i,
  /phantom/i,
  /selenium/i,
  /puppeteer/i,
];

/**
 * Check if a user agent string belongs to a bot/crawler
 * @param userAgent The user agent string to check
 * @returns true if the user agent is a bot, false otherwise
 */
export function isBot(userAgent?: string): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

/**
 * Get the bot type if matched
 * @param userAgent The user agent string to check
 * @returns The matched bot type or null
 */
export function getBotType(userAgent?: string): string | null {
  if (!userAgent) return null;

  if (/googlebot/i.test(userAgent)) return 'google';
  if (/bingbot/i.test(userAgent)) return 'bing';
  if (/facebookexternalhit/i.test(userAgent)) return 'facebook';
  if (/twitterbot/i.test(userAgent)) return 'twitter';
  if (/curl|wget/i.test(userAgent)) return 'cli';
  if (/bot|spider|crawler/i.test(userAgent)) return 'generic-bot';

  return null;
}
