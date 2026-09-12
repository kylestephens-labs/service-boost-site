const form = document.querySelector('#request-form');
const website = document.querySelector('#website');
const problem = document.querySelector('#problem');
const status = document.querySelector('#form-status');
const websiteError = document.querySelector('#website-error');
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
document.querySelectorAll('[data-example]').forEach(link => {
  link.addEventListener('click', () => {
    if (!problem.value.trim()) problem.value = link.dataset.example;
    requestAnimationFrame(() => problem.focus({preventScroll: true}));
  });
});
form.addEventListener('submit', event => {
  event.preventDefault();
  status.hidden = true;
  if (!websiteUrl(website.value.trim())) {
    websiteError.textContent = 'Enter a website address, like yourbusiness.com.';
    website.setAttribute('aria-invalid', 'true');
    website.focus();
    return;
  }
  status.hidden = false;
  status.textContent = 'Preview only — your request has not been sent. Service Boost’s inbox is not connected yet.';
});
