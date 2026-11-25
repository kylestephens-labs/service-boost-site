const computerServiceTitles = {
  0: "Set up a new computer",
  1: "Printer Setup & Troubleshooting",
  2: "Computer troubleshooting",
};

function renderComputerMenu(selection, guide) {
  const scopes = {
    2: "The $" + tasks[0][2][2] + " covers a diagnostic visit for one computer or printer issue even if it remains unresolved, and Kyle asks for your approval before extra work.",
    5: "Practice one everyday task on your computer.",
  };
  const visit = id => scheduledService(0, id, { title: computerServiceTitles[id], scope: scopes[id], showExclusions: false });
  const folder = {
    id: "folder",
    title: "Back up or transfer a folder",
    icon: "file-text",
    priceLabel: "Request a quote",
    detail: serviceScope(
      "Copy one selected folder from a working computer to an accessible, working drive you provide.",
      "Open a sample of the copied files together",
      "Full-device migration, damaged drives, and data recovery are outside this service.",
    ),
    href: "/request-help",
    action: "Request a quote",
  };
  return renderServiceMenu(0, selection, {
    title: ["Computer and", "printer support"],
    subtitle: "On-site setup and troubleshooting in Walnut Creek and nearby communities.",
    terms: "Fixed prices where shown. Pay after your visit.",
    groups: [
      { heading: "Setup & installation", cards: [visit(0), visit(1), visit(3), folder] },
      { heading: "Help & learning", cards: [visit(2), visit(4), visit(5)] },
    ],
    guide,
  });
}
