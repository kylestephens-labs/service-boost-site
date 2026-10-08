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
    const concept = target.searchParams.get('concept');
    target.search = '';
    if (['maintenance', 'diagnostics', 'repair'].includes(service)) target.searchParams.set('service', service);
    if (['landscape', 'salon', 'auto-repair', 'restaurant', 'dental', 'contractor', 'real-estate'].includes(concept) && target.pathname === '/') target.searchParams.set('concept', concept);
    target.searchParams.set('ref', navigationRef);
    link.href = target.pathname + target.search + target.hash;
  });
}

const quoteDialog = document.querySelector('#request');
// Optional, allowlisted example context never copies demo inputs into the real form.
const conceptNames = new Map([
  ['landscape', 'Field & Form'], ['salon', 'Morrow Studio'],
  ['auto-repair', 'Juniper Motor Works'], ['restaurant', 'Sera'],
  ['dental', 'Stillwell'], ['contractor', 'Alder & Stone'], ['real-estate', 'Elena Vale'],
]);
const chosenConcept = new URLSearchParams(location.search).get('concept');
const conceptContext = document.querySelector('#concept-context');
if (conceptContext && conceptNames.has(chosenConcept)) {
  conceptContext.textContent = 'Inspired by ' + conceptNames.get(chosenConcept) + '. Only this example is carried over; no demo details.';
  conceptContext.hidden = false;
}
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

// Native dialogs keep details out of the main composition and restore trigger focus.
document.querySelectorAll('[data-open-panel]').forEach(button => {
  button.addEventListener('click', () => {
    const panel = document.getElementById(button.dataset.openPanel);
    if (panel?.tagName === 'DIALOG' && !panel.open) panel.showModal();
  });
});

const portfolioTrack = document.querySelector('#portfolio-track');
if (portfolioTrack) {
  const slides = [...portfolioTrack.querySelectorAll('.work-row')];
  const previous = document.querySelector('[data-portfolio-prev]');
  const next = document.querySelector('[data-portfolio-next]');
  const count = document.querySelector('[data-portfolio-count]');
  const pagination = document.querySelector('.portfolio-pagination');
  const dotGroup = document.querySelector('.portfolio-dots');
  const position = slide => slide.getBoundingClientRect().left - portfolioTrack.getBoundingClientRect().left;
  const goTo = index => {
    portfolioTrack.scrollBy({left: position(slides[index]), behavior: 'instant'});
  };
  const dots = slides.map((slide, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'portfolio-dot';
    dot.setAttribute('aria-label', `Show ${slide.dataset.slideLabel} concept`);
    dot.setAttribute('aria-controls', 'portfolio-track');
    dot.addEventListener('click', () => goTo(index));
    dotGroup.append(dot);
    return dot;
  });
  const current = () => slides.reduce((best, slide, index) =>
    Math.abs(position(slide)) < Math.abs(position(slides[best])) ? index : best, 0);
  const update = () => {
    const index = current();
    previous.disabled = portfolioTrack.scrollLeft <= 1;
    next.disabled = portfolioTrack.scrollLeft >= portfolioTrack.scrollWidth - portfolioTrack.clientWidth - 1;
    const label = `${index + 1} / ${slides.length}`;
    if (count.textContent !== label) count.textContent = label;
    dots.forEach((dot, item) => dot.setAttribute('aria-current', String(item === index)));
  };
  const move = direction => {
    goTo(Math.max(0, Math.min(slides.length - 1, current() + direction)));
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
  pagination.hidden = false;
  update();
}

// Local-only portfolio demonstrations. No storage, network or production intake calls.
const demoDialog = document.querySelector('#demo-dialog');
const demoForm = document.querySelector('#demo-form');
const demoStatus = document.querySelector('#demo-status');
const demoActions = document.querySelector('.demo-actions');
const field = name => demoForm?.elements.namedItem(name);
const hasOption = (select, value) => select?.tagName === 'SELECT'
  && [...select.options].some(option => option.value === value && !option.disabled);
const syncDemo = () => {
  const selection = field('selection');
  const intentNote = document.querySelector('[data-intent-note]');
  if (intentNote) {
    const selling = selection.value === 'Selling a home';
    document.querySelector('[data-area-label]').textContent = selling ? 'Property location' : 'Area of interest';
    intentNote.textContent = selling
      ? 'A seller conversation about your property, timing and selling goals.'
      : 'A buyer conversation about your preferred area, timing and priorities.';
  }
  const availability = document.querySelector('#availability-note');
  if (availability) {
    const unavailable = field('preference').value === 'unavailable';
    availability.hidden = !unavailable;
    field('preference').setCustomValidity(unavailable ? 'Choose an available sample time: 6:30 PM or 7:30 PM.' : '');
  }
};
const resetDemo = () => {
  if (!demoForm) return;
  demoForm.reset();
  demoForm.hidden = false;
  demoStatus.hidden = true;
  demoStatus.textContent = '';
  const tools = document.querySelector('.demo-tools');
  if (tools) tools.hidden = false;
  if (demoActions) demoActions.hidden = true;
  const service = new URLSearchParams(location.search).get('service');
  if (['maintenance', 'diagnostics', 'repair'].includes(service) && hasOption(field('service'), service)) field('service').value = service;
  syncDemo();
};
const openDemo = (name, value) => {
  if (!demoDialog || demoDialog.open) return;
  resetDemo();
  if (hasOption(field(name), value)) field(name).value = value;
  syncDemo();
  demoDialog.showModal();
};
document.querySelectorAll('[data-open-demo]').forEach(button => {
  button.addEventListener('click', () => openDemo(button.dataset.demoField, button.dataset.demoValue));
});
if (demoDialog) demoDialog.addEventListener('close', resetDemo);
// Navigation still reaches the useful Contact page; service/CTA links open the shared form.
if (demoDialog && document.querySelector('.auto-request-dialog')) {
  document.querySelectorAll('a[href]').forEach(link => {
    const target = new URL(link.href, location.href);
    if (target.origin !== location.origin || target.pathname !== '/auto-repair/contact' || link.closest('nav')) return;
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openDemo('service', target.searchParams.get('service') || 'unsure');
    });
  });
}
document.querySelector('[data-use-sample]')?.addEventListener('click', () => {
  const samples = {project_city: 'Walnut Creek', demo_name: 'Demo Visitor',
    demo_email: 'demo@example.com', vehicle: '2018 Honda Civic',
    demo_details: field('vehicle') ? 'A warning light on the dashboard.' : 'A garden with more room to sit outside.'};
  [...demoForm.elements].forEach(control => {
    if (control.tagName === 'SELECT' && (!control.value || control.value === 'unavailable')) {
      const option = [...control.options].find(item => item.value && !item.disabled && item.value !== 'unavailable');
      if (option) control.value = option.value;
    } else if (['INPUT', 'TEXTAREA'].includes(control.tagName) && !control.value && samples[control.name]) {
      control.value = samples[control.name];
    }
  });
  syncDemo();
  demoForm.querySelector('input,select,textarea')?.focus();
});
demoForm?.addEventListener('change', syncDemo);
document.querySelector('[data-edit-demo]')?.addEventListener('click', () => {
  demoForm.hidden = false;
  demoStatus.hidden = true;
  demoActions.hidden = true;
  document.querySelector('.demo-tools').hidden = false;
  demoForm.querySelector('input,select,textarea')?.focus();
});
document.querySelector('[data-reset-demo]')?.addEventListener('click', () => {
  resetDemo();
  demoForm.querySelector('input,select,textarea')?.focus();
});
if (demoForm) demoForm.addEventListener('submit', event => {
  event.preventDefault();
  syncDemo();
  if (!demoForm.reportValidity()) return;
  const value = name => field(name)?.value.trim() || '';
  const selected = name => field(name)?.selectedOptions?.[0]?.textContent || value(name);
  const lines = ['Your sample request', 'Nothing was sent, saved or booked.', ''];
  let next;
  if (demoForm.hasAttribute('data-industry-demo')) {
    lines.push(selected('selection'));
    ['project_area', 'sample_date', 'preference', 'timing'].forEach(name => {
      if (value(name)) lines.push(selected(name));
    });
    lines.push('Reply to: Demo Visitor · demo@example.com');
    next = document.querySelector('#demo-next-step')?.textContent;
    if (document.querySelector('[data-intent-note]')) next = document.querySelector('[data-intent-note]').textContent + ' A live agent would contact you to discuss the next step.';
    if (value('project_area') === 'Outside the East Bay') next = 'This sample project is outside the illustrative service area. A live contractor would confirm coverage before arranging a consultation.';
  } else if (field('vehicle')) {
    lines.push(selected('service'), value('vehicle'));
    if (value('demo_details')) lines.push(value('demo_details'));
    lines.push('Reply to: ' + value('demo_email'));
    next = 'A live shop would review your concern and contact you to discuss a visit. An appointment needs confirmation; work needs your approval.';
  } else if (field('appointment')) {
    lines.push(selected('service'), selected('appointment'), 'Reply to: ' + value('demo_email'));
    next = 'A live scheduler would confirm availability, pricing and appointment details. These are sample times, not a reserved appointment.';
  } else {
    lines.push(selected('project_type') + ' · ' + value('project_city'));
    if (value('demo_details')) lines.push(value('demo_details'));
    lines.push('Reply to: ' + value('demo_email'));
    next = 'A live landscape team would check the area and project fit, then arrange a conversation before preparing an estimate.';
  }
  if (next) lines.push('', 'What would happen next', next);
  // User-supplied sample text is never interpreted as markup.
  demoStatus.textContent = lines.join('\n');
  demoForm.hidden = true;
  document.querySelector('.demo-tools').hidden = true;
  demoStatus.hidden = false;
  if (demoActions) demoActions.hidden = false;
  demoStatus.focus();
});
