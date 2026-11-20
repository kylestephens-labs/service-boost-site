const computerServiceTitles = {
  0: "Set up a new computer",
  1: "Set up or reconnect a printer",
  2: "Troubleshoot a computer or printer",
};

function renderComputerMenu(packages, selection, guide) {
  const makeCard = (id) => {
    const isFolder = id === "folder";
    const [name, icon, amount, description, includes] = isFolder
      ? [
          "Back up or transfer a folder", "file-text", null,
          "Copy one selected folder from a working computer to an accessible, working drive you provide.",
          "Open a sample of the copied files together",
        ]
      : packages[id];
    const title = computerServiceTitles[id] ?? name;
    const scope = id === 2
      ? "The $" + amount + " covers a diagnostic visit for one computer or printer issue even if it remains unresolved, and Kyle asks for your approval before extra work."
      : id === 5 ? "Practice one everyday task on your computer."
      : description;
    const price = isFolder ? "Request a quote" : "$" + amount;
    const open = selection === String(id);
    const titleId = "computer-card-" + id;
    const regionId = "computer-scope-" + id;
    const target = open ? "#services/0" : "#services/0/" + id;
    const items = includes.split("|").slice(0, 3).map(item => "<li>" + esc(item) + "</li>").join("");
    const cta = isFolder
      ? '<a class="computer-action" href="/request-help">Request a quote</a>'
      : '<a class="computer-action" href="#book/0/' + id + '">Schedule a visit</a>';
    return '<article class="computer-service">' +
      '<h3 class="computer-card-heading"><button type="button" class="computer-toggle" id="' + titleId + '"' +
        ' aria-expanded="' + open + '" aria-controls="' + regionId + '"' +
        ' onclick="cardToRefocus = this.id; location.hash = \'' + target + '\'">' +
      '<span class="computer-icon"><img src="/assets/icons/' + icon + '.svg" width="22" height="22" alt=""></span>' +
      '<span class="computer-name">' + esc(title) + '</span>' +
      '<span class="computer-price' + (isFolder ? ' computer-quote' : '') + '">' + price + '</span>' +
      '<img class="computer-chevron" src="/assets/icons/chevron-right.svg" width="16" height="16" alt="">' +
      '</button></h3>' +
      '<div class="computer-detail" role="region" id="' + regionId + '" aria-labelledby="' + titleId + '"' + (open ? '>' : ' hidden>') +
      (open ? '<p>' + esc(scope) + '</p><ul>' + items + '</ul>' +
        (isFolder ? '<p class="computer-exclusions">Full-device migration, damaged drives, and data recovery are outside this service.</p>' : '') + cta : '') +
      '</div></article>';
  };
  const group = (title, ids) => '<section class="computer-group"><h2>' + title + '</h2>' + ids.map(makeCard).join("") + '</section>';
  return '<section class="selection computer-shell">' +
    '<div class="computer-hero"><a class="computer-back" href="#home"><img src="/assets/icons/chevron-left.svg" width="14" height="14" alt="">All services</a>' +
    '<h1><span>Computer and</span> <span>printer support</span></h1>' +
    '<p class="computer-subtitle">On-site setup and troubleshooting in Walnut Creek and nearby communities.</p>' +
    '<p class="computer-terms"><img src="/assets/icons/circle-check.svg" width="18" height="18" alt="">Fixed prices where shown. Pay after your visit.</p></div>' +
    '<div class="computer-layout"><div class="computer-list">' +
    group("Setup &amp; installation", [0, 1, 3, "folder"]) +
    group("Help &amp; learning", [2, 4, 5]) + guide +
    '<p class="computer-inline-help"><span>Not sure what you need?</span> <a href="/request-help">Ask Kyle</a></p></div>' +
    '<aside class="computer-help" aria-labelledby="computer-help-title">' +
    '<div class="computer-owner"><img src="/assets/kyle-stephens.png" width="48" height="48" alt=""><strong>Kyle Stephens</strong></div>' +
    '<h2 id="computer-help-title">Not sure what you need?</h2>' +
    '<p>I own Service Boost here in Walnut Creek. Tell me what’s going on and I’ll help you choose a service.</p>' +
    '<a href="/request-help">Ask Kyle <img src="/assets/icons/arrow-right.svg" width="16" height="16" alt=""></a></aside></div></section>';
}
