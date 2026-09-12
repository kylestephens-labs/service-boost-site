const form = document.querySelector('#request-form');
const website = document.querySelector('#website');
const problem = document.querySelector('#problem');
const status = document.querySelector('#form-status');
const websiteError = document.querySelector('#website-error');
const carousel = document.querySelector('.testimonials');
if (carousel) {
  const slides = [...carousel.querySelectorAll('.quote-slide')];
  const controls = carousel.querySelector('.quote-controls');
  const pauseButton = carousel.querySelector('[data-quote-pause]');
  const stage = carousel.querySelector('.quote-stage');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let paused = motion.matches;
  let timer;
  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    carousel.querySelector('[data-quote-count]').textContent = `${current + 1} / ${slides.length}`;
  }
  function updateRotation() {
    clearInterval(timer);
    pauseButton.textContent = paused ? 'Start rotation' : 'Pause rotation';
    const stopped = paused || document.hidden || carousel.matches(':hover') || carousel.contains(document.activeElement);
    stage.setAttribute('aria-live', stopped ? 'polite' : 'off');
    if (!stopped) timer = setInterval(() => showSlide(current + 1), 7000);
  }
  controls.hidden = false;
  carousel.querySelector('[data-quote-prev]').addEventListener('click', () => { showSlide(current - 1); updateRotation(); });
  carousel.querySelector('[data-quote-next]').addEventListener('click', () => { showSlide(current + 1); updateRotation(); });
  pauseButton.addEventListener('click', () => { paused = !paused; updateRotation(); });
  carousel.addEventListener('mouseenter', updateRotation);
  carousel.addEventListener('mouseleave', updateRotation);
  carousel.addEventListener('focusin', () => { paused = true; updateRotation(); });
  carousel.addEventListener('focusout', () => setTimeout(updateRotation, 0));
  document.addEventListener('visibilitychange', updateRotation);
  motion.addEventListener('change', () => { paused = motion.matches; updateRotation(); });
  updateRotation();
}
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
  button.disabled = true;
  button.textContent = 'Sending…';
  status.textContent = '';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ website: website.value.trim(), problem: problem.value.trim(), email: form.elements.email.value.trim(), company: form.elements.company.value }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      status.textContent = response.status === 429 ? 'Too many requests. Please try again later.' : 'We could not confirm delivery. Your details are still here. Please try again or email notify@serviceboost.co.';
      return;
    }
    status.textContent = 'Your request has been sent. We’ll reply by email.';
    form.querySelectorAll('.reassurance').forEach(text => { text.hidden = true; });
    form.reset();
  } catch {
    status.textContent = 'We could not confirm delivery. Your details are still here. Please try again or email notify@serviceboost.co.';
  } finally {
    button.disabled = false;
    button.textContent = 'Get a free quote';
  }
});
