import { handleDeleteAccount, handleOptOut } from '../analyzer';

export function showEmailButtons(analysis: any, companyName: string) {
  const userInfo = {
    companyName,
    userName: "PLACEHOLDER",      // replace with real input later
    userEmail: "PLACEHOLDER@email.com" // replace with real input later
  };

  // Create buttons container
  const container = document.createElement('div');
  container.id = 'email-buttons';

  // Delete account button
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete My Account & Data';
  deleteBtn.addEventListener('click', async () => {
    const email = await handleDeleteAccount(analysis, userInfo);
    window.open(`mailto:?subject=${email.subject}&body=${encodeURIComponent(email.body)}`);
  });

  // Opt out button
  const optOutBtn = document.createElement('button');
  optOutBtn.textContent = 'Opt Out of Data Sharing';
  optOutBtn.addEventListener('click', async () => {
    const email = await handleOptOut(analysis, userInfo);
    window.open(`mailto:?subject=${email.subject}&body=${encodeURIComponent(email.body)}`);
  });

  container.appendChild(deleteBtn);
  container.appendChild(optOutBtn);

  // Inject into popup
  document.body.appendChild(container);
}