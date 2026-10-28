// Partner inquiries use the existing tech_support contract. "company" remains
// the backend honeypot; the real company is labeled inside the message body.
function partnerPayload(values) {
  const task = values.task.trim();
  if (task.length < 10 || task.length > 3500) throw new Error('Describe the task or coverage in 10–3,500 characters.');
  const business = values.business.trim();
  if (!business || business.length > 200 || /[\r\n\x00]/.test(business)) throw new Error('Enter your company name.');
  const problem = [
    'Partner coverage inquiry',
    'Company: ' + business,
    '', 'Task or coverage needed:', task
  ].join('\n');
  return {
    project_type: 'tech_support', service: 'help', reply_method: 'email',
    name: values.name.trim(), email: values.email.trim(),
    phone: '', location: values.location.trim(),
    company: values.company || '', problem
  };
}

const form = document.getElementById('partner-form');
const fields = document.getElementById('partner-fields');
const submit = document.getElementById('partner-submit');
const status = document.getElementById('partner-status');
const retry = document.getElementById('partner-retry');
let ready = false;
let checking = false;
let sending = false;
let completed = false;

async function checkPartnerAvailability() {
  if (ready || checking || sending || completed) return;
  checking = true;
  retry.hidden = true;
  submit.disabled = true;
  status.textContent = 'Checking form availability…';
  try {
    const endpoint = new URL(window.SERVICE_BOOST_QUOTE_ENDPOINT);
    endpoint.pathname = '/tech-help-ready';
    endpoint.search = '';
    endpoint.hash = '';
    const response = await fetch(endpoint, {credentials: 'omit', signal: AbortSignal.timeout(8000)});
    const data = await response.json();
    ready = response.ok && data.message === 'tech_support_v1';
  } catch { ready = false; }
  checking = false;
  submit.disabled = !ready;
  retry.hidden = ready;
  status.textContent = ready ? '' : 'The form is unavailable right now. Please call, text or email Kyle, or check availability again.';
}

fields.disabled = false;
retry.addEventListener('click', checkPartnerAvailability);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!ready || sending || completed || !form.reportValidity()) return;
  let payload;
  try {
    payload = partnerPayload(Object.fromEntries(new FormData(form)));
  } catch (error) {
    status.textContent = error.message;
    return;
  }
  sending = true;
  fields.disabled = true;
  status.textContent = 'Sending your inquiry…';
  const uncertain = 'We could not confirm delivery. Your details are still here. Please contact Kyle before retrying.';
  try {
    const response = await fetch(window.SERVICE_BOOST_QUOTE_ENDPOINT, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      credentials: 'omit', body: JSON.stringify(payload), signal: AbortSignal.timeout(25000)
    });
    if (!response.ok) {
      status.textContent = response.status === 400
        ? 'Please check your contact details and describe the coverage you need.'
        : response.status === 429
          ? 'Too many requests. Please call, text or email Kyle, or try again later.'
          : uncertain;
      return;
    }
    const data = await response.json();
    if (data.message !== 'Your request has been sent. Kyle will follow up using your preferred reply method.') {
      status.textContent = uncertain;
      return;
    }
    completed = true;
    form.reset();
    status.textContent = '';
    document.getElementById('inquiry-content').hidden = true;
    document.getElementById('partner-confirmation').hidden = false;
    document.getElementById('partner-confirmation-title').focus();
  } catch {
    status.textContent = uncertain;
  } finally {
    sending = false;
    fields.disabled = completed;
  }
});

checkPartnerAvailability();
