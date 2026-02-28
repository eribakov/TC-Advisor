console.log("Background script running");

async function callGemini(termsText) {
  try {
    const response = await fetch('https://your-server.com/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: termsText })
    });

    const data = await response.json();
    if (data.error) return { error: data.error };
    return { result: data.result, source: data.source };

  } catch (err) {
    return { error: 'Failed to reach server: ' + err.message };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'callGemini') {
    callGemini(msg.text, msg.source).then(sendResponse);
    return true;
  }
});
