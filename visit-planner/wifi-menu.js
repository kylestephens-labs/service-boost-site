const wifiInquiries = {
  extension: {
    title: "Wi-Fi Signal Extension",
    detail: "Tell Kyle where Wi-Fi is weak and what equipment you have. He’ll review your setup and discuss options and pricing.",
  },
  cabling: {
    title: "In-Wall Cable Running",
    // The existing $249 rate needs a confirmed standard scope before it can be displayed again.
    detail: "Describe where the network cable needs to go and what access is available. Kyle reviews the route, access, materials, scope, price, and any applicable qualifications and permits before accepting work. This inquiry covers network cable only.",
  },
  connectivity: {
    title: "Connectivity Support",
    detail: "Tell Kyle which devices are having connection problems and when it happens. He’ll review the issue and confirm the scope and price before scheduling.",
  },
};

function renderWifiMenu(selection, panel) {
  const [name, icon, price] = tasks[2][0];
  const setup = serviceCard(name, icon, "$" + price, selection === "0", "choose(0)", "wifi-router-setup")
    + (selection === "0" ? panel : "");
  function inquiryCard(id) {
    const { title, detail } = wifiInquiries[id];
    const open = selection === id;
    return serviceCard(title, "wifi", "Ask Kyle", open, "location.hash='services/2/" + id + "'", "wifi-" + id)
      + (open ? '<section class="scope"><h2>' + title + '</h2><p>' + detail + '</p>'
        + '<p><a href="/request-help?service=wifi&amp;network=' + id + '">Ask Kyle about ' + title.toLowerCase() + '</a></p></section>' : "");
  }
  return '<section class="selection"><div class="path"><a href="#home">All services</a> / Choose a service</div><h1>Wi-Fi &amp; network</h1>'
    + '<section class="service-group"><h2>Setup &amp; installation</h2><p>Router setup is fixed price, with payment after your visit.</p>'
    + '<div class="picker computer-packages">' + setup + inquiryCard("extension") + inquiryCard("cabling") + '</div></section>'
    + '<section class="service-group"><h2>Support</h2><div class="picker computer-packages">' + inquiryCard("connectivity") + '</div></section>'
    + '<p class="assisted-link"><a href="/request-help">Not sure what you need? Ask Kyle</a></p></section>';
}
