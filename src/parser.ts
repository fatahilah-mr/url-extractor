export interface ExtractOptions {
  deduplicate?: boolean;
}

export interface ExtractResult {
  urls: string[];
  totalExtracted: number;
  duplicatesRemoved: number;
}

/**
 * Trims surrounding and trailing punctuation that often wraps URLs in natural prose.
 * Examples:
 *   "(https://example.com/path)." -> "https://example.com/path"
 *   "'https://example.com/path'"  -> "https://example.com/path"
 *   "https://example.com/path!"   -> "https://example.com/path"
 */
function cleanUrlBoundaries(rawUrl: string): string {
  let url = rawUrl.trim();

  // Strip leading quotes or brackets
  url = url.replace(/^['"‘“<(\[{]+/, '');

  // Strip trailing punctuation, brackets, or quotes
  while (/[.,;:!?)]+$|['"’”>)\]}]+$/.test(url)) {
    // If the trailing character is a parenthesis ')', check if the URL has an unmatched '('
    if (url.endsWith(')')) {
      const openCount = (url.match(/\(/g) || []).length;
      const closeCount = (url.match(/\)/g) || []).length;
      // If parentheses are balanced (like Wikipedia URL_(disambiguation)), stop stripping ')'
      if (closeCount <= openCount) {
        break;
      }
    }
    url = url.replace(/[.,;:!?)]+$|['"’”>)\]}]+$/, '');
  }

  return url;
}

/**
 * Computes an RFC 3986 compliant comparison key for deduplication.
 * - Protocol and Host are normalized to lowercase (case-insensitive per RFC 3986 §3.1 & §3.2.2).
 * - Path, Query, and Fragment remain strictly case-sensitive and intact.
 * This guarantees that distinct parameters, endpoints, or fragments are NEVER mistakenly discarded.
 */
function getCanonicalDedupeKey(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    return `${u.protocol.toLowerCase()}//${u.host.toLowerCase()}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return rawUrl;
  }
}

/**
 * Extracts all URLs from raw input text 100% client-side.
 */
export function extractUrls(text: string, options: ExtractOptions = {}): ExtractResult {
  if (!text || typeof text !== 'string') {
    return { urls: [], totalExtracted: 0, duplicatesRemoved: 0 };
  }

  // Matches http://, https://, and www. prefixes with non-whitespace characters
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`[\]]+/gi;
  const rawMatches = text.match(urlRegex) || [];

  const processedUrls: string[] = [];

  for (const rawMatch of rawMatches) {
    let cleaned = cleanUrlBoundaries(rawMatch);

    // Normalize www. to https://www. for standard URL handling
    if (/^www\./i.test(cleaned)) {
      cleaned = `https://${cleaned}`;
    }

    // Verify valid URL via browser URL constructor & enforce strict protocol whitelisting
    try {
      const parsed = new URL(cleaned);
      if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0) {
        processedUrls.push(cleaned);
      }
    } catch {
      // Ignore invalid URL fragments
    }
  }

  let finalUrls = processedUrls;
  let duplicatesRemoved = 0;

  if (options.deduplicate) {
    const seenKeys = new Set<string>();
    const uniqueList: string[] = [];

    for (const url of processedUrls) {
      const key = getCanonicalDedupeKey(url);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueList.push(url);
      } else {
        duplicatesRemoved++;
      }
    }

    finalUrls = uniqueList;
  }

  return {
    urls: finalUrls,
    totalExtracted: finalUrls.length,
    duplicatesRemoved,
  };
}
