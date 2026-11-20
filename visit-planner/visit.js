const paymentNote = "Fixed-price services · Pay after your visit";
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
    229,
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
document.body.classList.add("menu");
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
    "Printer setup or reconnection",
    "printer",
    199,
    "Connect one working printer to an existing working network for up to two computers.",
    "Install its driver|Connect up to two computers|Print a test page",
    "Ink, hardware repairs and network repairs",
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

const root = document.querySelector("main");
let cardToRefocus;
function pick(n) {
  location.hash = "services/" + n;
}
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
  const requestedPage = page;
  const visitRoute = ["services","book","fit","contact","time","checkout","done","detail"].includes(page);
  const wifiInquiry = visitRoute && /^\d+$/.test(c) && Number(c) === 2 && Object.hasOwn(wifiInquiries, t);
  if (wifiInquiry) page = "services";
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
    history.replaceState(null, "", "#" + page + "/" + category + "/" + (wifiInquiry ? t : task));
  }
  document.body.classList.toggle("booking-page", page === "book");
  document.body.classList.toggle("visit-menu-page", page === "services");
  if (page === "home") {
    const cards = services.map(([name, icon], id) =>
      `<button class="card" onclick="pick(${id})"><img alt="" src="assets/icons/${icon}.svg"><h3>${name}</h3><span class="category-arrow" aria-hidden="true">→</span></button>`
    ).join("");
    root.innerHTML =
      `<section class="hybrid-hero"><div><h1>Get your tech working <span>&amp; get back to what matters.</span></h1><p>Local onsite tech help for your home or home office.</p><button id="hero-service-cta">Choose a service</button></div></section>` +
      `<div id="services" class="bar"><h2 tabindex="-1">Services</h2></div><div id="pricing" class="cards">${cards}</div><p class="assisted-link"><a href="/request-help">Not sure what you need? Ask Kyle</a></p>
       <section id="about" class="founder"><img src="assets/kyle-stephens.png" alt="Kyle Stephens"><div><h2>Hi, I’m Kyle.</h2><p>I own Service Boost in Walnut Creek. You’ll work directly with me.</p></div></section>
       <section id="process" aria-label="How to book a visit"><ol class="booking-steps">
         <li><span class="step-icon"><img src="assets/icons/message-circle.svg" alt=""></span>Choose a service<img class="step-arrow" src="assets/icons/arrow-right.svg" alt=""></li>
         <li><span class="step-icon"><img src="assets/icons/file-text.svg" alt=""></span>Choose a time<img class="step-arrow" src="assets/icons/arrow-right.svg" alt=""></li>
         <li><span class="step-icon"><img src="assets/icons/user.svg" alt=""></span>Book your visit</li>
       </ol></section>`;
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
        terms: paymentNote,
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
