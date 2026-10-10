const form = document.querySelector('#request-form');
const website = document.querySelector('#website');
const problem = document.querySelector('#problem');
const status = document.querySelector('#form-status');
const websiteError = document.querySelector('#website-error');
const serviceControl = document.querySelector('#request-service');
const serviceOptions = new Map([
  ['redesign', {
    name: 'Website redesign', heading: 'Start your redesign', action: 'Start my redesign',
    label: 'What would you like to improve?',
    prompt: 'Tell me about your website and what you want your redesign to achieve.',
    reassurance: "No payment due today. I'll review your site and reply within 24 hours with next steps.",
  }],
  ['updates', {
    name: 'Website updates and small fixes', heading: 'Request an update', action: 'Request my update',
    label: 'What needs updating?',
    prompt: 'Describe the updates or fixes you need. Include page links if helpful.',
    reassurance: 'One-hour minimum. You’ll approve an estimate before work begins.',
  }],
]);
function syncService() {
  const selected = serviceOptions.get(serviceControl?.value);
  if (!selected) return;
  document.querySelector('#intake-heading').textContent = selected.heading;
  document.querySelector('#problem-label').textContent = selected.label;
  problem.placeholder = selected.prompt;
  document.querySelector('#service-reassurance').textContent = selected.reassurance;
  form.querySelector('button[type="submit"]').textContent = selected.action;
}
serviceControl?.addEventListener('change', () => {
  syncService();
  status.hidden = true;
  form.querySelectorAll('.reassurance').forEach(text => { text.hidden = false; });
});
syncService();
function clearWebsiteError() {
  website.setCustomValidity('');
  website.removeAttribute('aria-invalid');
  websiteError.textContent = '';
}
// Page-lifetime reference only: no cookies, fingerprinting or typed form values.
const sourceRef = new URLSearchParams(location.search).get('ref');
const validRef = /^[A-Za-z0-9_-]{32}$/.test(sourceRef || '') ? sourceRef : null;
let quoteEventId = null;
function sourceFields() {
  return validRef && quoteEventId ? { ref: validRef, event_id: quoteEventId } : {};
}
function trackArrival() {
  if (!validRef || document.visibilityState !== 'visible' || navigator.webdriver || !crypto.randomUUID) return;
  const endpoint = window.SERVICE_BOOST_QUOTE_ENDPOINT;
  if (!endpoint || !endpoint.startsWith('https://')) return;
  const key = `sb-visit:${validRef}`;
  let id = crypto.randomUUID();
  try {
    id = sessionStorage.getItem(key) || id;
    sessionStorage.setItem(key, id);
  } catch { /* Storage blocked: server still bounds and deduplicates events. */ }
  fetch(new URL('/events', endpoint), {
    method: 'POST', credentials: 'omit', keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: validRef, event_id: id, type: 'visit' }),
  }).catch(() => {});
}
if (document.visibilityState === 'visible') trackArrival();
else document.addEventListener('visibilitychange', function visible() {
  if (document.visibilityState !== 'visible') return;
  document.removeEventListener('visibilitychange', visible);
  trackArrival();
});
function websiteUrl(value) {
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}
website.addEventListener('input', clearWebsiteError);
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  if (button.disabled) return;
  form.querySelectorAll('.reassurance').forEach(text => { text.hidden = false; });
  status.hidden = true;
  const selectedService = serviceControl?.value;
  const selected = serviceOptions.get(selectedService);
  if (serviceControl && !selected) {
    status.hidden = false;
    status.textContent = 'Choose a service before sending your request.';
    serviceControl.focus();
    return;
  }
  const description = problem.value.trim();
  // Reserve room for the selected service in the existing 4000-character contract.
  // The label reaches the inbox without a backend deployment or schema change.
  const requestDescription = selected ? `Service: ${selected.name}\n\n${description}` : description;
  if (description.length < 10 || requestDescription.length > 4000) {
    status.hidden = false;
    status.textContent = 'Describe your request in 10 to 3,950 characters.';
    problem.focus();
    return;
  }
  const address = website.value.trim();
  if (!address || !websiteUrl(address) || /\s/.test(address)) {
    websiteError.textContent = 'Enter a website address, like yourbusiness.com.';
    website.setAttribute('aria-invalid', 'true');
    website.focus();
    return;
  }
  status.hidden = false;
  const endpoint = window.SERVICE_BOOST_QUOTE_ENDPOINT;
  if (!endpoint || !endpoint.startsWith('https://')) {
    status.textContent = 'Preview only — your request has not been sent. Service Boost’s inbox is not connected yet.';
    return;
  }
  if (!quoteEventId && crypto.randomUUID) quoteEventId = crypto.randomUUID();
  button.disabled = true;
  if (serviceControl) serviceControl.disabled = true;
  button.textContent = 'Sending…';
  status.textContent = '';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      // Both existing-website services use the improvement contract.
      body: JSON.stringify({ website: address, name: form.elements.name.value.trim(), project_type: 'improve', problem: requestDescription, email: form.elements.email.value.trim(), company: form.elements.company.value, ...sourceFields() }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      status.textContent = response.status === 429 ? 'Too many requests. Please try again later.' : 'Delivery could not be confirmed. Your details are still here. Please try again or email notify@serviceboost.co.';
      return;
    }
    status.textContent = 'Your request has been sent. I’ll review your site and reply within 24 hours with next steps.';
    form.querySelectorAll('.reassurance').forEach(text => { text.hidden = true; });
    form.reset();
    if (serviceControl) serviceControl.value = selectedService;
    clearWebsiteError();
    quoteEventId = null;
  } catch {
    status.textContent = 'Delivery could not be confirmed. Your details are still here. Please try again or email notify@serviceboost.co.';
  } finally {
    button.disabled = false;
    if (serviceControl) serviceControl.disabled = false;
    button.textContent = 'Send my request';
    syncService();
  }
});
