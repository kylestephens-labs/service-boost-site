function serviceScope(description, includes = "", exclusion = "") {
  const items = includes.split("|").filter(Boolean);
  return '<p>' + esc(description) + '</p>' +
    (items.length ? '<ul>' + items.map(item => '<li>' + esc(item) + '</li>').join("") + '</ul>' : '') +
    (exclusion ? '<p class="visit-menu-exclusions">' + esc(exclusion) + '</p>' : '');
}

function scheduledService(category, id, { title, scope, showExclusions = true } = {}) {
  const [name, icon, price, description, includes, exclusions] = tasks[category][id];
  return {
    id,
    title: title ?? name,
    icon,
    priceLabel: "$" + price,
    detail: serviceScope(scope ?? description, includes) +
      (showExclusions && exclusions ? '<h4>Outside scope</h4><p class="visit-menu-exclusions">' + esc(exclusions) + '</p>' : ''),
    href: "#book/" + category + "/" + id,
    action: "Schedule a visit",
  };
}

function renderServiceCard(category, selection, { id, title, icon, priceLabel, detail, href, action }, headingTag, showPrice) {
  const open = selection === String(id);
  const titleId = "visit-menu-card-" + category + "-" + id;
  const regionId = "visit-menu-scope-" + category + "-" + id;
  const target = "#services/" + category + (open ? "" : "/" + id);
  const priceClass = priceLabel.startsWith("$") ? "visit-menu-price" : "visit-menu-price visit-menu-quote";
  return '<article class="visit-menu-service">' +
    '<' + headingTag + ' class="visit-menu-card-heading"><button type="button" class="visit-menu-toggle" id="' + titleId + '"' +
      ' aria-expanded="' + open + '" aria-controls="' + regionId + '"' +
      ' onclick="cardToRefocus = this.id; location.hash = \'' + target + '\'">' +
    '<span class="visit-menu-icon"><img src="/assets/icons/' + esc(icon) + '.svg" width="22" height="22" alt=""></span>' +
    '<span class="visit-menu-name">' + esc(title) + '</span>' +
    (showPrice ? '<span class="' + priceClass + '">' + esc(priceLabel) + '</span>' : '') +
    '<img class="visit-menu-chevron" src="/assets/icons/chevron-right.svg" width="16" height="16" alt="">' +
    '</button></' + headingTag + '>' +
    '<div class="visit-menu-detail" role="region" id="' + regionId + '" aria-labelledby="' + titleId + '"' + (open ? '>' : ' hidden>') +
    (open ? detail + '<a class="visit-menu-action" href="' + esc(href) + '">' + esc(action) + '</a>' : '') +
    '</div></article>';
}

function renderServiceMenu(category, selection, { title, subtitle, fixedPrice, status, groups, guide = "" }) {
  const heading = Array.isArray(title) ? title.map(line => '<span>' + esc(line) + '</span>').join(" ") : esc(title);
  const group = ({ heading, note, cards }) => {
    const list = cards.map(card => renderServiceCard(category, selection, card, heading ? "h3" : "h2", card.priceLabel !== fixedPrice)).join("");
    if (!heading) return list;
    return '<section class="visit-menu-group"><h2>' + esc(heading) + '</h2>' +
      (note ? '<p class="visit-menu-group-note">' + esc(note) + '</p>' : '') + list + '</section>';
  };
  return '<section class="selection visit-menu-shell">' +
    '<div class="visit-menu-hero"><a class="visit-menu-back" href="#home"><img src="/assets/icons/chevron-left.svg" width="14" height="14" alt="">All services</a>' +
    '<h1>' + heading + '</h1>' +
    (subtitle ? '<p class="visit-menu-subtitle">' + esc(subtitle) + '</p>' : '') +
    (status ? '<p class="visit-menu-status" role="status">' + esc(status) + '</p>' : '') + '</div>' +
    '<div class="visit-menu-layout"><div class="visit-menu-list">' +
    '<div class="service-menu-heading menu-rates"><p class="shared-rate">Fixed price: <strong>' + esc(fixedPrice) +
    '</strong><small class="payment-footnote">* Payment due after your visit.</small></p></div>' +
    groups.map(group).join("") + guide +
    '<p class="visit-menu-inline-help"><span>Not sure what you need?</span> <a href="/request-help">Ask Kyle</a></p></div>' +
    '<aside class="visit-menu-help" aria-labelledby="visit-menu-help-title">' +
    '<div class="visit-menu-owner"><img src="/assets/kyle-stephens.png" width="48" height="48" alt=""><strong>Kyle Stephens</strong></div>' +
    '<h2 id="visit-menu-help-title">Not sure what you need?</h2>' +
    '<p>Tell me what’s going on, and I’ll help you choose the right service.</p>' +
    '<a href="/request-help">Ask Kyle <img src="/assets/icons/arrow-right.svg" width="16" height="16" alt=""></a></aside></div></section>';
}
