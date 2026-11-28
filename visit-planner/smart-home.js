function addSmartHomeSupport(packages, guidance) {
  const devices = [
    ["Video Doorbell", "one already-installed doorbell", "app, connectivity or notification issues", ""],
    ["Smart Thermostat", "one already-installed thermostat", "app, connectivity or settings|Assess the thermostat and check its Wi-Fi connection|Check for app updates and troubleshoot the reported issue|Demonstrate everyday controls and answer questions about using them", ", HVAC or electrical repair"],
    ["Smart Garage Controller", "one already-installed controller", "app, connectivity or settings", ", mechanical repair or safety-system adjustments"],
    ["Smart Hub & Speaker", "one hub or speaker", "its app or connection to working Wi-Fi", ""],
  ];
  for (const [name, device, focus, exclusions] of devices) {
    const question = "Can you access " + device + " and its app?";
    packages.push([name + " Support", "smart-home", 249,
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
  const cards = [1, 2, 3].map(id => ({
    ...scheduledService(1, id + 4),
    id,
    action: "Schedule Service",
  }));
  cards.push(scheduledService(1, 4));
  if (["5","6","7"].includes(selection)) selection = String(Number(selection) - 4);
  const legacyIndex = smartInstallIds.indexOf(selection);
  return renderServiceMenu(1, legacyIndex < 0 ? selection : String(legacyIndex + 1), {
    title: "Smart home",
    status: selection === "retired" ? "That service is no longer offered. Choose a service below." : "",
    fixedPrice: cards[0].priceLabel,
    groups: [{ cards }],
    guide,
  });
}
