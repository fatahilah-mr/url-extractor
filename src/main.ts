import { extractUrls } from './parser';

// DOM Element references
const inputText = document.getElementById('input-text') as HTMLTextAreaElement | null;
const outputEmpty = document.getElementById('output-empty') as HTMLElement | null;
const outputLinksContainer = document.getElementById('output-links-container') as HTMLElement | null;
const outputLinksList = document.getElementById('output-links-list') as HTMLElement | null;
const outputRawContainer = document.getElementById('output-raw-container') as HTMLElement | null;
const outputText = document.getElementById('output-text') as HTMLTextAreaElement | null;

const tabLinks = document.getElementById('tab-links') as HTMLButtonElement | null;
const tabRaw = document.getElementById('tab-raw') as HTMLButtonElement | null;

const charCounter = document.getElementById('char-counter') as HTMLElement | null;
const urlCounter = document.getElementById('url-counter') as HTMLElement | null;
const btnPasteQuick = document.getElementById('btn-paste-quick') as HTMLButtonElement | null;
const btnCopyAll = document.getElementById('btn-copy-all') as HTMLButtonElement | null;
const btnCopyMobile = document.getElementById('btn-copy-mobile') as HTMLButtonElement | null;
const btnSample = document.getElementById('btn-sample') as HTMLButtonElement | null;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement | null;
const btnDownload = document.getElementById('btn-download') as HTMLButtonElement | null;
const optDeduplicate = document.getElementById('opt-deduplicate') as HTMLInputElement | null;
const toast = document.getElementById('toast') as HTMLElement | null;
const toastMessage = document.getElementById('toast-message') as HTMLElement | null;

let toastTimeout: number | undefined;
let debounceTimer: number | undefined;
let currentViewMode: 'links' | 'raw' = 'links';
let currentUrls: string[] = [];

/**
 * Display a subtle toast feedback message
 */
function showToast(message: string, durationMs = 2400): void {
  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.classList.add('active');

  if (toastTimeout) {
    window.clearTimeout(toastTimeout);
  }

  toastTimeout = window.setTimeout(() => {
    toast.classList.remove('active');
  }, durationMs);
}

/**
 * Update the character counter based on input length
 */
function updateCharCounter(): void {
  if (!inputText || !charCounter) return;
  const count = inputText.value.length;
  charCounter.textContent = `${count.toLocaleString('id-ID')} karakter`;
}

/**
 * Toggle between 'links' (interactive list) and 'raw' (textarea) views
 */
function setViewMode(mode: 'links' | 'raw'): void {
  currentViewMode = mode;

  if (tabLinks) {
    tabLinks.classList.toggle('active', mode === 'links');
    tabLinks.setAttribute('aria-selected', mode === 'links' ? 'true' : 'false');
  }
  if (tabRaw) {
    tabRaw.classList.toggle('active', mode === 'raw');
    tabRaw.setAttribute('aria-selected', mode === 'raw' ? 'true' : 'false');
  }

  const hasUrls = currentUrls.length > 0;
  if (!hasUrls) {
    if (outputLinksContainer) outputLinksContainer.style.display = 'none';
    if (outputRawContainer) outputRawContainer.style.display = 'none';
    if (outputEmpty) outputEmpty.style.display = 'flex';
    return;
  }

  if (mode === 'links') {
    if (outputLinksContainer) outputLinksContainer.style.display = 'block';
    if (outputRawContainer) outputRawContainer.style.display = 'none';
  } else {
    if (outputLinksContainer) outputLinksContainer.style.display = 'none';
    if (outputRawContainer) outputRawContainer.style.display = 'flex';
  }
}

/**
 * Enable or disable copy buttons and download action
 */
function setCopyButtonsState(enabled: boolean): void {
  if (btnCopyAll) btnCopyAll.disabled = !enabled;
  if (btnCopyMobile) btnCopyMobile.disabled = !enabled;
  if (btnDownload) btnDownload.style.display = enabled ? 'inline-flex' : 'none';
}

/**
 * Render interactive clickable links using safe DOM APIs (Zero-XSS) and DocumentFragment
 */
function renderInteractiveLinks(urls: string[]): void {
  if (!outputLinksList) return;
  outputLinksList.replaceChildren();

  const fragment = document.createDocumentFragment();

  urls.forEach((url, idx) => {
    const row = document.createElement('div');
    row.className = 'url-item-row';

    // Index number
    const indexBadge = document.createElement('span');
    indexBadge.className = 'url-item-index';
    indexBadge.textContent = `${idx + 1}`;

    // Hyperlink (Safe DOM: textContent & setAttribute prevent any injection)
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.className = 'url-link-item';
    anchor.textContent = url;
    anchor.title = `Buka ${url} di tab baru`;

    // Per-item copy button
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn-copy-single';
    copyBtn.title = 'Salin tautan ini';
    copyBtn.setAttribute('aria-label', `Salin tautan ${url}`);
    copyBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;

    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copySingleUrl(url, copyBtn);
    });

    row.appendChild(indexBadge);
    row.appendChild(anchor);
    row.appendChild(copyBtn);
    fragment.appendChild(row);
  });

  outputLinksList.appendChild(fragment);
}

/**
 * Copy a single URL with instant tactile feedback
 */
async function copySingleUrl(url: string, btnElement: HTMLButtonElement): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      const tempTextArea = document.createElement('textarea');
      tempTextArea.value = url;
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand('copy');
      document.body.removeChild(tempTextArea);
    }

    showToast('✓ Tautan disalin ke clipboard!');

    btnElement.classList.add('copied');
    btnElement.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    setTimeout(() => {
      btnElement.classList.remove('copied');
      btnElement.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;
    }, 1500);
  } catch (err) {
    console.error('Copy single URL error:', err);
    showToast('Gagal menyalin tautan.');
  }
}

/**
 * Smart Line Auto-Select on Textarea:
 * When tapping or clicking anywhere on a line, auto-select that entire URL line without dragging pins!
 */
function handleAutoSelectLine(e: MouseEvent | TouchEvent): void {
  const target = e.target as HTMLTextAreaElement;
  const pos = target.selectionStart;
  const text = target.value;
  if (!text) return;

  const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
  let lineEnd = text.indexOf('\n', pos);
  if (lineEnd === -1) lineEnd = text.length;

  if (lineEnd > lineStart) {
    target.setSelectionRange(lineStart, lineEnd);
  }
}

/**
 * Execute the URL extraction
 */
function handleExtract(notifyIfEmpty = false): void {
  if (!inputText || !urlCounter) return;

  const rawText = inputText.value.trim();
  if (!rawText) {
    currentUrls = [];
    if (outputText) outputText.value = '';
    if (outputLinksList) outputLinksList.replaceChildren();
    if (outputEmpty) outputEmpty.style.display = 'flex';
    if (outputLinksContainer) outputLinksContainer.style.display = 'none';
    if (outputRawContainer) outputRawContainer.style.display = 'none';
    setCopyButtonsState(false);
    urlCounter.textContent = '0 URL ditemukan';
    if (notifyIfEmpty) {
      showToast('Silakan masukkan teks terlebih dahulu.');
    }
    return;
  }

  const isDeduplicate = optDeduplicate ? optDeduplicate.checked : false;
  const result = extractUrls(rawText, { deduplicate: isDeduplicate });
  currentUrls = result.urls;

  if (currentUrls.length > 0) {
    // Populate raw textarea
    if (outputText) outputText.value = currentUrls.join('\n');

    // Populate interactive links list
    renderInteractiveLinks(currentUrls);

    // Switch view
    if (outputEmpty) outputEmpty.style.display = 'none';
    setViewMode(currentViewMode);

    setCopyButtonsState(true);
    urlCounter.textContent = `${result.totalExtracted.toLocaleString('id-ID')} URL ditemukan`;
    if (notifyIfEmpty) {
      showToast(`✓ Berhasil mengekstrak ${result.totalExtracted} URL`);
    }
  } else {
    currentUrls = [];
    if (outputText) outputText.value = '';
    if (outputLinksList) outputLinksList.replaceChildren();
    if (outputEmpty) outputEmpty.style.display = 'flex';
    if (outputLinksContainer) outputLinksContainer.style.display = 'none';
    if (outputRawContainer) outputRawContainer.style.display = 'none';
    setCopyButtonsState(false);
    urlCounter.textContent = '0 URL ditemukan';
    if (notifyIfEmpty) {
      showToast('Tidak ada URL yang ditemukan dalam teks.');
    }
  }
}

/**
 * Trigger live extraction with smooth micro-debounce
 */
function triggerLiveExtract(): void {
  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
  }
  debounceTimer = window.setTimeout(() => {
    handleExtract(false);
  }, 40);
}

/**
 * Copy all extracted URLs to clipboard
 */
async function handleCopyAll(): Promise<void> {
  const textToCopy = currentUrls.join('\n').trim();

  if (!textToCopy) {
    showToast('Tidak ada URL untuk disalin.');
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      if (outputText) {
        outputText.value = textToCopy;
        outputText.select();
        document.execCommand('copy');
      }
    }

    showToast(`✓ Semua ${currentUrls.length} URL berhasil disalin!`);

    // Tactile feedback on copy buttons
    const buttons = [btnCopyAll, btnCopyMobile].filter(Boolean) as HTMLButtonElement[];
    buttons.forEach((btn) => {
      const spanElem = btn.querySelector('span');
      const originalText = spanElem?.textContent || 'Salin Semua';
      if (spanElem) spanElem.textContent = 'Tersalin!';
      btn.style.backgroundColor = '#059669';
      btn.style.borderColor = '#059669';

      setTimeout(() => {
        if (spanElem) spanElem.textContent = originalText;
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
      }, 1500);
    });
  } catch (err) {
    console.error('Clipboard copy error:', err);
    showToast('Gagal menyalin otomatis, silakan salin manual.');
  }
}

/**
 * Quick Paste from clipboard
 */
async function handleQuickPaste(): Promise<void> {
  if (!inputText) return;

  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      if (!text) {
        showToast('Clipboard Anda kosong.');
        return;
      }
      inputText.value = text;
      updateCharCounter();
      handleExtract(false);
      showToast('Teks berhasil ditempel dari clipboard.');
    } else {
      inputText.focus();
      showToast('Gunakan pintasan Ctrl+V / Cmd+V untuk menempel.');
    }
  } catch {
    inputText.focus();
    showToast('Gunakan pintasan Ctrl+V / Cmd+V untuk menempel.');
  }
}

/**
 * Download extracted URLs as a .txt file
 */
function handleDownload(): void {
  const content = currentUrls.join('\n').trim();
  if (!content) return;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `extracted-urls-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('✓ Berkas .txt berhasil diunduh!');
}

/**
 * Load realistic sample text
 */
function handleSample(): void {
  if (!inputText) return;
  inputText.value = `Berikut adalah ringkasan referensi dan dokumentasi web terkini:
1. Dokumentasi Cloudflare Pages resmi: (https://developers.cloudflare.com/pages/), panduan lengkap CI/CD dan hosting statis.
2. Repositori portofolio GitHub: https://github.com/fatahilah-mr/portfolio dan artikel teknis di https://blog.fatah.web.id/posts/modern-web.
3. Contoh link pencarian: www.google.com/search?q=url+extractor&hl=id dan referensi RFC: (https://en.wikipedia.org/wiki/Uniform_Resource_Identifier).
4. Layanan bantuan dan kontak resmi ada di 'https://fatah.web.id/kontak'!`;

  updateCharCounter();
  handleExtract(false);
  showToast('Contoh teks berhasil dimuat.');
}

/**
 * Clear both input and output
 */
function handleClear(): void {
  if (inputText) inputText.value = '';
  currentUrls = [];
  if (outputText) outputText.value = '';
  if (outputLinksList) outputLinksList.replaceChildren();
  if (outputEmpty) outputEmpty.style.display = 'flex';
  if (outputLinksContainer) outputLinksContainer.style.display = 'none';
  if (outputRawContainer) outputRawContainer.style.display = 'none';
  setCopyButtonsState(false);
  if (urlCounter) urlCounter.textContent = '0 URL ditemukan';
  updateCharCounter();
  if (inputText) inputText.focus();
  showToast('Teks dibersihkan.');
}

// Event Listeners: Real-time automatic extraction
inputText?.addEventListener('input', () => {
  updateCharCounter();
  triggerLiveExtract();
});

inputText?.addEventListener('paste', () => {
  setTimeout(() => {
    updateCharCounter();
    handleExtract(false);
  }, 0);
});

// Tab Switchers
tabLinks?.addEventListener('click', () => setViewMode('links'));
tabRaw?.addEventListener('click', () => setViewMode('raw'));

// Smart Line Auto-Select on Raw Textarea
outputText?.addEventListener('click', handleAutoSelectLine);

// Buttons
btnPasteQuick?.addEventListener('click', handleQuickPaste);
btnCopyAll?.addEventListener('click', handleCopyAll);
btnCopyMobile?.addEventListener('click', handleCopyAll);
btnSample?.addEventListener('click', handleSample);
btnClear?.addEventListener('click', handleClear);
btnDownload?.addEventListener('click', handleDownload);

optDeduplicate?.addEventListener('change', () => {
  if (inputText && inputText.value.trim().length > 0) {
    handleExtract(false);
  }
});

// Keyboard Shortcut: Ctrl/Cmd + Shift + C to copy all
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
    e.preventDefault();
    handleCopyAll();
  }
});

// Initial counter update & state
updateCharCounter();
setViewMode('links');
