// Presentation only. Production quote validation/delivery stays in app.js.
// Carry only the validated outreach reference through portfolio round trips.
// Removing ref from the current URL remains an opt-out; never recover it from storage.
const navigationRef = new URLSearchParams(location.search).get('ref');
if (/^[A-Za-z0-9_-]{32}$/.test(navigationRef || '')) {
  document.querySelectorAll('[data-preserve-ref]').forEach(link => {
    const target = new URL(link.getAttribute('href'), location.href);
    if (target.origin !== location.origin) return;
    // Preserve only known concept service choices alongside the validated ref.
    const service = target.searchParams.get('service');
    target.search = '';
    if (['maintenance', 'diagnostics', 'repair'].includes(service)) target.searchParams.set('service', service);
    target.searchParams.set('ref', navigationRef);
    link.href = target.pathname + target.search + target.hash;
  });
}

const quoteDialog = document.querySelector('#request');
const openQuote = () => {
  if (quoteDialog && !quoteDialog.open) quoteDialog.showModal();
};
document.querySelectorAll('[data-open-quote]').forEach(button => {
  button.addEventListener('click', openQuote);
});
if (location.hash === '#request') openQuote();
window.addEventListener('hashchange', () => {
  if (location.hash === '#request') openQuote();
});

const projectDialog = document.querySelector('#project-details');
document.querySelectorAll('[data-open-project]').forEach(button => {
  button.addEventListener('click', () => {
    if (projectDialog && !projectDialog.open) projectDialog.showModal();
  });
});

const demoDialog = document.querySelector('#demo-dialog');
const demoForm = document.querySelector('#demo-form');
const demoStatus = document.querySelector('#demo-status');
const demoActions = document.querySelector('.demo-actions');
const resetDemo = () => {
  demoForm.reset();
  demoForm.hidden = false;
  demoStatus.hidden = true;
  demoStatus.textContent = '';
  if (demoActions) demoActions.hidden = true;
  const service = new URLSearchParams(location.search).get('service');
  const serviceField = demoForm.elements.namedItem('service');
  if (serviceField && ['maintenance', 'diagnostics', 'repair'].includes(service)) serviceField.value = service;
};
document.querySelectorAll('[data-open-demo]').forEach(button => {
  button.addEventListener('click', () => {
    if (!demoDialog || demoDialog.open) return;
    resetDemo();
    demoDialog.showModal();
  });
});
if (demoDialog) demoDialog.addEventListener('close', resetDemo);
document.querySelector('[data-edit-demo]')?.addEventListener('click', () => {
  demoForm.hidden = false;
  demoStatus.hidden = true;
  demoActions.hidden = true;
  demoForm.querySelector('input,select,textarea').focus();
});
document.querySelector('[data-reset-demo]')?.addEventListener('click', () => {
  resetDemo();
  demoForm.querySelector('input,select,textarea').focus();
});
if (demoForm) demoForm.addEventListener('submit', event => {
  event.preventDefault();
  demoForm.hidden = true;
  demoStatus.hidden = false;
  demoStatus.textContent = 'Preview complete. Nothing was sent, saved or booked. This is a fictional business demonstration.';
  if (demoActions) demoActions.hidden = false;
  demoStatus.focus();
});
