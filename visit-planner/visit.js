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
      typeof renderWifiPreview === "function" ? "New WiFi Connection Setup" : "Router / Wi-Fi setup",
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
  ["Get a personal computer lesson", "user", 229, "Practice one everyday task on your computer.", "Practice the task together|Take away a short set of steps to repeat", "Device repair and ongoing support", "Do you have access to your computer and one task to practice?"],
);
let category = 0,
  task = 0;
const contact = {
  method: "email",
  person: "",
  email: "",
  street: "",
  town: "",
  phone: "",
  arrival: "",
};

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
function zipError() {
  return !/^\d{5}$/.test(city)
    ? "Enter a five-digit visit ZIP."
    : "";
}
function errors() {
  return {
    person: contact.person.trim() ? "" : "Enter a name for the visit.",
    email: (!contact.email && contact.method !== "email") || /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(contact.email.trim())
      ? ""
      : "Enter a valid email address.",
    street:
      /^(?=.*[0-9])(?=.*[a-z]).{4,}$/i.test(contact.street.trim()) &&
      !/^(p\.?\s*o\.?\s*box|post office box)/i.test(contact.street.trim())
        ? ""
        : "Enter the visit street number and street name. A PO box cannot identify a visit address.",
    town:
      contact.town.trim() ? "" : "Enter the city for the visit address.",
    phone:
      (!contact.phone && contact.method === "email") ||
      /^\+?1?\d{10}$/.test(contact.phone.replace(/[\s().-]/g, ""))
        ? ""
        : "Enter a valid US phone number.",
  };
}
function hasContact() {
  return !Object.values(errors()).some(Boolean);
}
function feedback(key) {
  const el = document.getElementById(key),
    note = document.getElementById(key + "-error");
  if (note) {
    note.textContent = errors()[key] || "";
    el.setAttribute("aria-invalid", Boolean(note.textContent));
  }
}
function validateContact() {
  const invalid = Object.keys(errors()).filter((k) => errors()[k]);
  Object.keys(errors()).forEach(feedback);
  if (invalid.length) document.getElementById(invalid[0]).focus();
  else go("time");
}
const hints = {
  person: "name",
  email: "email",
  street: "street-address",
  town: "address-level2",
  phone: "tel",
  arrival: "off",
};
function field(key, label, type = "text") {
  return `<label for="${key}">${label}</label><input class="entry" id="${key}" name="${key}" maxlength="${({person:120,email:254,phone:40,street:240,town:90,arrival:800})[key]}" type="${type}" autocomplete="${hints[key]}" aria-describedby="${key}-error" value="${esc(contact[key])}" oninput="contact[this.id]=this.value;feedback(this.id)" onblur="feedback(this.id)"><span role="status" class="feedback" id="${key}-error"></span>`;
}
function zipChanged(el) {
  if (city !== el.value) {
    slot = "";
    for (const state of saved.values()) state.slot = "";
    city = el.value;
    document
      .querySelectorAll(".zip-summary,.slot-summary")
      .forEach((n) => n.remove());
  }
  document.querySelector("#outside").textContent = zipError();
}
function timingChanged(value) {
  slot = value.trim();
  const summary = document.querySelector(".slot-summary");
  summary.textContent = slot ? slot + " · Pacific" : "";
  summary.hidden = !slot;
}
function useFlexibleTime() {
  slot = "Flexible · ask Kyle to suggest a time";
  go("checkout");
}
function contactNext() {
  if (slot) go("checkout");
  else
    document.querySelector("#time-error").textContent =
      "Enter your timing preference or ask Kyle to suggest a time.";
}
function advanceFit() {
  document.querySelector("#outside").textContent = zipError();
  if (zipError()) {
    document.querySelector("#zip").focus();
    return;
  }
  if (fit !== "Yes") {
    document.querySelector("#fit-error").textContent = fit
      ? prep[category][task] + " Check the requirement or compare visits."
      : "Choose Yes, No, or Not sure.";
    document.querySelector("#fit").focus();
    return;
  }
  go("contact");
}
const saved = new Map();
let active = "";
function restore(c, t) {
  let key = c + "/" + t;
  if (key === active) return;
  if (active) saved.set(active, { fit, slot });
  active = key;
  ({ fit, slot } = saved.get(key) || {
    fit: "",
    slot: "",
  });
}

addSmartHomeSupport(tasks[1], prep[1]);

let city = "",
  fit = "",
  slot = "";
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
function options(a, v) {
  return a
    .map(
      (x) => "<option " + (x === v ? "selected" : "") + ">" + x + "</option>",
    )
    .join("");
}
const live = typeof window !== "undefined" && ["https://www.serviceboost.co", "https://serviceboost.co"].includes(location.origin) && window.SERVICE_BOOST_QUOTE_ENDPOINT === "https://quotes.serviceboost.co/quote";
const intake = createVisitIntake(live ? window.SERVICE_BOOST_QUOTE_ENDPOINT : null, live ? window.fetch.bind(window) : null);
function visitDuration(group = category, index = task) {
  if (group === 0 && index === 5) return "60 minutes";
  return tasks[group][index][2] === 199 ? "up to 45 minutes" : "up to 60 minutes";
}
function visitPayload() {
  const [name, , price, description, included, excluded] = tasks[category][task];
  const service = category === 0 ? (task === 1 ? "printer" : "computer")
    : ["", "smart-home", "wifi", "mobile"][category];
  return {
    project_type: "tech_support", service, reply_method: contact.method,
    name: contact.person.trim(), email: contact.email.trim(), phone: contact.phone.trim(),
    location: contact.town.trim() + ", CA " + city,
    problem: [
      name + " · $" + price + " · " + visitDuration(),
      description, "Included: " + included.split("|").join(", "), "Outside scope: " + excluded,
      "Visit address: " + contact.street.trim() + ", " + contact.town.trim() + ", CA " + city,
      "Preferred timing (Pacific): " + slot, "Pending manual confirmation; no appointment reserved.",
      "Payment due after the visit.", contact.arrival && "Arrival notes: " + contact.arrival,
    ].filter(Boolean).join("\n"),
  };
}
async function finishVisit() {
  if (zipError() || fit !== "Yes" || !hasContact() || !slot) return render();
  const status = document.querySelector("#delivery-status");
  const submit = document.querySelector("#finish-visit");
  if (submit.disabled) return;
  submit.disabled = true;
  status.textContent = live ? "Sending request…" : "";
  const result = await intake.submit(visitPayload());
  if (result === "disabled") go("done");
  else if (result === "invalid" || result === "limited") {
    submit.disabled = false;
    status.textContent = result === "invalid"
      ? "Request rejected. Check your contact details and address, then try again."
      : "Too many requests. Please wait before retrying or contact Kyle directly.";
  } else if (result === "unconfirmed" || result === "sending") {
    submit.disabled = false;
    status.textContent =
      "Delivery could not be confirmed. Your details are still here. Check with Kyle before retrying.";
  } else if (result === "accepted") {
    submit.textContent = "Request sent";
    status.textContent = "Request sent. Kyle will confirm your date and arrival window separately. Your visit is pending until Kyle accepts it.";
  }
}
function serviceCard(title, icon, priceLabel, expanded, action) {
  return `<button class="pick" aria-expanded="${!!expanded}" onclick="${action}"><img alt="" src="assets/icons/${icon}.svg"><b>${title}</b><span>${priceLabel}</span></button>`;
}
function render() {
  let [page, c, t] = location.hash.slice(1).split("/");
  const requestedPage = page;
  if (!["services","fit","contact","time","checkout","done","detail"].includes(page) ||
      !/^\d+$/.test(c) || !tasks[Number(c)] ||
      (page !== "services" && (!/^\d+$/.test(t) || !tasks[Number(c)][Number(t)]))) page = "home";
  category = /^\d+$/.test(c) && tasks[Number(c)] ? Number(c) : 0;
  task = /^\d+$/.test(t) && tasks[category][Number(t)] ? Number(t) : 0;
  if (t !== undefined && t !== "guide") restore(category, task);
  if (
    ["time", "contact", "checkout", "done"].includes(page) &&
    (zipError() || fit !== "Yes")
  )
    page = "fit";
  if (["time", "checkout", "done"].includes(page) && !hasContact())
    page = "contact";
  if (["checkout", "done"].includes(page) && !slot) page = "time";
  if (requestedPage !== page && page !== "home") {
    history.replaceState(null, "", "#" + page + "/" + category + "/" + task);
  }
  const [name, icon, base, desc, inc, exc, q] = tasks[category][task];
  const duration = visitDuration();
  const total = base;
  const cards = services
    .map(
      ([n, ic], j) =>
        `<button class="card" onclick="pick(${j})"><img alt="" src="assets/icons/${ic}.svg"><h3>${n}</h3><span class="category-arrow" aria-hidden="true">→</span></button>`,
    )
    .join("");
  if (page === "home") {
    root.innerHTML =
      `<section class="hybrid-hero"><div><h1>Get your tech working <span>&amp; get back to what matters.</span></h1><p>Local onsite tech help for your home or home office.</p><button id="hero-service-cta">Choose a service</button></div><div id="about" class="founder"><img src="assets/kyle-stephens.png" alt="Kyle Stephens"><div><h2>Hi, I’m Kyle.</h2><p>I’m the owner of Service Boost in Walnut Creek. You’ll work directly with me.</p></div></div></section>` +
      `<div id="services" class="bar"><h2 tabindex="-1">Services</h2></div><div id="pricing" class="cards">${cards}</div><p class="assisted-link"><a href="/request-help">Not sure what you need? Ask Kyle</a></p>
       <section id="process" aria-label="How to book a visit"><ol class="booking-steps">
         <li><span class="step-icon"><img src="assets/icons/message-circle.svg" alt=""></span>Choose a service<img class="step-arrow" src="assets/icons/arrow-right.svg" alt=""></li>
         <li><span class="step-icon"><img src="assets/icons/file-text.svg" alt=""></span>Request a time<img class="step-arrow" src="assets/icons/arrow-right.svg" alt=""></li>
         <li><span class="step-icon"><img src="assets/icons/user.svg" alt=""></span>Kyle confirms your visit</li>
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
        ? `<section class="scope"><h2>${name}</h2><p>${desc}</p><p>Visit duration: ${duration}.</p><div class="scope-grid"><div><h3>Included</h3><ul>${inc
            .split("|")
            .map((x) => "<li>" + x + "</li>")
            .join(
              "",
            )}</ul></div><div><h3>Outside scope</h3><p>${exc}</p></div></div><button onclick="go('fit')">Continue · $${total}</button></section>`
        : "";
    const computerTitles = ["Set up a new computer", "Set up or reconnect a printer", "Troubleshoot a computer or printer"];
    const cards = tasks[category].map(([title, icon, price], j) => {
      const open = selected && j === task;
      return serviceCard(category === 0 ? (computerTitles[j] || title) : title, icon,
        "$" + price, open, "choose(" + j + ")") + (category === 0 && open ? panel : "");
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
    if (category === 2 && !guide && typeof renderWifiPreview === "function") {
      root.innerHTML = renderWifiPreview(t, panel);
      return;
    }
    const askKyle = category === 0 ? '<p class="assisted-link"><a href="/request-help">Not sure what you need? Ask Kyle</a></p>' : "";
    root.innerHTML = `<section class="selection"><div class="path"><a href="#home">All services</a> / Choose a visit</div><h1>${services[category][0]}</h1><p>${paymentNote}</p>${picker}${category !== 0 || guide ? panel : ""}${askKyle}</section>`;
    return;
  }
  const sum = `<aside><div class="kicker">Visit summary</div><h3>${name}</h3><p>${duration}</p><p class="row"><span>One visit</span><b>$${base}</b></p><div class="rule"></div><div class="row"><span>Visit total</span><strong>$${total}</strong></div>${city ? '<p class="zip-summary">ZIP ' + esc(city) + "</p>" : ""}<p class="slot-summary" ${slot ? "" : "hidden"}>${slot ? esc(slot) + " · Pacific" : ""}</p><p>${paymentNote}</p></aside>`;
  let body = "";
  if (page === "detail") {
    location.replace("#services/" + category + "/" + task);
    return;
  }
  if (page === "fit") {
    body = `<p class="kicker">Step 1 of 4 · Visit fit</p><h1>Check your setup</h1><p>Serving ${cities.join(", ")}. Kyle will confirm coverage using your full address.</p><label for="zip">Visit ZIP code</label><input class="entry" id="zip" name="zip" autocomplete="postal-code" aria-describedby="outside" inputmode="numeric" maxlength="5" value="${esc(city)}" oninput="zipChanged(this)"><p class="feedback" id="outside" role="status">${city ? zipError() : ""}</p><label for="fit">${q}</label><select id="fit" onchange="fit=this.value;if(fit!=='Yes')slot='';render()"><option value="">Choose an answer</option>${options(["Yes", "Not sure", "No"], fit)}</select>${fit && fit !== "Yes" ? `<p>${prep[category][task]} <a href="#services/${category}/guide">See setup guidance</a> or return to the choices.</p>` : ""}<p class="feedback" id="fit-error" role="status"></p><div class="actions"><button class="secondary" onclick="location.hash='services/'+category+'/'+task">Back</button><button id="nexttime" onclick="advanceFit()">Contact and visit address →</button></div>`;
  }
  if (page === "time") {
    body = `<p class="kicker">Step 3 of 4 · Visit preference</p><h1>Describe your preferred timing</h1><p>Kyle will confirm availability separately. Visit duration: ${duration}.</p><label for="timing">Timing preference (Pacific time)</label><input id="timing" class="entry" maxlength="160" value="${esc(slot)}" oninput="timingChanged(this.value)"><button class="secondary" onclick="useFlexibleTime()">Ask Kyle to suggest a time</button><p id="time-error" role="status" class="feedback"></p><div class="actions"><button class="secondary" onclick="go('contact')">Back</button><button onclick="contactNext()">Review visit →</button></div>`;
  }
  if (page === "contact") {
    body = `<p class="kicker">Step 2 of 4 · Visit details</p><h1>Contact &amp; address</h1><p>${live ? "Kyle will check your full address and confirm coverage." : "Use fictional details for this preview."}</p><div class="pair"><div>${field("person", "Name")}</div><div>${field("email", contact.method === "email" ? "Email" : "Email (optional)", "email")}</div></div><label for="method">How should Kyle confirm the visit?</label><select id="method" onchange="contact.method=this.value;render()">${["email","call","text"].map(m => `<option value="${m}" ${m === contact.method ? "selected" : ""}>${{email:"Email",call:"Phone call",text:"Text message"}[m]}</option>`).join("")}</select>${field("phone", contact.method === "email" ? "Phone (optional)" : "Phone", "tel")}${field("street", "Street address, including unit")}<div class="pair"><div>${field("town", "City")}</div><div><label>Visit ZIP code</label><p>${esc(city)}</p></div></div><a href="#fit/${category}/${task}">Edit visit ZIP</a>${field("arrival", "Arrival notes (optional)")}<div class="actions"><button class="secondary" onclick="go('fit')">Back</button><button id="review" onclick="validateContact()">Enter a timing preference →</button></div>`;
  }
  if (page === "checkout") {
    body = `<p class="kicker">Step 4 of 4 · Request review</p><h1>Review your visit</h1><h3>${name}</h3><p>${desc}</p><p>Visit duration: ${duration}.</p><p><b>Included</b> · ${inc.split("|").join(" · ")}</p><p><b>Outside scope</b> · ${exc}</p><div class="rule"></div><h3>Preferred arrival window</h3><p>${esc(slot)}, Pacific<br>${esc(contact.person)} · ${esc(contact.email)}<br>${esc(contact.street)}, ${esc(contact.town)}, CA ${esc(city)}</p><p><strong>Fixed visit price · $${total}</strong></p><p>Payment is due after the visit. Kyle will confirm payment options before the visit.<br>To cancel or reschedule, notify Kyle as soon as possible. There is no fee.<br>Kyle will confirm the date and arrival window by ${contact.method}. Your request is pending until Kyle accepts it.</p>${contact.phone ? "<p>Phone · " + esc(contact.phone) + "</p>" : ""}${contact.arrival ? "<p>Arrival · " + esc(contact.arrival) + "</p>" : ""}<div class="editlinks">${[
      ["services", "Edit service"],
      ["fit", "Edit ZIP / fit"],
      ["time", "Edit time"],
      ["contact", "Edit contact / address"],
    ]
      .map(
        ([p, title]) =>
          '<a href="#' +
          p +
          "/" +
          category +
          "/" +
          task +
          '">' +
          title +
          "</a>",
      )
      .join(
        "",
      )}</div><div class="actions"><button class="secondary" onclick="go('time')">Back</button><button id="finish-visit" onclick="finishVisit()">${live ? "Send visit request" : "Finish request preview"}</button></div><p id="delivery-status" role="status"></p>`;
  }
  if (page === "done" && live) { go("checkout"); return; }
  if (page === "done") {
    body =
      `<h1>Preview complete</h1><p>Sending is disabled. No appointment has been reserved or payment collected.</p><h2>Prepared inquiry</h2><p>${esc(contact.person)} · ${esc(contact.email)}</p><p>${esc(visitPayload().problem).replaceAll("\n", "<br>")}</p><a href="#checkout/${category}/${task}">Return to review</a>`;
  }
  root.innerHTML = `<div class="path"><a href="#home">All services</a> / <a href="#services/${category}">${services[category][0]}</a> / ${name} · ${{ detail: "Scope", fit: "Visit fit", time: "Appointment", contact: "Contact and address", checkout: "Checkout", done: "Complete" }[page]}</div><div class="mobile-total"><b>${name}</b><span>$${total}</span></div><div class="layout"><section class="panel">${body}</section>${sum}</div>`;
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
