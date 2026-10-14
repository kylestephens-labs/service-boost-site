// Preserve legacy website-design links after moving that offering.
const legacyFragments = new Set(['#request', '#examples', '#package', '#faq', '#contact']);
const conceptNames = new Set(['landscape', 'salon', 'auto-repair', 'restaurant', 'dental', 'contractor', 'real-estate']);
function routeLegacy() {
  const query = new URLSearchParams(location.search);
  if (!legacyFragments.has(location.hash) && !conceptNames.has(query.get('concept'))) return false;
  const target = new URL('/web-design', location.origin);
  if (conceptNames.has(query.get('concept'))) target.searchParams.set('concept', query.get('concept'));
  if (/^[A-Za-z0-9_-]{32}$/.test(query.get('ref') || '')) target.searchParams.set('ref', query.get('ref'));
  target.hash = location.hash || '#request';
  location.replace(target.href);
  return true;
}
routeLegacy();
let returnFocus = null;
function openDialog(id, trigger) {
  const dialog = document.getElementById(id);
  if (!(dialog instanceof HTMLDialogElement)) return;
  document.querySelectorAll('dialog[open]').forEach(open => { if (open !== dialog) open.close(); });
  returnFocus = trigger || null;
  if (!dialog.open) dialog.showModal();
}
document.querySelectorAll('[data-dialog]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    openDialog(link.dataset.dialog, link);
  });
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => {
    returnFocus?.focus();
    returnFocus = null;
    if (location.hash === '#' + dialog.id) history.replaceState(null, '', location.pathname + location.search);
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});
function openFromHash() {
  if (!routeLegacy()) openDialog(location.hash.slice(1));
}
window.addEventListener('hashchange', openFromHash);
if (location.hash && !legacyFragments.has(location.hash)) openFromHash();
