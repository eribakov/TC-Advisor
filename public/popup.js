/**
 * T&C Advisor — Popup script
 * Handles current tab context, scan action, and advice list hooks for future features.
 */

(function () {
  const DOM = {
    pageContext: document.getElementById('page-context'),
    currentDomain: document.getElementById('current-domain'),
    btnScan: document.getElementById('btn-scan'),
    scanStatus: document.getElementById('scan-status'),
    adviceBefore: document.getElementById('advice-before'),
    placeholderBefore: document.getElementById('placeholder-before'),
    adviceAfter: document.getElementById('advice-after'),
    placeholderAfter: document.getElementById('placeholder-after'),
    btnSettings: document.getElementById('btn-settings'),
    linkHelp: document.getElementById('link-help'),
  };

  /**
   * Get the current active tab (for popup open in that tab's context).
   */
  function getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0] || null);
      });
    });
  }

  /**
   * Derive a short domain label from a URL for display.
   */
  function getDomainFromUrl(url) {
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
    const domain = tab ? getDomainFromUrl(tab.url) : null;
    DOM.currentDomain.textContent = domain || '—';
    if (domain) {
      DOM.pageContext.setAttribute('data-state', 'ready');
    } else {
      DOM.pageContext.setAttribute('data-state', 'idle');
    }
  }

  /**
   * Set scanning state (for when "Scan this page" runs).
   */
  function setScanning(scanning) {
    DOM.pageContext.setAttribute('data-state', scanning ? 'scanning' : 'ready');
    DOM.btnScan.textContent = scanning ? 'Scanning…' : 'Scan this page';
  }

  /**
   * Clear placeholders and optionally replace with advice items.
   * @param { 'before' | 'after' } listId
   * @param { string[] } items - Array of advice text strings
   */
  function setAdvice(listId, items) {
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
   * Scan button click — message background to analyze page, then show response and advice.
   */
  async function onScanClick() {
    if (DOM.scanStatus) DOM.scanStatus.textContent = '';
    setScanning(true);
    try {
      const tab = await getCurrentTab();
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'callGemini', text: tab?.url ?? '', source: undefined },
          resolve
        );
      });
      if (response?.source) {
        if (DOM.scanStatus) DOM.scanStatus.textContent = `✅ Found T&C from: ${response.source}`;
      }
      if (response?.result) {
        // TODO: parse response.result and call setAdvice with before/after lists
      }
      if (!response?.result && !response?.error) showDefaultAdvice();
      else if (response?.error) showDefaultAdvice();
    } catch (e) {
      showDefaultAdvice();
    } finally {
      setScanning(false);
    }
  }

  /**
   * Settings — placeholder for future options page or popup panel.
   */
  function onSettingsClick() {
    // TODO: open options page or in-popup settings
    console.log('Settings clicked');
  }

  function init() {
    updatePageContext();
    showDefaultAdvice();

    DOM.btnScan.addEventListener('click', onScanClick);
    DOM.btnSettings.addEventListener('click', onSettingsClick);

    // Expose for future use (e.g. from background or content script)
    window.TCAdvisor = {
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
