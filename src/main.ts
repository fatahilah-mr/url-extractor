import { extractUrls } from './parser';

// DOM Element references
const inputText = document.getElementById('input-text') as HTMLTextAreaElement | null;
const outputText = document.getElementById('output-text') as HTMLTextAreaElement | null;
const outputEmpty = document.getElementById('output-empty') as HTMLElement | null;
const charCounter = document.getElementById('char-counter') as HTMLElement | null;
const urlCounter = document.getElementById('url-counter') as HTMLElement | null;
const btnExtractDesktop = document.getElementById('btn-extract-desktop') as HTMLButtonElement | null;
const btnExtractMobile = document.getElementById('btn-extract-mobile') as HTMLButtonElement | null;
const btnCopyAll = document.getElementById('btn-copy-all') as HTMLButtonElement | null;
const btnSample = document.getElementById('btn-sample') as HTMLButtonElement | null;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement | null;
const btnDownload = document.getElementById('btn-download') as HTMLButtonElement | null;
const optDeduplicate = document.getElementById('opt-deduplicate') as HTMLInputElement | null;
const toast = document.getElementById('toast') as HTMLElement | null;
const toastMessage = document.getElementById('toast-message') as HTMLElement | null;

let toastTimeout: number | undefined;

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
 * Execute the URL extraction
 */
function handleExtract(notifyIfEmpty = true): void {
  if (!inputText || !outputText || !outputEmpty || !urlCounter || !btnCopyAll) return;

  const rawText = inputText.value.trim();
  if (!rawText) {
    outputText.value = '';
    outputText.style.display = 'none';
    outputEmpty.style.display = 'flex';
    btnCopyAll.disabled = true;
    if (btnDownload) btnDownload.style.display = 'none';
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
    btnCopyAll.disabled = false;
    if (btnDownload) btnDownload.style.display = 'inline-flex';
    urlCounter.textContent = `${result.totalExtracted.toLocaleString('id-ID')} URL ditemukan`;
    showToast(`✓ Berhasil mengekstrak ${result.totalExtracted} URL`);
  } else {
    outputText.value = '';
    outputText.style.display = 'none';
    outputEmpty.style.display = 'flex';
    btnCopyAll.disabled = true;
    if (btnDownload) btnDownload.style.display = 'none';
    urlCounter.textContent = '0 URL ditemukan';
    if (notifyIfEmpty) {
      showToast('Tidak ada URL yang ditemukan dalam teks.');
    }
  }
}

/**
 * Copy all extracted URLs to clipboard
 */
async function handleCopyAll(): Promise<void> {
  if (!outputText || !btnCopyAll) return;
  const textToCopy = outputText.value.trim();

  if (!textToCopy) {
    showToast('Tidak ada URL untuk disalin.');
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      // Fallback for non-secure contexts or older browsers
      outputText.select();
      document.execCommand('copy');
    }

    showToast('✓ Semua URL berhasil disalin ke clipboard!');

    // Subtle tactile feedback on the copy button
    const originalText = btnCopyAll.querySelector('span')?.textContent || 'Salin Semua';
    const spanElem = btnCopyAll.querySelector('span');
    if (spanElem) spanElem.textContent = 'Tersalin!';
    btnCopyAll.style.backgroundColor = '#059669';
    btnCopyAll.style.borderColor = '#059669';

    setTimeout(() => {
      if (spanElem) spanElem.textContent = originalText;
      btnCopyAll.style.backgroundColor = '';
      btnCopyAll.style.borderColor = '';
    }, 1500);
  } catch (err) {
    console.error('Clipboard copy error:', err);
    showToast('Gagal menyalin otomatis, silakan salin manual.');
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
  if (btnCopyAll) btnCopyAll.disabled = true;
  if (btnDownload) btnDownload.style.display = 'none';
  if (urlCounter) urlCounter.textContent = '0 URL ditemukan';
  updateCharCounter();
  if (inputText) inputText.focus();
  showToast('Teks dibersihkan.');
}

// Event Listeners
inputText?.addEventListener('input', updateCharCounter);

btnExtractDesktop?.addEventListener('click', () => handleExtract(true));
btnExtractMobile?.addEventListener('click', () => handleExtract(true));
btnCopyAll?.addEventListener('click', handleCopyAll);
btnSample?.addEventListener('click', handleSample);
btnClear?.addEventListener('click', handleClear);
btnDownload?.addEventListener('click', handleDownload);

optDeduplicate?.addEventListener('change', () => {
  if (inputText && inputText.value.trim().length > 0 && outputText && outputText.value) {
    handleExtract(false);
  }
});

// Keyboard Shortcuts: Ctrl/Cmd + Enter to extract
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleExtract(true);
  }
});

// Initial counter update
updateCharCounter();
