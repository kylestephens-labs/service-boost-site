function renderWifiPreview(selection, panel) {
  const [name, icon, price] = tasks[2][0];
  const setup = serviceCard(name, icon, "$" + price, selection === "0", "choose(0)")
    + (selection === "0" ? panel : "");
  const proposals = [
    ["connectivity", "WiFi and Network Connectivity Support", "Investigate a connection issue between a device, the router and the internet. Diagnostic scope, device limits and visit length are pending."],
    ["extension", "WiFi Signal Extension", "Help with a weak signal is under consideration. Equipment, coverage targets and the work included have yet to be defined."],
    ["cabling", "In-Wall Cable Running", "The proposed visit would assess a route, run cable behind a wall and test the connection. Eligibility, permit requirements, access, cable type and length, materials and wall repair must be settled before this service can be offered."],
  ];
  const cards = proposals.map(([id, title, detail]) => {
    const open = selection === id;
    return serviceCard(title, "wifi", "Price TBD", open, "location.hash='services/2/" + id + "'")
      + (open ? '<section class="scope"><h2>' + title + '</h2><p>Draft scope · Unavailable for booking</p><p>' + detail + '</p></section>' : "");
  });
  return '<section class="selection"><div class="path"><a href="#home">All services</a> / Choose a visit</div><h1>Wi-Fi &amp; network</h1>'
    + '<section class="service-group"><h2>Router setup</h2><div class="picker computer-packages">' + setup + '</div></section>'
    + '<section class="service-group"><h2>Proposed services</h2><p>Review only · Unavailable for booking</p><div class="picker computer-packages">' + cards.join("") + '</div></section>'
    + '<p class="assisted-link"><a href="/request-help">Not sure what you need? Ask Kyle</a></p></section>';
}
