function renderWifiMenu(selection, panel) {
  const [name, icon, price] = tasks[2][0];
  const setup = serviceCard(name, icon, "$" + price, selection === "0", "choose(0)")
    + (selection === "0" ? panel : "");
  const proposals = [
    ["connectivity", "WiFi and Network Connectivity Support", "Investigate a connection issue between a device, the router and the internet."],
    ["extension", "WiFi Signal Extension", "Help with weak Wi-Fi coverage."],
    ["cabling", "In-Wall Cable Running", "Assess the route, run cable behind the wall, and test the connection."],
  ];
  const cards = proposals.map(([id, title, detail]) => {
    const open = selection === id;
    const priceLabel = id === "cabling" ? "$249" : "Unavailable";
    return serviceCard(title, "wifi", priceLabel, open, "location.hash='services/2/" + id + "'")
      + (open ? '<section class="scope"><h2>' + title + '</h2><p>Unavailable for booking</p><p>' + detail + '</p></section>' : "");
  });
  return '<section class="selection"><div class="path"><a href="#home">All services</a> / Choose a visit</div><h1>Wi-Fi &amp; network</h1>'
    + '<section class="service-group"><h2>Router setup</h2><div class="picker computer-packages">' + setup + '</div></section>'
    + '<section class="service-group"><h2>Unavailable for booking</h2><div class="picker computer-packages">' + cards.join("") + '</div></section>'
    + '<p class="assisted-link"><a href="/request-help">Not sure what you need? Ask Kyle</a></p></section>';
}
