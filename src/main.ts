import { extractUrls } from './parser';

// DOM Element references
const inputText = document.getElementById('input-text') as HTMLTextAreaElement | null;
const outputText = document.getElementById('output-text') as HTMLTextAreaElement | null;
const outputEmpty = document.getElementById('output-empty') as HTMLElement | null;
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
 * Enable or disable copy buttons and download action
 */
function setCopyButtonsState(enabled: boolean): void {
  if (btnCopyAll) btnCopyAll.disabled = !enabled;
  if (btnCopyMobile) btnCopyMobile.disabled = !enabled;
  if (btnDownload) btnDownload.style.display = enabled ? 'inline-flex' : 'none';
}

/**
 * Execute the URL extraction
 */
function handleExtract(notifyIfEmpty = false): void {
  if (!inputText || !outputText || !outputEmpty || !urlCounter) return;

  const rawText = inputText.value.trim();
  if (!rawText) {
    outputText.value = '';
    outputText.style.display = 'none';
    outputEmpty.style.display = 'flex';
    setCopyButtonsState(false);
    urlCounter.textContent = '0 URL ditemukan';
    if (notifyIfEmpty) {
      showToast('Silakan masukkan teks terlebih dahulu.');
    }
    return;
  }

  const isDeduplicate = optDeduplicate ? optDeduplicate.checked : false;
  const result = extractUrls(rawText, { deduplicate: isDeduplicate });

  if (result.urls.length > 0) {
    outputText.value = result.urls.join('\n');
    outputText.style.display = 'block';
    outputEmpty.style.display = 'none';
    setCopyButtonsState(true);
    urlCounter.textContent = `${result.totalExtracted.toLocaleString('id-ID')} URL ditemukan`;
    if (notifyIfEmpty) {
      showToast(`✓ Berhasil mengekstrak ${result.totalExtracted} URL`);
    }
  } else {
    outputText.value = '';
    outputText.style.display = 'none';
    outputEmpty.style.display = 'flex';
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
  if (!outputText) return;
  const textToCopy = outputText.value.trim();

  if (!textToCopy) {
    showToast('Tidak ada URL untuk disalin.');
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      outputText.select();
      document.execCommand('copy');
    }

    showToast('✓ Semua URL berhasil disalin ke clipboard!');

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
  if (!outputText) return;
  const content = outputText.value.trim();
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

  showToast('✓ File .txt berhasil diunduh!');
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
  if (outputText) outputText.value = '';
  if (outputText) outputText.style.display = 'none';
  if (outputEmpty) outputEmpty.style.display = 'flex';
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

// Initial counter update
updateCharCounter();
