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

const portfolioTrack = document.querySelector('#portfolio-track');
if (portfolioTrack) {
  const slides = [...portfolioTrack.querySelectorAll('.work-row')];
  const previous = document.querySelector('[data-portfolio-prev]');
  const next = document.querySelector('[data-portfolio-next]');
  const count = document.querySelector('[data-portfolio-count]');
  const position = slide => slide.getBoundingClientRect().left - portfolioTrack.getBoundingClientRect().left;
  const current = () => slides.reduce((best, slide, index) =>
    Math.abs(position(slide)) < Math.abs(position(slides[best])) ? index : best, 0);
  const update = () => {
    const index = current();
    previous.disabled = portfolioTrack.scrollLeft <= 1;
    next.disabled = portfolioTrack.scrollLeft >= portfolioTrack.scrollWidth - portfolioTrack.clientWidth - 1;
    const label = `${index + 1} / ${slides.length}`;
    if (count.textContent !== label) count.textContent = label;
  };
  const move = direction => {
    const step = position(slides[1]) - position(slides[0]);
    portfolioTrack.scrollBy({left: direction * step, behavior: 'instant'});
  };
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  portfolioTrack.addEventListener('keydown', event => {
    if (event.target !== portfolioTrack || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  portfolioTrack.addEventListener('scroll', update, {passive: true});
  window.addEventListener('resize', update);
  document.querySelector('.portfolio-controls').hidden = false;
  update();
}

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
// Juniper links retain their normal destination when JavaScript is unavailable.
if (demoDialog && document.querySelector('.auto-request-dialog')) {
  document.querySelectorAll('a[href]').forEach(link => {
    const target = new URL(link.href, location.href);
    if (target.origin !== location.origin || target.pathname !== '/auto-repair/contact') return;
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      resetDemo();
      const service = target.searchParams.get('service');
      if (['maintenance', 'diagnostics', 'repair'].includes(service)) demoForm.elements.namedItem('service').value = service;
      demoDialog.showModal();
    });
  });
  demoDialog.addEventListener('click', event => {
    const bounds = demoDialog.getBoundingClientRect();
    if (event.target === demoDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) demoDialog.close();
  });
  if (location.pathname.replace(/\/$/, '') === '/auto-repair/contact') {
    resetDemo();
    demoDialog.showModal();
  }
}
// Inline demos need the same allowlisted selection as modal demos.
if (demoForm && !demoDialog) resetDemo();
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
  const value = name => demoForm.elements.namedItem(name)?.value.trim() || '';
  const selected = name => {
    const field = demoForm.elements.namedItem(name);
    return field?.selectedOptions?.[0]?.textContent || value(name);
  };
  let summary;
  if (demoForm.hasAttribute('data-industry-demo')) {
    summary = 'Your sample request\n\n' + selected('selection') + '\n' + selected('preference');
  } else if (demoForm.elements.namedItem('vehicle')) {
    summary = selected('service') + ' · ' + value('vehicle')
      + (value('demo_details') ? '\n' + value('demo_details') : '');
  } else if (demoForm.elements.namedItem('appointment')) {
    summary = 'Your sample booking request\n\n' + selected('service') + '\n' + selected('appointment')
      + '\n\nExample next step\nA live scheduler would confirm availability and appointment details. These are sample times, not a reserved appointment.';
  } else {
    summary = 'Your sample project request\n\n' + selected('project_type') + ' · ' + value('project_city')
      + '\n' + value('demo_details')
      + '\n\nExample next step\nA landscape team would check the service area and project fit, then arrange a conversation before preparing an estimate.';
  }
  // Sample input is text, never markup, and remains only in this page.
  demoStatus.textContent = summary + (demoForm.elements.namedItem('vehicle')
    ? '\n\nDemo preview only. Nothing was sent or booked.'
    : '\n\nNothing was sent, saved or booked. This is a fictional business demonstration.');
  if (demoActions) demoActions.hidden = false;
  demoStatus.focus();
});
