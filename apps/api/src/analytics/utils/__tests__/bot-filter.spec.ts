import { isBot, getBotType } from '../bot-filter';

describe('Bot Filter', () => {
  describe('isBot', () => {
    it('should detect Googlebot', () => {
      expect(isBot('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe(true);
    });

    it('should detect curl requests', () => {
      expect(isBot('curl/7.64.1')).toBe(true);
    });

    it('should detect wget requests', () => {
      expect(isBot('Wget/1.20.3 (linux-gnu)')).toBe(true);
    });

    it('should detect Facebook crawler', () => {
      expect(isBot('facebookexternalhit/1.1')).toBe(true);
    });

    it('should allow Chrome browser', () => {
      expect(isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')).toBe(false);
    });

    it('should allow Safari browser', () => {
      expect(isBot('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15')).toBe(false);
    });

    it('should allow Firefox browser', () => {
      expect(isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0')).toBe(false);
    });

    it('should allow mobile browsers', () => {
      expect(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')).toBe(false);
    });

    it('should return false for empty/undefined user agent', () => {
      expect(isBot('')).toBe(false);
      expect(isBot(undefined)).toBe(false);
    });
  });

  describe('getBotType', () => {
    it('should identify google bot', () => {
      expect(getBotType('Googlebot/2.1')).toBe('google');
    });

    it('should identify cli tools', () => {
      expect(getBotType('curl/7.64.1')).toBe('cli');
    });

    it('should return null for regular browsers', () => {
      expect(getBotType('Mozilla/5.0 Chrome/120.0.0.0')).toBe(null);
    });
  });
});
