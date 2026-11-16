function renderSmartHomePreview(selection, pairingPanel) {
  const price = tasks[1][0][2];
  const pairing = serviceCard("Smart Device App &amp; Wi-Fi Pairing", "smart-home",
    "One compatible plug-in or battery device · " + visitDuration(1, 0),
    "$" + price, selection === "0", "choose(0)");
  const proposals = [
    ["doorbell-installation", "Video Doorbell Installation", "Doorbell mounting, wiring and hardware compatibility would need individual review."],
    ["doorbell", "Video Doorbell Support", "Doorbell compatibility and troubleshooting would need individual review."],
    ["thermostat-installation", "Smart Thermostat Installation", "Thermostat compatibility, installation and wiring would need individual review."],
    ["thermostat", "Smart Thermostat Support", "Thermostat compatibility and troubleshooting would need individual review."],
    ["garage-installation", "Garage Controller Installation", "Controller compatibility, installation and wiring would need individual review."],
    ["garage", "Garage Controller Support", "Controller compatibility and troubleshooting would need individual review."],
    ["hub-speaker", "Smart Hub &amp; Speaker Support", "Hub or speaker compatibility and troubleshooting would need individual review."],
  ];
  const proposedCards = proposals.map(([id, title, details]) => {
    const open = selection === id;
    return serviceCard(title, "smart-home", "Scope and price to be confirmed", "Review only · Unavailable for booking",
      open, "location.hash='services/1/" + id + "'")
      + (open ? '<section class="scope"><h2>' + title + '</h2><p>' + details + '</p><p>No installation, troubleshooting or repair service has been approved for this proposal.</p></section>' : "");
  });
  return '<section class="selection"><div class="path"><a href="#home">All services</a> / Choose a visit</div><h1>Smart home</h1>'
    + '<section class="service-group"><h2>Device pairing</h2><p>Pair one compatible smart plug, speaker or hub with its app on working Wi-Fi. No mounting or wiring. Pay after your visit.</p><div class="picker computer-packages">'
    + pairing + (selection === "0" ? pairingPanel : "") + '</div></section>'
    + '<section class="service-group"><h2>Proposed services</h2><div class="picker computer-packages">' + proposedCards.join("") + '</div></section>'
    + '<p class="assisted-link"><a href="/request-help">Not sure what you need? Ask Kyle</a></p></section>';
}
