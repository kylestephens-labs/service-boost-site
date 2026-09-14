const form = document.querySelector('#request-form');
const website = document.querySelector('#website');
const problem = document.querySelector('#problem');
const status = document.querySelector('#form-status');
const websiteError = document.querySelector('#website-error');
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
website.addEventListener('input', () => {
  website.setCustomValidity('');
  website.removeAttribute('aria-invalid');
  websiteError.textContent = '';
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  form.querySelectorAll('.reassurance').forEach(text => { text.hidden = false; });
  status.hidden = true;
  if (!websiteUrl(website.value.trim())) {
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
  const button = form.querySelector('button[type="submit"]');
  if (!quoteEventId && crypto.randomUUID) quoteEventId = crypto.randomUUID();
  button.disabled = true;
  button.textContent = 'Sending…';
  status.textContent = '';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ website: website.value.trim(), problem: problem.value.trim(), email: form.elements.email.value.trim(), company: form.elements.company.value, ...sourceFields() }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      status.textContent = response.status === 429 ? 'Too many requests. Please try again later.' : 'We could not confirm delivery. Your details are still here. Please try again or email notify@serviceboost.co.';
      return;
    }
    status.textContent = 'Your request has been sent. We’ll reply by email.';
    form.querySelectorAll('.reassurance').forEach(text => { text.hidden = true; });
    form.reset();
    quoteEventId = null;
  } catch {
    status.textContent = 'We could not confirm delivery. Your details are still here. Please try again or email notify@serviceboost.co.';
  } finally {
    button.disabled = false;
    button.textContent = 'Get a free quote';
  }
});
