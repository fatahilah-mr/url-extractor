export interface ExtractOptions {
  deduplicate?: boolean;
}

export interface ExtractResult {
  urls: string[];
  totalExtracted: number;
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
  // We keep trimming until no trailing invalid boundary characters remain
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
 * Extracts all URLs from raw input text 100% client-side.
 */
export function extractUrls(text: string, options: ExtractOptions = {}): ExtractResult {
  if (!text || typeof text !== 'string') {
    return { urls: [], totalExtracted: 0 };
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

    // Verify valid URL via browser URL constructor
    try {
      const parsed = new URL(cleaned);
      // Ensure it has a valid protocol and hostname with at least one dot or localhost
      if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0) {
        processedUrls.push(cleaned);
      }
    } catch {
      // Ignore invalid URL fragments
    }
  }

  const finalUrls = options.deduplicate ? Array.from(new Set(processedUrls)) : processedUrls;

  return {
    urls: finalUrls,
    totalExtracted: finalUrls.length,
  };
}
