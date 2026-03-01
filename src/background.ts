import { scanTerms } from './analyzer';
console.log("Background script running");

async function callGemini(termsText: string, _source?: string): Promise<{ result?: string; error?: string; source?: string }> {
  try {
    const data = await scanTerms(termsText);
    return { result: JSON.stringify(data) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: 'Failed to reach server: ' + message };
  }
}

chrome.runtime.onMessage.addListener((msg: { action?: string; text?: string; source?: string }, _sender, sendResponse) => {
  if (msg.action === 'callGemini') {
    callGemini(msg.text ?? '', msg.source).then((result) => {
      sendResponse(result);
    });
    return true; // keeps the channel open for async response
  }
});