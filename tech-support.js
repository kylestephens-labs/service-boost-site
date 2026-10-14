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
const dialog = document.getElementById('tech-help');
if (dialog) initializeTechHelp();
function initializeTechHelp() {
  const form = document.getElementById('tech-help-form');
  const fields = document.getElementById('help-fields');
  const service = document.getElementById('help-service');
  const reply = document.getElementById('help-reply');
  const phone = document.getElementById('help-phone');
  const email = document.getElementById('help-email');
  const status = document.getElementById('help-status');
  const submit = document.getElementById('help-submit');
  const serviceIds = new Set(Array.from(service.options, option => option.value));
  let returnFocus = null;
  let sending = false;
  let ready = false;

  function updateService() {
    document.querySelectorAll('[data-service-detail]').forEach(section => {
      section.hidden = section.dataset.serviceDetail !== service.value;
    });
  }
  function updateReply() {
    const byEmail = reply.value === 'email';
    document.getElementById('phone-field').hidden = byEmail;
    document.getElementById('email-field').hidden = !byEmail;
    phone.required = !byEmail;
    email.required = byEmail;
    phone.disabled = byEmail;
    email.disabled = !byEmail;
  }
  async function checkAvailability() {
    if (ready || sending) return;
    submit.disabled = true;
    status.textContent = 'Checking form availability…';
    try {
      const endpoint = new URL(window.SERVICE_BOOST_QUOTE_ENDPOINT);
      endpoint.pathname = '/tech-help-ready';
      endpoint.search = '';
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000), credentials: 'omit' });
      const data = await response.json();
      ready = response.ok && data.message === 'tech_support_v1';
    } catch { ready = false; }
    submit.disabled = !ready;
    status.textContent = ready ? '' : 'The request form is unavailable right now. Please call or text Kyle, or close and reopen to try again.';
  }
  function openDialog(id, trigger) {
    if (!serviceIds.has(id) && id !== 'tech-help') return;
    returnFocus = trigger || null;
    if (!sending) {
      if (ready) status.textContent = '';
      service.value = serviceIds.has(id) ? id : 'help';
      updateService();
    }
    if (!dialog.open) dialog.showModal();
    checkAvailability();
  }
  document.querySelectorAll('[data-dialog]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      openDialog(link.dataset.dialog, link);
    });
  });
  dialog.addEventListener('close', () => {
    returnFocus?.focus();
    returnFocus = null;
    if (serviceIds.has(location.hash.slice(1)) || location.hash === '#tech-help') {
      history.replaceState(null, '', location.pathname + location.search);
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  service.addEventListener('change', updateService);
  reply.addEventListener('change', updateReply);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !ready || !form.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(form));
    payload.project_type = 'tech_support';
    sending = true;
    fields.disabled = true;
    status.textContent = 'Sending your request…';
    try {
      const response = await fetch(window.SERVICE_BOOST_QUOTE_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'omit', body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000)
      });
      if (!response.ok) {
        status.textContent = response.status === 400
          ? 'Please check your contact details and describe the issue in at least 10 characters.'
          : response.status === 429
            ? 'Too many requests. Please call or text Kyle, or try again later.'
            : 'We could not confirm delivery. Your details are still here. Please call or text Kyle before retrying.';
        return;
      }
      const selected = service.value;
      const preferredReply = reply.value;
      form.reset();
      service.value = selected;
      reply.value = preferredReply;
      updateReply();
      status.textContent = 'Thanks! Your request has been sent. Kyle will follow up using your preferred reply method. This does not book an appointment.';
    } catch {
      status.textContent = 'We could not confirm delivery. Your details are still here. Please call or text Kyle before retrying.';
    } finally {
      sending = false;
      fields.disabled = false;
    }
  });
  function openFromHash() {
    if (!routeLegacy()) openDialog(location.hash.slice(1));
  }
  updateService();
  updateReply();
  window.addEventListener('hashchange', openFromHash);
  if (location.hash && !legacyFragments.has(location.hash)) openFromHash();
}
