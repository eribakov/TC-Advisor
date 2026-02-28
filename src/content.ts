// pageText: var for 

// ============================================
// TYPES
// ============================================
interface TermsLink {
  text: string;
  href: string;
  score: number;
}

interface ScanResult {
  result?: string;
  error?: string;
  source?: string;
}

// ============================================
// STRATEGY 1: Is this page already a T&C page?
// ============================================
function isTermsPage(): boolean {
  const indicators: string[] = [
    'terms of service', 'terms and conditions', 'terms of use',
    'user agreement', 'legal agreement', 'privacy policy'
  ];
  const title = document.title.toLowerCase();
  const url = window.location.href.toLowerCase();
  const h1 = document.querySelector('h1')?.innerText.toLowerCase() ?? '';

  return indicators.some(kw => title.includes(kw) || url.includes(kw) || h1.includes(kw));
}

// ============================================
// STRATEGY 2: Find T&C section ON this page
// ============================================
function extractTermsFromPage(): string | null {
  const selectors: string[] = [
    '[id*="terms"]',      '[class*="terms"]',
    '[id*="tos"]',        '[class*="tos"]',
    '[id*="legal"]',      '[class*="legal"]',
    '[id*="agreement"]',  '[class*="agreement"]',
    '[id*="conditions"]', '[class*="conditions"]',
    'main', 'article', '.content', '#content', '#main'
  ];

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      const text = el.innerText.trim();
      if (text.length > 500) return cleanText(text);
    }
  }

  // Last resort: grab the biggest text block on the page
  const allDivs = Array.from(document.querySelectorAll<HTMLElement>('div, section, main'));
  const biggest = allDivs
    .map(el => ({ el, len: el.innerText.trim().length }))
    .sort((a, b) => b.len - a.len)[0];

  if (biggest && biggest.len > 500) return cleanText(biggest.el.innerText);

  return null;
}

// ============================================
// STRATEGY 3: Find T&C links anywhere on page
// ============================================
function findTermsLinks(): TermsLink[] {
  const allLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'));

  const scored: TermsLink[] = allLinks
    .map(link => {
      const text = link.innerText.toLowerCase().trim();
      const href = link.href.toLowerCase();
      let score = 0;

      if (text.includes('terms of service'))       score += 10;
      else if (text.includes('terms and conditions')) score += 10;
      else if (text.includes('terms of use'))       score += 8;
      else if (text.includes('user agreement'))     score += 8;
      else if (text.includes('terms'))              score += 5;
      else if (text.includes('legal'))              score += 3;

      if (href.includes('terms')) score += 3;
      if (href.includes('tos'))   score += 3;
      if (href.includes('legal')) score += 2;

      const inFooter = link.closest('footer, [id*="footer"], [class*="footer"]');
      if (inFooter) score += 2;

      return { text, href: link.href, score };
    })
    .filter(l => l.score > 0 && l.href && !l.href.startsWith('javascript'))
    .sort((a, b) => b.score - a.score);

  return scored;
}

// ============================================
// STRATEGY 4: Fetch a T&C page by URL
// ============================================
async function fetchTermsFromURL(url: string): Promise<string | null> {
  if (url === window.location.href) {
    return extractTermsFromPage();
  }

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'text/html' }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const noiseSelectors: string[] = [
      'script', 'style', 'nav', 'header', 'footer',
      'iframe', 'img', 'svg', '.cookie-banner',
      '[class*="cookie"]', '[class*="popup"]',
      '[class*="modal"]', '[class*="banner"]'
    ];
    noiseSelectors.forEach(sel => {
      doc.querySelectorAll(sel).forEach(el => el.remove());
    });

    const contentSelectors: string[] = [
      'main', 'article', '[id*="terms"]',
      '[class*="terms"]', '[id*="content"]', '.container', 'body'
    ];

    for (const sel of contentSelectors) {
      const el = doc.querySelector<HTMLElement>(sel);
      if (el) {
        const text = el.innerText?.trim() ?? '';
        if (text.length > 300) return cleanText(text);
      }
    }

    return cleanText(doc.body.innerText);

  } catch (err) {
    console.warn('[Terms Scanner] Fetch failed for', url, (err as Error).message);
    return null;
  }
}

// ============================================
// CLEAN & TRUNCATE TEXT
// ============================================
function cleanText(text: string): string {
  return text
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 15000);
}

// ============================================
// SEND TO BACKGROUND
// ============================================
async function sendToBackground(text: string, source: string): Promise<ScanResult> {
  console.log(`[Terms Scanner] Sending ${text.length} chars from: ${source}`);

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'callGemini', text, source }, resolve);
  });
}

// ============================================
// MASTER SCAN FUNCTION
// ============================================
async function scanForTerms(): Promise<ScanResult> {
  console.log('[Terms Scanner] Starting scan on:', window.location.href);

  // Strategy 1: Already on a T&C page?
  if (isTermsPage()) {
    console.log('[Terms Scanner] Already on T&C page');
    const text = extractTermsFromPage() ?? cleanText(document.body.innerText);
    if (text) return await sendToBackground(text, 'Current page');
  }

  // Strategy 2: T&C section embedded on this page?
  const embeddedText = extractTermsFromPage();
  if (embeddedText) {
    console.log('[Terms Scanner] Found embedded T&C section');
    return await sendToBackground(embeddedText, 'Embedded section');
  }

  // Strategy 3: Find and follow a T&C link
  const links = findTermsLinks();
  console.log('[Terms Scanner] Candidate links found:', links);

  if (links.length > 0) {
    const bestLink = links[0];
    console.log('[Terms Scanner] Best link:', bestLink);

    const fetchedText = await fetchTermsFromURL(bestLink.href);
    if (fetchedText) {
      return await sendToBackground(fetchedText, bestLink.href);
    }
  }

  return {
    error: 'Could not find Terms & Conditions on this page. Try navigating directly to the T&C page and scanning again.'
  };
}

// ============================================
// LISTEN FOR POPUP TRIGGER
// ============================================
chrome.runtime.onMessage.addListener((
  msg: { action: string },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: ScanResult) => void
) => {
  if (msg.action === 'scan') {
    scanForTerms().then(sendResponse);
    return true;
  }
});

console.log('[Terms Scanner] Content script loaded on:', window.location.href);