const wifiInquiries = {
  coverage: {
    title: "Wi-Fi Coverage & Connection Help",
    detail: "Tell Kyle where Wi-Fi is weak or which devices have connection problems, when it happens and what network equipment you have. Kyle reviews the scope before scheduling a visit for one coverage or connection issue.",
  },
  cabling: {
    title: "In-Wall Cable Running",
    detail: "Describe where the network cable needs to go and what access is available. Kyle reviews the route, access, materials, scope, price, and any applicable qualifications and permits before accepting work. This inquiry covers network cable only.",
  },
};

function renderWifiMenu(selection, guide) {
  const router = scheduledService(2, 0);
  function inquiry(id) {
    const { title, detail } = wifiInquiries[id];
    return {
      id,
      title,
      icon: "wifi",
      priceLabel: router.priceLabel,
      detail: serviceScope(detail),
      href: "/request-help?service=wifi&network=" + id,
      action: "Schedule Service",
    };
  }
  return renderServiceMenu(2, selection, {
    title: "Wi-Fi & network",
    rates: [["Fixed price", router.priceLabel]],
    terms: "Pay after your visit on fixed-price services.",
    groups: [{ cards: [router, inquiry("coverage"), inquiry("cabling")] }],
    guide,
  });
}
