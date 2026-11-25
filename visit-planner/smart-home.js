function addSmartHomeSupport(packages, guidance) {
  const devices = [
    ["Video Doorbell", "one already-installed doorbell", "app, connectivity or notification issues", ""],
    ["Smart Thermostat", "one already-installed thermostat", "app, connectivity or settings|Assess the thermostat and check its Wi-Fi connection|Check for app updates and troubleshoot the reported issue|Demonstrate everyday controls and answer questions about using them", ", HVAC or electrical repair"],
    ["Smart Garage Controller", "one already-installed controller", "app, connectivity or settings", ", mechanical repair or safety-system adjustments"],
    ["Smart Hub & Speaker", "one hub or speaker", "its app or connection to working Wi-Fi", ""],
  ];
  for (const [name, device, focus, exclusions] of devices) {
    const question = "Can you access " + device + " and its app?";
    packages.push([name + " Support", "smart-home", name === "Smart Hub & Speaker" ? 229 : 249,
      "The visit covers time and diagnosis for one issue even if it remains unresolved. You and Kyle agree on any extra work and price before proceeding.",
      "Diagnose one issue on " + device + ": " + focus + "|Explain findings and next steps",
      "Devices, subscriptions and replacement parts" + exclusions, question]);
    guidance.push("Confirm you can access the device and app, and identify one issue to investigate.");
  }
}

const smartInstallIds = ["doorbell-installation", "thermostat-installation", "garage-installation"];
const smartDeviceScopes = [
  "Install one compatible doorbell you provide in an accessible location, connect it to your app and existing Wi-Fi, and test it. Or get help with one app, connection or notification issue on an installed doorbell. New wiring and electrical work are outside this visit.",
  "Replace a working thermostat with one compatible model, connect it to your Wi-Fi and app, test it and learn the controls. Or get help with one app, connection or settings issue on your installed thermostat. New wiring, electrical work and HVAC repair are outside this visit.",
  "Add one compatible controller to a working opener, connect the app and test it. Or get help with one app, connection or settings issue on your installed controller. New wiring, electrical work, opener replacement, mechanical repair and safety-system adjustments are outside this visit.",
];

function renderSmartHomeMenu(selection, guide) {
  const cards = tasks[1].flatMap((_, id) => {
    const card = scheduledService(1, id);
    if (id === 4) return [card];
    return [{
      ...card,
      title: card.title.replace(/ Support$/, ""),
      detail: serviceScope(smartDeviceScopes[id - 1]) + card.detail,
      action: "Schedule Service",
      href: "#device/1/" + id,
    }];
  });
  const legacyIndex = smartInstallIds.indexOf(selection);
  return renderServiceMenu(1, legacyIndex < 0 ? selection : String(legacyIndex + 1), {
    title: "Smart home",
    subtitle: "On-site smart home installation and support in Walnut Creek and nearby communities.",
    status: selection === "retired" ? "That service is no longer offered. Choose a service below." : "",
    terms: "Pay after your visit on fixed-price services.",
    groups: [{ cards }],
    guide,
  });
}

function renderDeviceIntake(id) {
  const name = tasks[1][id][0].replace(/ Support$/, "");
  return `<section class="visit-menu-shell">
    <div class="visit-menu-hero">
      <a class="visit-menu-back" href="/smart-home">Back to smart home</a>
      <h1 tabindex="-1" id="device-intake-title">${esc(name)}</h1>
      <p class="visit-menu-subtitle">What do you need help with?</p>
    </div>
    <div class="visit-menu-service visit-menu-detail">
      <p>Kyle checks compatibility before scheduling an installation.</p>
      <a class="visit-menu-action" href="/request-help?service=smart-home&amp;installation=${smartInstallIds[id - 1]}">Install a device</a>
      <p>Already installed? Book a visit for help with one issue.</p>
      <a class="visit-menu-action" href="#book/1/${id}">Troubleshoot an installed device</a>
    </div>
  </section>`;
}
