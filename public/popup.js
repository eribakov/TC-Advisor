/**
 * Tackl — Popup script
 * Handles current tab context, scan action, and advice list hooks.
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
   * Get the current active tab.
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
   * Set scanning state.
   */
  function setScanning(scanning) {
    if (DOM.pageContext) DOM.pageContext.setAttribute('data-state', scanning ? 'scanning' : 'ready');
    if (DOM.btnScan) DOM.btnScan.textContent = scanning ? 'Scanning…' : 'Scan this page';
  }

  /**
   * Clear placeholders and replace with advice items.
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
   * Show default/general advice when no scan has been run.
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
   * Display scan results from Gemini JSON response.
   */
  function showScanResult(result) {
    try {
      const data = typeof result === 'string' ? JSON.parse(result) : result;

      if (data?.risks?.length) {
        const items = data.risks.map((r) => {
          const severity = r.severity ? `[${r.severity.toUpperCase()}] ` : '';
          const risk = r.risk || '';
          const description = r.description || '';
          const solution = r.solution ? ` → ${r.solution}` : '';
          return `${severity}${risk}: ${description}${solution}`.trim();
        }).filter(Boolean);
        setAdvice('before', items);
      }

      if (data?.ghostMode?.length) {
        const items = data.ghostMode.map((g) => {
          const title = g.title || '';
          const steps = g.steps || '';
          return `${title}: ${steps}`.trim();
        }).filter(Boolean);
        setAdvice('after', items);
      }

      if (!data?.risks?.length && !data?.ghostMode?.length) showDefaultAdvice();

    } catch {
      setAdvice('before', [String(result || 'Analysis complete.')]);
      showDefaultAdvice();
    }
  }

  /**
   * Scan button click handler.
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

      const response = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: 'scan' }, (res) => {
          resolve(chrome.runtime.lastError ? { error: chrome.runtime.lastError.message } : res);
        });
      });

      if (response?.source) {
        if (DOM.scanStatus) DOM.scanStatus.textContent = `✅ Found T&C from: ${response.source}`;
      }

      if (response?.result) {
        showScanResult(response.result);
      } else if (response?.error) {
        if (DOM.scanStatus) DOM.scanStatus.textContent = response.error;
        showDefaultAdvice();
      } else {
        showDefaultAdvice();
      }

    } catch (e) {
      showDefaultAdvice();
    } finally {
      setScanning(false);
    }
  }

  /**
   * Settings button handler.
   */
  function onSettingsClick() {
    console.log('Settings clicked');
  }

  function init() {
    updatePageContext();
    showDefaultAdvice();

    DOM.btnScan?.addEventListener('click', onScanClick);
    DOM.btnSettings?.addEventListener('click', onSettingsClick);

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