import { describe, it, expect } from 'vitest';
import { extractUrls, formatUrlList } from './parser';

describe('extractUrls Engine', () => {
  it('returns empty result for empty or whitespace string', () => {
    expect(extractUrls('')).toEqual({ urls: [], totalExtracted: 0, duplicatesRemoved: 0 });
    expect(extractUrls('   \n\t  ')).toEqual({ urls: [], totalExtracted: 0, duplicatesRemoved: 0 });
  });

  it('extracts standard http and https URLs', () => {
    const text = 'Silakan kunjungi https://fatah.web.id dan http://example.com/test';
    const result = extractUrls(text);
    expect(result.urls).toEqual([
      'https://fatah.web.id',
      'http://example.com/test'
    ]);
    expect(result.totalExtracted).toBe(2);
  });

  it('normalizes www. prefixes to https://', () => {
    const text = 'Buka www.google.com atau www.github.com/fatahilah-mr';
    const result = extractUrls(text);
    expect(result.urls).toEqual([
      'https://www.google.com',
      'https://www.github.com/fatahilah-mr'
    ]);
  });

  it('correctly trims trailing punctuation in natural sentences', () => {
    const text = `
      Cek postingan ini: https://example.com/post/1.
      Lalu baca juga artikel di https://example.com/artikel, jangan sampai ketinggalan!
      Atau kontak kami di (https://example.com/kontak).
      Ada juga versi 'https://example.com/docs'; dan "https://example.com/api"!
    `;
    const result = extractUrls(text);
    expect(result.urls).toEqual([
      'https://example.com/post/1',
      'https://example.com/artikel',
      'https://example.com/kontak',
      'https://example.com/docs',
      'https://example.com/api'
    ]);
  });

  it('preserves query parameters and URL fragments', () => {
    const text = 'Detail order: https://shop.example.com/checkout?item=456&ref=email#step2 selesai.';
    const result = extractUrls(text);
    expect(result.urls).toEqual([
      'https://shop.example.com/checkout?item=456&ref=email#step2'
    ]);
  });

  it('handles Wikipedia URLs with internal parentheses', () => {
    const text = 'Baca https://en.wikipedia.org/wiki/URL_(disambiguation) di Wikipedia.';
    const result = extractUrls(text);
    expect(result.urls).toEqual([
      'https://en.wikipedia.org/wiki/URL_(disambiguation)'
    ]);
  });

  /* Enterprise Security Tests */
  it('strictly rejects dangerous non-http protocols (XSS prevention)', () => {
    const maliciousText = `
      Tautan terlarang: javascript:alert(1)
      Data uri: data:text/html,<script>alert('xss')</script>
      VBScript: vbscript:msgbox("hello")
      File system: file:///etc/passwd
    `;
    const result = extractUrls(maliciousText);
    expect(result.urls).toEqual([]);
    expect(result.totalExtracted).toBe(0);
  });

  it('handles IP addresses, custom ports, and encoded URL characters', () => {
    const text = 'Dashboard: http://192.168.1.1:8080/admin/v2?filter=%20special';
    const result = extractUrls(text);
    expect(result.urls).toEqual([
      'http://192.168.1.1:8080/admin/v2?filter=%20special'
    ]);
  });

  /* Enterprise Deduplication Tests (Guaranteed Never to Drop Wrong URLs) */
  describe('Deduplication Safety & RFC-3986 Compliance', () => {
    it('correctly filters exact duplicates and preserves first appearance order', () => {
      const text = `
        1. https://first.com/page
        2. https://second.com/page
        3. https://first.com/page
        4. https://third.com/page
        5. https://second.com/page
      `;
      const result = extractUrls(text, { deduplicate: true });
      expect(result.urls).toEqual([
        'https://first.com/page',
        'https://second.com/page',
        'https://third.com/page'
      ]);
      expect(result.totalExtracted).toBe(3);
      expect(result.duplicatesRemoved).toBe(2);
    });

    it('NEVER discards URLs with different query parameters', () => {
      const text = `
        https://api.example.com/v1/users?page=1
        https://api.example.com/v1/users?page=2
        https://api.example.com/v1/users?sort=asc
      `;
      const result = extractUrls(text, { deduplicate: true });
      expect(result.urls).toHaveLength(3);
      expect(result.duplicatesRemoved).toBe(0);
    });

    it('NEVER discards URLs with different hash fragments', () => {
      const text = `
        https://docs.example.com/guide#intro
        https://docs.example.com/guide#installation
        https://docs.example.com/guide#faq
      `;
      const result = extractUrls(text, { deduplicate: true });
      expect(result.urls).toHaveLength(3);
      expect(result.duplicatesRemoved).toBe(0);
    });

    it('NEVER discards URLs with different paths or ports', () => {
      const text = `
        https://example.com:3000/app
        https://example.com:8080/app
        https://example.com/other
      `;
      const result = extractUrls(text, { deduplicate: true });
      expect(result.urls).toHaveLength(3);
      expect(result.duplicatesRemoved).toBe(0);
    });

    it('accurately identifies duplicates even if host casing differs (RFC 3986 §3.2.2)', () => {
      const text = `
        https://GITHUB.COM/fatahilah-mr/url-extractor
        https://github.com/fatahilah-mr/url-extractor
      `;
      const result = extractUrls(text, { deduplicate: true });
      expect(result.urls).toHaveLength(1);
      expect(result.duplicatesRemoved).toBe(1);
    });
  });

  describe('formatUrlList Formatter', () => {
    it('returns empty string for empty input', () => {
      expect(formatUrlList([])).toBe('');
      expect(formatUrlList([], true)).toBe('');
    });

    it('formats plain URLs without numbers when numbered is false', () => {
      const urls = ['https://a.com', 'https://b.com'];
      expect(formatUrlList(urls, false)).toBe('https://a.com\nhttps://b.com');
    });

    it('formats sequential numbered URLs when numbered is true (1. url, 2. url)', () => {
      const urls = ['https://a.com', 'https://b.com', 'https://c.com'];
      expect(formatUrlList(urls, true)).toBe('1. https://a.com\n2. https://b.com\n3. https://c.com');
    });

    it('correctly handles multi-digit numbering (e.g. 10+)', () => {
      const urls = Array.from({ length: 12 }, (_, i) => `https://link-${i + 1}.com`);
      const output = formatUrlList(urls, true);
      expect(output).toContain('1. https://link-1.com');
      expect(output).toContain('10. https://link-10.com');
      expect(output).toContain('12. https://link-12.com');
    });
  });
});
