/**
 * T&C Advisor — Popup script
 * Handles current tab context, scan action, and advice list hooks for future features.
 */
import '../public/popup.css';
import { showEmailButtons } from './components/emailButtons';

(function () {
  const DOM = {
    pageContext: document.getElementById('page-context')!,
    currentDomain: document.getElementById('current-domain')!,
    btnScan: document.getElementById('btn-scan')!,
    scanStatus: document.getElementById('scan-status')!,
    adviceBefore: document.getElementById('advice-before')!,
    placeholderBefore: document.getElementById('placeholder-before')!,
    adviceAfter: document.getElementById('advice-after')!,
    placeholderAfter: document.getElementById('placeholder-after')!,
    btnSettings: document.getElementById('btn-settings')!,
    linkHelp: document.getElementById('link-help')!,
  };

  /**
   * Get the current active tab (for popup open in that tab's context).
   */
  function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0] || null);
    });
  });
}

  /**
   * Derive a short domain label from a URL for display.
   */
  function getDomainFromUrl(url: string) {
    if (!url || url.startsWith('chrome://') || url.startsWith('edge://')) return null;
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }

  /**
   * Update the header to show the current page's domain.
   */
  async function updatePageContext() {
    const tab = await getCurrentTab();
    const domain = tab ? getDomainFromUrl(tab.url ?? '') : null;    DOM.currentDomain.textContent = domain || '—';
    if (domain) {
      DOM.pageContext.setAttribute('data-state', 'ready');
    } else {
      DOM.pageContext.setAttribute('data-state', 'idle');
    }
  }

  /**
   * Set scanning state (for when "Scan this page" runs).
   */
  function setScanning(scanning: boolean) {
    if (DOM.pageContext) DOM.pageContext.setAttribute('data-state', scanning ? 'scanning' : 'ready');
    if (DOM.btnScan) DOM.btnScan.textContent = scanning ? 'Scanning…' : 'Scan this page';
  }

  /**
   * Clear placeholders and optionally replace with advice items.
   * @param { 'before' | 'after' } listId
   * @param { string[] } items - Array of advice text strings
   */
  function setAdvice(listId: 'before' | 'after', items: string[]) {
    const list = listId === 'before' ? DOM.adviceBefore : DOM.adviceAfter;
    const placeholder = listId === 'before' ? DOM.placeholderBefore : DOM.placeholderAfter;

    if (!items || items.length === 0) {
      placeholder.style.display = '';
      list.querySelectorAll('.advice-list__item').forEach((el) => el.remove());
      return;
    }

    placeholder.style.display = 'none';
    list.querySelectorAll('.advice-list__item').forEach((el) => el.remove());

    items.forEach((text) => {
      const li = document.createElement('li');
      li.className = 'advice-list__item';
      li.textContent = text;
      list.appendChild(li);
    });
  }

  /**
   * Show default/general advice when no scan has been run (optional).
   */
  function showDefaultAdvice() {
    const before = [
      'Check how and when you can cancel (link, account page, or support).',
      'Look for auto-renewal and billing frequency (monthly vs yearly).',
      'Save or screenshot the terms and cancellation policy for your records.',
    ];
    const after = [
      'Set a calendar reminder before the next renewal if you might cancel.',
      'Save your confirmation email or receipt with the date you agreed.',
      'Bookmark the cancellation or account management page for quick access.',
    ];
    setAdvice('before', before);
    setAdvice('after', after);
  }

  /**
   * Scan button click — message content script to scan page, then show response.
   */
  async function onScanClick() {
    if (DOM.scanStatus) DOM.scanStatus.textContent = '';
    setScanning(true);
    try {
      const tab = await getCurrentTab();
      if (!tab?.id) {
        if (DOM.scanStatus) DOM.scanStatus.textContent = 'Could not access this tab.';
        showDefaultAdvice();
        return;
      }
      const response = await new Promise<any>((resolve) => {
        chrome.tabs.sendMessage(tab.id!, { action: 'scan' }, (res) => {
          resolve(chrome.runtime.lastError ? { error: chrome.runtime.lastError.message } : res as any);
        });
      });
      console.log('Scan response:', response);
      if ((response as any)?.source) {
        if (DOM.scanStatus) DOM.scanStatus.textContent = `✅ Found T&C from: ${response.source}`;
      }
      if ((response as any)?.result) {
  showScanResult((response as any).result);
}
if (!(response as any)?.result && !(response as any)?.error) showDefaultAdvice();
else if ((response as any)?.error) {
  if (DOM.scanStatus) DOM.scanStatus.textContent = (response as any).error;
  showDefaultAdvice();
}
    } catch (e) {
      showDefaultAdvice();
    } finally {
      setScanning(false);
    }
  }

  function showScanResult(result: any) {
  console.log('showScanResult called with:', result);
  try {
    const data = typeof result === 'string' ? JSON.parse(result) : result;
    console.log('parsed data:', data);
    console.log('risks:', data?.risks);
    console.log('ghostMode:', data?.ghostMode);
    if (data?.risks?.length) {
      const items = data.risks.map((r: any) => (r.risk || r.description || '').trim()).filter(Boolean);
      console.log('risk items:', items);
      setAdvice('before', items);
    }
    if (data?.ghostMode?.length) {
      const items = data.ghostMode.map((g: any) => (g.title || g.steps || '').trim()).filter(Boolean);
      console.log('ghost items:', items);
      setAdvice('after', items);
    }
    if (!data?.risks?.length && !data?.ghostMode?.length) showDefaultAdvice();
    showEmailButtons(data, DOM.currentDomain.textContent ?? "Unknown");
  } catch(e) {
    console.log('showScanResult error:', e);
    setAdvice('before', [String(result || 'Analysis complete.')]);
    showDefaultAdvice();
  }
}

  /**
   * Settings — placeholder for future options page or popup panel.
   */
  function onSettingsClick() {
  document.getElementById('view-main')!.classList.remove('view--active');
  document.getElementById('view-settings')!.classList.add('view--active');

  // Load saved key
  chrome.storage.local.get('geminiApiKey', (result) => {
    const input = document.getElementById('api-key-input') as HTMLInputElement;
    if (result.geminiApiKey) input.value = result.geminiApiKey as string;
  });
}

// Add these in your init() function:
document.getElementById('btn-back')?.addEventListener('click', () => {
  document.getElementById('view-settings')!.classList.remove('view--active');
  document.getElementById('view-main')!.classList.add('view--active');
});

document.getElementById('save-btn')?.addEventListener('click', () => {
  const input = document.getElementById('api-key-input') as HTMLInputElement;
  chrome.storage.local.set({ geminiApiKey: input.value.trim() }, () => {
    const status = document.getElementById('settings-status')!;
    status.textContent = '✅ Key saved!';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
});

  function init() {
    updatePageContext();
    showDefaultAdvice();

    DOM.btnScan?.addEventListener('click', onScanClick);
    DOM.btnSettings?.addEventListener('click', onSettingsClick);

    // Expose for future use (e.g. from background or content script)
    (window as any).TCAdvisor = {
      setAdvice,
      setScanning,
      getCurrentTab,
      getDomainFromUrl,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
