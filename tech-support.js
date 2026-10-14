// Keep old website-design arrivals separate from tech support requests.
const legacyFragments = new Set(['#request', '#examples', '#package', '#faq', '#contact']);
const conceptNames = new Set(['landscape', 'salon', 'auto-repair', 'restaurant', 'dental', 'contractor', 'real-estate']);
const serviceIcons = {
  help: 'message-circle', wifi: 'wifi', workspace: 'device-desktop',
  computer: 'device-laptop', printer: 'printer', mobile: 'device-mobile', 'smart-home': 'smart-home'
};
function routeArrival() {
  if (location.pathname !== '/' && location.pathname !== '/index.html') return false;
  const query = new URLSearchParams(location.search);
  if (legacyFragments.has(location.hash) || conceptNames.has(query.get('concept'))) {
    const target = new URL('/web-design', location.origin);
    if (conceptNames.has(query.get('concept'))) target.searchParams.set('concept', query.get('concept'));
    if (/^[A-Za-z0-9_-]{32}$/.test(query.get('ref') || '')) target.searchParams.set('ref', query.get('ref'));
    target.hash = location.hash || '#request';
    location.replace(target.href);
    return true;
  }
  const service = location.hash.slice(1);
  if (Object.hasOwn(serviceIcons, service) || service === 'tech-help') {
    const target = new URL('/request-help', location.origin);
    if (service !== 'tech-help' && service !== 'help') target.searchParams.set('service', service);
    location.replace(target.href);
    return true;
  }
  return false;
}
routeArrival();
window.addEventListener('hashchange', routeArrival);
if (document.getElementById('tech-help-form')) initializeTechHelp();

function initializeTechHelp() {
  const form = document.getElementById('tech-help-form');
  const fields = document.getElementById('help-fields');
  const service = document.getElementById('help-service');
  const status = document.getElementById('help-status');
  const submit = document.getElementById('help-submit');
  const retry = document.getElementById('retry-availability');
  const picker = document.getElementById('service-picker');
  const change = document.getElementById('change-service');
  const serviceIds = new Set(Array.from(service.options, option => option.value));
  let sending = false;
  let ready = false;
  let checking = false;

  function updateService() {
    const selected = Array.from(service.options).find(option => option.value === service.value);
    document.getElementById('selected-name').textContent = selected.textContent;
    document.getElementById('selected-icon').src = 'assets/icons/' + serviceIcons[service.value] + '.svg';
    document.querySelectorAll('[data-service-detail]').forEach(section => {
      section.hidden = section.dataset.serviceDetail !== service.value;
    });
  }
  async function checkAvailability() {
    if (ready || sending || checking) return;
    checking = true;
    retry.hidden = true;
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
    checking = false;
    submit.disabled = !ready;
    retry.hidden = ready;
    status.textContent = ready ? '' : 'The request form is unavailable right now. Please call or text Kyle, or check availability again.';
  }
  change.addEventListener('click', () => {
    picker.hidden = !picker.hidden;
    change.setAttribute('aria-expanded', String(!picker.hidden));
    if (!picker.hidden) service.focus();
  });
  service.addEventListener('change', updateService);
  retry.addEventListener('click', checkAvailability);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !ready || !form.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(form));
    payload.project_type = 'tech_support';
    payload.reply_method = 'email';
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
          ? 'Please check your email address and describe the issue in at least 10 characters.'
          : response.status === 429
            ? 'Too many requests. Please call or text Kyle, or try again later.'
            : 'We could not confirm delivery. Your details are still here. Please call or text Kyle before retrying.';
        return;
      }
      const selected = service.value;
      form.reset();
      service.value = selected;
      updateService();
      status.textContent = 'Thanks! Your request has been sent. Kyle will follow up by email. This does not book an appointment.';
    } catch {
      status.textContent = 'We could not confirm delivery. Your details are still here. Please call or text Kyle before retrying.';
    } finally {
      sending = false;
      fields.disabled = false;
    }
  });
  const requested = new URLSearchParams(location.search).get('service');
  service.value = serviceIds.has(requested) ? requested : 'help';
  updateService();
  document.getElementById('service-summary').hidden = false;
  picker.hidden = true;
  fields.disabled = false;
  checkAvailability();
}
