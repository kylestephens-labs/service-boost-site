// Loaded only by the non-sending review build.
function addSmartHomeSupport(packages, guidance) {
  const devices = [
    ["Video Doorbell", "one already-installed doorbell", "app, connectivity or notification issues", ""],
    ["Smart Thermostat", "one already-installed thermostat", "app, connectivity or settings|Assess the thermostat and check its Wi-Fi connection|Check for app updates and troubleshoot the reported issue|Demonstrate everyday controls and answer questions about using them", ", HVAC or electrical repair"],
    ["Smart Garage Controller", "one already-installed controller", "app, connectivity or settings", ", mechanical repair or safety-system adjustments"],
    ["Smart Hub & Speaker", "one hub or speaker", "its app or connection to working Wi-Fi", ""],
  ];
  for (const [name, device, focus, exclusions] of devices) {
    const question = "Can you access " + device + " and its app?";
    packages.push([name + " Support", "smart-home", 229,
      "The visit covers time and diagnosis for one issue even if it remains unresolved. You and Kyle agree on any extra work and price before proceeding.",
      "Diagnose one issue on " + device + ": " + focus + "|Explain findings and next steps",
      "Devices, subscriptions and replacement parts" + exclusions, question]);
    guidance.push("Confirm you can access the device and app, and identify one issue to investigate.");
  }
}

function renderSmartHomePreview(selection, panel) {
  const packages = tasks[1].map(([name, icon, price], index) => {
    const open = selection === String(index);
    return serviceCard(index === 0 ? "Smart Device App &amp; Wi-Fi Pairing" : name, icon, "$" + price, open, "choose(" + index + ")")
      + (open ? panel : "");
  });
  const installations = [
    ["doorbell-installation", "Video Doorbell Installation", "Install one compatible customer-provided video doorbell in an accessible location, connect it to the app and existing Wi-Fi, and test operation."],
    ["thermostat-installation", "Smart Thermostat Installation &amp; Setup", "Requires a working thermostat at the installation location.<ul><li>Assess the location and check compatibility.</li><li>Replace the existing thermostat with one compatible smart thermostat.</li><li>Connect it to existing Wi-Fi, complete initial setup and test operation.</li><li>Install and set up the mobile app.</li><li>Show how to use the everyday controls.</li></ul>New wiring and HVAC repair are excluded."],
    ["garage-installation", "Smart Garage Controller Installation", "One compatible controller on an existing working opener, app connection and an operation test. Opener replacement and mechanical repair are excluded."],
  ];
  const installationCards = installations.map(([id, title, scope]) => {
    const open = selection === id;
    return serviceCard(title, "smart-home", "$249", open, "location.hash='services/1/" + id + "'")
      + (open ? '<section class="scope"><h2>' + title + '</h2><p>Unavailable for booking.</p><h3>Scope under review</h3><div>' + scope + '</div></section>' : "");
  });
  const group = (heading, cards) => '<section class="service-group"><h2>' + heading + '</h2><div class="picker computer-packages">' + cards.join("") + '</div></section>';
  return '<section class="selection"><div class="path"><a href="#home">All services</a> / Choose a visit</div><h1>Smart home</h1><p>' + paymentNote + '</p>'
    + group("Device pairing", packages.slice(0, 1))
    + group("Device support", packages.slice(1))
    + group("Installations · Unavailable for booking", installationCards)
    + '<p class="assisted-link"><a href="/request-help">Not sure what you need? Ask Kyle</a></p></section>';
}
