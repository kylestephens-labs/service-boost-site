const wifiInquiries = {
  extension: {
    title: "Wi-Fi Signal Extension",
    priceLabel: "$249",
    detail: "Tell Kyle where Wi-Fi is weak and what equipment you have. He’ll review your setup and discuss options and pricing.",
  },
  cabling: {
    title: "In-Wall Cable Running",
    // The existing $249 rate needs a confirmed standard scope before it can be displayed again.
    detail: "Describe where the network cable needs to go and what access is available. Kyle reviews the route, access, materials, scope, price, and any applicable qualifications and permits before accepting work. This inquiry covers network cable only.",
  },
  connectivity: {
    title: "Connectivity Support",
    priceLabel: "$229",
    detail: "Tell Kyle which devices are having connection problems and when it happens. He’ll review the issue and confirm the scope and price before scheduling.",
  },
};

function renderWifiMenu(selection, guide) {
  function inquiry(id) {
    const { title, detail, priceLabel } = wifiInquiries[id];
    return {
      id,
      title,
      icon: "wifi",
      priceLabel: priceLabel ?? "Ask Kyle",
      detail: serviceScope(detail),
      href: "/request-help?service=wifi&network=" + id,
      action: priceLabel ? "Schedule Service" : "Ask Kyle about " + title.toLowerCase(),
    };
  }
  return renderServiceMenu(2, selection, {
    title: "Wi-Fi & network",
    subtitle: "On-site router setup and network help in Walnut Creek and nearby communities.",
    groups: [
      { heading: "Setup & installation", note: "Router setup is fixed price, with payment after your visit.",
        cards: [scheduledService(2, 0), inquiry("extension"), inquiry("cabling")] },
      { heading: "Support", cards: [inquiry("connectivity")] },
    ],
    guide,
  });
}
