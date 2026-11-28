const services = [
  [
    "Computer and printer support",
    "device-laptop",
    229,
    "Get one new computer ready for daily use.",
    "Set up one user profile|Connect to working Wi-Fi|Install updates and verify sign-in",
    "Data migration, hardware repair and account recovery",
    "Is this a working Windows PC or Mac with account access?",

  ],
  [
    "Smart home",
    "smart-home",

  ],
  [
    "Wi-Fi &amp; network",
    "wifi",
    249,
    "Set up one router on your existing internet line.",
    "Configure one supported router|Connect up to two devices|Test connectivity at the router",
    "ISP repair, cable runs and whole-home coverage guarantees",
    "Is your internet service active with an accessible modem?",

  ],
  [
    "Mobile devices",
    "device-mobile",
    199,
    "Set up one device and its essential settings.",
    "Connect one phone or tablet to Wi-Fi|Set up one existing account|Check updates and notifications",
    "Carrier activation, account recovery and data transfer",
    "Can you unlock the device and sign into your account?",

  ],
];
const cities =
  "Walnut Creek, Pleasant Hill, Concord, Lafayette, Orinda, Moraga, Alamo, Danville, Martinez, Clayton, San Ramon".split(
    ", ",
  );
const tasks = services.map((s, j) => [
  [
    [
      "New computer setup",
      "",
      "New WiFi Connection Setup",
      "Phone or tablet setup",
    ][j],
    ...s.slice(1),
  ],
]);
tasks[0].push(
  [
    "Printer Setup & Troubleshooting",
    "printer",
    229,
    "Set up or reconnect one working printer on an existing working network for up to two computers, or troubleshoot one printer issue. For setup, Kyle installs the driver and prints a test page. The $229 covers one visit even if the issue remains unresolved. Kyle will explain the findings and agree on any extra work and price with you first.",
    "For setup: install the driver, connect up to two computers and print a test page|For troubleshooting: diagnose one issue, try a safe adjustment if appropriate and explain findings",
    "Ink, hardware repairs, network repairs, parts, data recovery and additional issues",
    "Do you have a compatible printer, ink and access to the computer?",

  ],
  [
    "Computer or printer troubleshooting",
    "tool",
    229,
    "Assess one computer or printer issue. The $229 covers the diagnostic visit and time even if the issue remains unresolved. Kyle will obtain your approval before any extra work.",
    "Check symptoms and settings|Try a safe adjustment if appropriate|Explain findings and next steps",
    "Parts, data recovery, additional issues or a guaranteed fix",
    "Can you show Kyle one issue on a device you can access?",

  ],
  ["Install and set up software", "device-laptop", 229, "Install one licensed app on one compatible computer.", "Install the app|Apply basic settings|Check that it opens", "Custom integrations and business deployments", "Do you have the license and a compatible computer?"],
  ["Set up or troubleshoot email", "message-circle", 229, "Connect one existing account in one mail app or investigate one sending or receiving issue.", "You sign in yourself|Check the account setup or investigate the issue", "Password recovery, mailbox migration and mail-server administration", "Can you sign in to the existing account?"],
  ["Get a personal computer lesson", "user", 229, "Practice one everyday task on your computer in a 60-minute lesson.", "Practice the task together|Take away a short set of steps to repeat", "Device repair and ongoing support", "Do you have access to your computer and one task to practice?"],
);
function esc(s) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
const prep = [
  [
    "Check that the computer starts and that you can sign into your account.",
    "Check the printer model, confirm it has ink, and have your computer ready.",
    "Write down one symptom or error message and confirm you can unlock the affected device.",
    "Have the license ready and check the app requirements.",
    "Confirm you can sign in to the account.",
    "Choose one task and have your computer ready.",
  ],
  new Array(1),
  [
    "Check that internet service is active at the modem and that you can access the router.",
  ],
  [
    "Confirm you can unlock the phone or tablet and sign into the account used for setup.",
  ],
];
// Keep retired pairing ID 0 empty so existing support IDs 1–4 never shift.
tasks[1] = new Array(1);
addSmartHomeSupport(tasks[1], prep[1]);
// Preserve existing support bookings. New device visits cover installation or support.
for (const [index, scope] of smartDeviceScopes.entries()) {
  const [supportName, icon, price, , , exclusions] = tasks[1][index + 1];
  const terms = scope + " Kyle checks compatibility and scope before installation. For support, the visit covers diagnosis even if the issue remains unresolved. Extra work requires your approval.";
  tasks[1].push([supportName.replace(/ Support$/, ""), icon, price, terms, "", exclusions, "Have the device and app available."]);
  prep[1].push("Identify the model and whether you need installation or troubleshooting.");
}
tasks[2].push(
  ["Wi-Fi Coverage & Connection Help", "wifi", 249, "Get help with one coverage or connection issue. Tell Kyle where Wi-Fi is weak or which devices have connection problems.", "", "", "Have your router or mesh equipment available."],
  ["In-Wall Cable Running", "wifi", 249, "Describe where the network cable needs to go and what access is available. Kyle reviews the route, access, materials, scope, price, and any applicable qualifications and permits before accepting work.", "", "Network cable only. New electrical wiring is outside this service.", "Identify both ends of the proposed cable route."],
);
prep[2].push("Note when the problem happens.", "Booking the visit does not confirm that installation can proceed.");

const root = document.querySelector("main");
const homeMarkup = root.innerHTML;
let cardToRefocus;
function renderVisitGuide(category) {
  const entries = tasks[category].map(([name, , , , , , question], id) =>
    '<p><b>' + esc(name) + '</b> · ' + esc(question) + '<br>' + esc(prep[category][id]) +
    ' <a href="#services/' + category + '/' + id + '">Review this service</a></p>').join("");
  return '<section class="scope"><h2>Find the right visit</h2><p>Compare the requirements for this category.</p>' + entries +
    '<p><a href="/request-help">Not sure? Ask Kyle</a> and agree on the scope and price before booking.</p>' +
    '<a href="#services/' + category + '">Back to choices</a></section>';
}
function render() {
  let [page, c, t] = location.hash.slice(1).split("/");
  if (page === "device" && c === "1" && /^[1-3]$/.test(t)) {
    page = "book";
    t = String(Number(t) + 4);
    history.replaceState(null, "", "#book/1/" + t);
  }
  const requestedPage = page;
  const visitRoute = ["services","book","fit","contact","time","checkout","done","detail"].includes(page);
  if (visitRoute && Number(c) === 2 && ["extension", "connectivity"].includes(t)) t = "coverage";
  if (visitRoute && c === "2" && ["coverage", "cabling"].includes(t)) {
    t = t === "coverage" ? "1" : "2";
  }
  if (visitRoute && /^\d+$/.test(c) && Number(c) === 1 && /^\d+$/.test(t) && Number(t) === 0) {
    page = "services";
    t = "retired";
    history.replaceState(null, "", "#services/1/retired");
  }
  if (!visitRoute ||
      !/^\d+$/.test(c) || !tasks[Number(c)] ||
      (page !== "services" && (!/^\d+$/.test(t) || !tasks[Number(c)][Number(t)]))) page = "home";
  const category = /^\d+$/.test(c) && tasks[Number(c)] ? Number(c) : 0;
  const task = /^\d+$/.test(t) && tasks[category][Number(t)] ? Number(t) : tasks[category].findIndex(Boolean);
  if (["fit", "contact", "time", "checkout", "done"].includes(page)) page = "book";
  if (requestedPage !== page && page !== "home" && t !== "retired") {
    history.replaceState(null, "", "#" + page + "/" + category + "/" + task);
  }
  document.body.classList.toggle("booking-page", page === "book");
  document.body.classList.toggle("visit-menu-page", page === "services");
  if (page === "home") {
    root.innerHTML = homeMarkup;
    return;
  }
  if (page === "services") {
    const guide = t === "guide" ? renderVisitGuide(category) : "";
    if (category === 0) {
      root.innerHTML = renderComputerMenu(t, guide);
    } else if (category === 1) {
      root.innerHTML = renderSmartHomeMenu(t, guide);
    } else if (category === 2) {
      root.innerHTML = renderWifiMenu(t, guide);
    } else {
      root.innerHTML = renderServiceMenu(3, t, {
        title: "Mobile devices",
        subtitle: "On-site phone and tablet setup in Walnut Creek and nearby communities.",
        fixedPrice: "$" + tasks[3][0][2],
        groups: [{ cards: [scheduledService(3, 0)] }],
        guide,
      });
    }
    return;
  }
  if (page === "detail") {
    location.replace("#services/" + category + "/" + task);
    return;
  }
  renderBooking(root, tasks[category][task], category + "/" + task, prep[category][task], cities);
}

function renderRoute() {
  render();
  const card = cardToRefocus && document.getElementById(cardToRefocus);
  cardToRefocus = undefined;
  if (card) {
    card.focus({ preventScroll: true });
    card.scrollIntoView({ block: "nearest" });
    return;
  }
  const anchor = location.hash.slice(1);
  if (["services", "pricing", "about", "process", "tech-faq"].includes(anchor)) {
    document.getElementById(anchor)?.scrollIntoView();
  } else {
    scrollTo(0, 0);
  }
}
addEventListener("hashchange", renderRoute);
renderRoute();
