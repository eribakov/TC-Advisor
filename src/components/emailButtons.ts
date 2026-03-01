import { handleDeleteAccount, handleOptOut } from '../analyzer';

export function showEmailButtons(analysis: any, companyName: string) {

  // Don't add buttons twice if already exists
  if (document.getElementById('email-buttons')) return;

  const container = document.createElement('div');
  container.id = 'email-buttons';

  // Input form + buttons
  container.innerHTML = `
    <div id="user-info-form">
      <input id="input-name" type="text" placeholder="Your full name" />
      <input id="input-email" type="email" placeholder="Your email" />
      <button id="deleteBtn">Delete My Account & Data</button>
      <button id="optOutBtn">Opt Out of Data Sharing</button>
    </div>
  `;

  document.body.appendChild(container);

  // Helper to get user info from inputs
  function getUserInfo() {
    return {
      companyName,
      userName: (document.getElementById('input-name') as HTMLInputElement).value || 'Unknown',
      userEmail: (document.getElementById('input-email') as HTMLInputElement).value || 'Unknown',
    };
  }

  document.getElementById('deleteBtn')?.addEventListener('click', async () => {
    const email = await handleDeleteAccount(analysis, getUserInfo());
    window.open(`mailto:${analysis.optOutEmail}?subject=${email.subject}&body=${encodeURIComponent(email.body)}`);
  });

  document.getElementById('optOutBtn')?.addEventListener('click', async () => {
    const email = await handleOptOut(analysis, getUserInfo());
    window.open(`mailto:${analysis.optOutEmail}?subject=${email.subject}&body=${encodeURIComponent(email.body)}`);
  });
}