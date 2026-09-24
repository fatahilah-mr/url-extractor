import { describe, it, expect } from 'vitest';
import { extractUrls } from './parser';

describe('extractUrls Engine', () => {
  it('returns empty result for empty or whitespace string', () => {
    expect(extractUrls('')).toEqual({ urls: [], totalExtracted: 0 });
    expect(extractUrls('   \n\t  ')).toEqual({ urls: [], totalExtracted: 0 });
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

  it('supports deduplication option when requested', () => {
    const text = 'Link sama: https://example.com dan https://example.com dan https://other.org';
    const resultAll = extractUrls(text);
    expect(resultAll.urls.length).toBe(3);

    const resultUnique = extractUrls(text, { deduplicate: true });
    expect(resultUnique.urls).toEqual([
      'https://example.com',
      'https://other.org'
    ]);
    expect(resultUnique.totalExtracted).toBe(2);
  });

  it('handles Wikipedia URLs with internal parentheses', () => {
    const text = 'Baca https://en.wikipedia.org/wiki/URL_(disambiguation) di Wikipedia.';
    const result = extractUrls(text);
    expect(result.urls).toEqual([
      'https://en.wikipedia.org/wiki/URL_(disambiguation)'
    ]);
  });
});
