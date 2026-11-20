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

function renderSmartHomeMenu(selection, guide) {
  const installations = [
    ["doorbell-installation", "Video Doorbell Installation",
      serviceScope("Install one compatible customer-provided video doorbell in an accessible location, connect it to the app and existing Wi-Fi, and test operation.")],
    ["thermostat-installation", "Smart Thermostat Installation & Setup",
      serviceScope("Requires a working thermostat at the installation location.",
        "Assess the location and check compatibility.|Replace the existing thermostat with one compatible smart thermostat.|Connect it to existing Wi-Fi, complete initial setup and test operation.|Install and set up the mobile app.|Show how to use the everyday controls.",
        "New wiring and HVAC repair are excluded.")],
    ["garage-installation", "Smart Garage Controller Installation",
      serviceScope("One compatible controller on an existing working opener, app connection and an operation test.",
        "", "Opener replacement and mechanical repair are excluded.")],
  ];
  const installationCards = installations.map(([id, title, scope]) => ({
    id,
    title,
    icon: "smart-home",
    priceLabel: "$249",
    detail: '<p>Tell Kyle about your device and setup. No new wiring or electrical work is included.</p><h4>Service details</h4>' + scope,
    href: "/request-help?service=smart-home&installation=" + id,
    action: "Ask Kyle about installation",
  }));
  return renderServiceMenu(1, selection, {
    title: "Smart home",
    subtitle: "On-site smart home installation and support in Walnut Creek and nearby communities.",
    status: selection === "retired" ? "That service is no longer offered. Choose an installation inquiry or support service below." : "",
    groups: [
      { heading: "Installation", note: "Kyle confirms scope, price and availability before scheduling.", cards: installationCards },
      { heading: "Support", note: paymentNote, cards: tasks[1].map((_, id) => scheduledService(1, id)) },
    ],
    guide,
  });
}
