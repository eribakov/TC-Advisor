// Load saved key on open
chrome.storage.local.get('geminiApiKey', (result) => {
  const input = document.getElementById('api-key-input') as HTMLInputElement;
  if (result.geminiApiKey) {
    input.value = result.geminiApiKey as string ?? '';
  }
});

// Save key on button click
document.getElementById('save-btn')?.addEventListener('click', () => {
  const input = document.getElementById('api-key-input') as HTMLInputElement;
  const key = input.value.trim();
  chrome.storage.local.set({ geminiApiKey: key }, () => {
    const status = document.getElementById('status');
    if (status) status.textContent = '✅ Key saved!';
    setTimeout(() => { if (status) status.textContent = ''; }, 2000);
  });
});