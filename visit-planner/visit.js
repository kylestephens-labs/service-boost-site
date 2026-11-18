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
    199,
    "Pair one compatible plug-in or battery device.",
    "Pair one supported device with its app|Connect to compatible Wi-Fi|Test one control or alert",
    "Drilling, mounting, ladders and fixed wiring. Ring mounting requires a separate scope and price agreed with Kyle.",
    "Is it plug-in or battery powered, compatible with your Wi-Fi and ready to pair without mounting or wiring?",

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
      "Smart-home device setup",
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
let category = 0,
  task = 0;
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
  [
    "Check the model and app requirements. Confirm it can be paired without mounting or wiring.",
  ],
  [
    "Check that internet service is active at the modem and that you can access the router.",
  ],
  [
    "Confirm you can unlock the phone or tablet and sign into the account used for setup.",
  ],
];
addSmartHomeSupport(tasks[1], prep[1]);

const root = document.querySelector("main");
function go(page) {
  location.hash =
    page === "home"
      ? page
      : page + "/" + category + (page === "services" ? "" : "/" + task);
}
function pick(n) {
  category = n;
  task = 0;
  go("services");
}
function choose(n) {
  task = n;
  location.hash = "services/" + category + "/" + n;
}
function serviceCard(title, icon, priceLabel, expanded, action) {
  return `<button class="pick" aria-expanded="${!!expanded}" onclick="${expanded ? "location.hash='services/'+category" : action}"><img alt="" src="assets/icons/${icon}.svg"><b>${title}</b><span>${priceLabel}</span></button>`;
}
function render() {
  let [page, c, t] = location.hash.slice(1).split("/");
  const requestedPage = page;
  if (!["services","book","fit","contact","time","checkout","done","detail"].includes(page) ||
      !/^\d+$/.test(c) || !tasks[Number(c)] ||
      (page !== "services" && (!/^\d+$/.test(t) || !tasks[Number(c)][Number(t)]))) page = "home";
  category = /^\d+$/.test(c) && tasks[Number(c)] ? Number(c) : 0;
  task = /^\d+$/.test(t) && tasks[category][Number(t)] ? Number(t) : 0;
  if (["fit", "contact", "time", "checkout", "done"].includes(page)) page = "book";
  if (requestedPage !== page && page !== "home") {
    history.replaceState(null, "", "#" + page + "/" + category + "/" + task);
  }
  document.body.classList.toggle("booking-page", page === "book");
  const [name, icon, base, desc, inc, exc, q] = tasks[category][task];
  const total = base;
  const cards = services
    .map(
      ([n, ic], j) =>
        `<button class="card" onclick="pick(${j})"><img alt="" src="assets/icons/${ic}.svg"><h3>${n}</h3><span class="category-arrow" aria-hidden="true">→</span></button>`,
    )
    .join("");
  if (page === "home") {
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
    const guide = t === "guide",
      selected =
        page === "services" && t !== undefined && !guide && tasks[category][t];
    const panel = guide
      ? `<section class="scope"><h2>Find the right visit</h2><p>Compare the requirements for this category.</p>${tasks[category].map(([n, , , , , , question], j) => `<p><b>${n}</b> · ${question}<br>${prep[category][j]} <a href="#services/${category}/${j}">Review this service</a></p>`).join("")}<p></p><p><a href="https://www.serviceboost.co/request-help">Not sure? Ask Kyle</a> and agree on the scope and price before booking.</p><a href="#services/${category}">Back to choices</a></section>`
      : selected
        ? `<section class="scope"><h2>${name}</h2><p>${desc}</p><div class="scope-grid"><div><h3>Included</h3><ul>${inc
            .split("|")
            .map((x) => "<li>" + x + "</li>")
            .join(
              "",
            )}</ul></div><div><h3>Outside scope</h3><p>${exc}</p></div></div><button onclick="go('book')">Choose a time</button></section>`
        : "";
    const computerTitles = ["Set up a new computer", "Set up or reconnect a printer", "Troubleshoot a computer or printer"];
    const cards = tasks[category].map(([title, icon, price], j) => {
      const open = selected && j === task;
      return serviceCard(category === 0 ? (computerTitles[j] || title) : title, icon,
        "$" + price, open, "choose(" + j + ")") + (open ? panel : "");
    });
    const guideCard = category === 0 ? "" : `<button class="pick" aria-expanded="${guide}" onclick="location.hash='services/'+category+'/guide'"><img alt="" src="assets/icons/message-circle.svg"><b>Not sure? Ask Kyle</b></button>`;
    let picker = `<div class="picker${category === 0 ? " computer-packages" : ""}">${cards.join("")}${guideCard}</div>`;
    if (category === 0) {
      const folderOpen = t === "folder";
      const folder = serviceCard("Back up or transfer a folder", "file-text", "Request a quote", folderOpen, "location.hash='services/0/folder'")
        + (folderOpen ? '<section class="scope"><h2>Back up or transfer a folder</h2><p>Copy one selected folder from one working computer to one accessible, working drive you provide. Open a sample of the copied files together.</p><h3>Outside scope</h3><p>Full-device migration, damaged drives and data recovery.</p><a href="/request-help">Request a quote</a></section>' : "");
      const group = (heading, entries) => `<section class="service-group"><h2>${heading}</h2><div class="picker computer-packages">${entries.join("")}</div></section>`;
      picker = group("Setup &amp; installation", [cards[0], cards[1], cards[3], folder])
        + group("Help &amp; learning", [cards[2], cards[4], cards[5]]);
    }
    if (category === 1 && !guide) {
      root.innerHTML = renderSmartHomeMenu(t, panel);
      return;
    }
    if (category === 2 && !guide) {
      root.innerHTML = renderWifiMenu(t, panel);
      return;
    }
    const askKyle = category === 0 ? '<p class="assisted-link"><a href="/request-help">Not sure what you need? Ask Kyle</a></p>' : "";
    root.innerHTML = `<section class="selection"><div class="path"><a href="#home">All services</a> / Choose a visit</div><h1>${services[category][0]}</h1><p>${paymentNote}</p>${picker}${guide ? panel : ""}${askKyle}</section>`;
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
  const anchor = location.hash.slice(1);
  if (["services", "pricing", "about", "process", "tech-faq"].includes(anchor)) {
    document.getElementById(anchor)?.scrollIntoView();
  } else {
    scrollTo(0, 0);
  }
}
addEventListener("hashchange", renderRoute);
renderRoute();
