function renderWifiMenu(selection, guide) {
  const cards = tasks[2].map((_, id) => scheduledService(2, id));
  return renderServiceMenu(2, selection, {
    title: "Wi-Fi & network",
    fixedPrice: cards[0].priceLabel,
    groups: [{ cards }],
    guide,
  });
}
