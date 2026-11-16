const services = [
  [
    "Computer and printer support",
    "device-laptop",
    129,
    "Get one new computer ready for daily use.",
    "Set up one user profile|Connect to working Wi-Fi|Install updates and verify sign-in",
    "Data migration, hardware repair and account recovery",
    "Is this a working Windows PC or Mac with account access?",
    "Connect one extra display",
    20,
  ],
  [
    "Smart home",
    "smart-home",
    99,
    "Pair one compatible plug-in or battery device.",
    "Pair one supported device with its app|Connect to compatible Wi-Fi|Test one control or alert",
    "Drilling, mounting, ladders and fixed wiring. Ring devices must already be safely mounted or usable on a table.",
    "Is it plug-in or battery powered, compatible with your Wi-Fi and ready to pair without mounting or wiring?",
    "Pair a second compatible device",
    35,
  ],
  [
    "Wi-Fi &amp; network",
    "wifi",
    119,
    "Set up one router on your existing internet line.",
    "Configure one supported router|Connect two devices|Test connectivity at the router",
    "ISP repair, cable runs and whole-home coverage guarantees",
    "Is your internet service active with an accessible modem?",
    "Connect two more devices",
    20,
  ],
  [
    "Mobile devices",
    "device-mobile",
    89,
    "Set up one device and its essential settings.",
    "Connect one phone or tablet to Wi-Fi|Set up one existing account|Check updates and notifications",
    "Carrier activation, account recovery and data transfer",
    "Can you unlock the device and sign into your account?",
    "Set up one additional email account",
    15,
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
      "Smart-home device pairing",
      "Router setup",
      "Phone or tablet setup",
    ][j],
    ...s.slice(1),
  ],
]);
tasks[0].push(
  [
    "Printer connection",
    "printer",
    89,
    "Connect one compatible printer to one computer.",
    "Install its driver|Connect over USB or working Wi-Fi|Print a test page",
    "Ink, hardware repairs and network repairs",
    "Do you have a compatible printer, ink and access to the computer?",
    "Connect a second computer",
    25,
  ],
  [
    "Troubleshooting",
    "tool",
    109,
    "Assess one computer or printer issue for up to 45 minutes.",
    "Check symptoms and settings|Try a safe adjustment if appropriate|Explain findings and next steps",
    "Parts, data recovery, additional issues or a guaranteed fix",
    "Can you show Kyle one issue on a device you can access?",
    "",
    0,
  ],
);
let category = 0,
  task = 0;
const contact = {
  person: "",
  email: "",
  street: "",
  town: "",
  phone: "",
  arrival: "",
};
const coverage = new Set(
  "94595 94596 94597 94598 94523 94518 94519 94520 94521 94549 94563 94556 94507 94506 94526 94553 94517 94582 94583".split(
    " ",
  ),
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
const towns = [
  "Walnut Creek",
  "Walnut Creek",
  "Walnut Creek",
  "Walnut Creek",
  "Pleasant Hill",
  "Concord",
  "Concord",
  "Concord",
  "Concord",
  "Lafayette",
  "Orinda",
  "Moraga",
  "Alamo",
  "Danville",
  "Danville",
  "Martinez",
  "Clayton",
  "San Ramon",
  "San Ramon",
];
const townFor = Object.fromEntries([...coverage].map((z, j) => [z, towns[j]]));
const prep = [
  [
    "Check that the computer starts and that you can sign into your account.",
    "Check the printer model, confirm it has ink, and have your computer ready.",
    "Write down one symptom or error message and confirm you can unlock the affected device.",
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
    : !coverage.has(city)
      ? "Outside the sample coverage area. Check the ZIP or return to the service choices. Choose a new window after correcting the ZIP."
      : "";
}
function errors() {
  return {
    person: contact.person.trim() ? "" : "Enter a name for the visit.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)
      ? ""
      : "Enter an email such as avery@example.invalid.",
    street:
      /^(?=.*[0-9])(?=.*[a-z]).{4,}$/i.test(contact.street.trim()) &&
      !/^(p\.?\s*o\.?\s*box|post office box)/i.test(contact.street.trim())
        ? ""
        : "Enter the visit street number and street name. A PO box cannot identify a visit address.",
    town:
      contact.town.trim().toLowerCase() === townFor[city]?.toLowerCase()
        ? ""
        : "For this sample ZIP, enter " +
          (townFor[city] || "a covered city") +
          " or edit the visit ZIP.",
    phone:
      !contact.phone ||
      /^\+?1?\d{10}$/.test(contact.phone.replace(/[\s().-]/g, ""))
        ? ""
        : "Use a ten-digit US phone number or leave it blank.",
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
  return `<label for="${key}">${label}</label><input class="entry" id="${key}" name="${key}" type="${type}" autocomplete="${hints[key]}" aria-describedby="${key}-error" value="${esc(contact[key])}" oninput="contact[this.id]=this.value;feedback(this.id)" onblur="feedback(this.id)"><span role="status" class="feedback" id="${key}-error"></span>`;
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
let week = 0;
const pacificDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const nextMonday = new Date(pacificDay + "T12:00:00Z");
nextMonday.setUTCDate(
  nextMonday.getUTCDate() +
    ((8 - nextMonday.getUTCDay()) % 7) +
    (nextMonday.getUTCDay() === 1 ? 7 : 0),
);
function dateLabel(offset) {
  const day = new Date(nextMonday);
  day.setUTCDate(day.getUTCDate() + offset);
  return day.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
const weeks = [
  [dateLabel(1) + " · 9–11 am", dateLabel(2) + " · 1–3 pm"],
  [],
  [dateLabel(15) + " · 9–11 am", dateLabel(18) + " · 10 am–noon"],
];
function changeWeek(v) {
  week = Number(v);
  slot = "";
  render();
}
function useFlexibleTime() {
  slot = "Flexible · ask Kyle to suggest a time";
  go("checkout");
}
function contactNext() {
  if (slot) go("checkout");
  else
    document.querySelector("#time-error").textContent =
      "Choose an arrival window, or view another sample week.";
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
  if (active) saved.set(active, { fit, slot, extra, week });
  active = key;
  ({ fit, slot, extra, week } = saved.get(key) || {
    fit: "",
    slot: "",
    extra: false,
    week: 0,
  });
}

let city = "",
  fit = "",
  extra = false,
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
function render() {
  let [page, c, t] = location.hash.slice(1).split("/");
  if (!["services","fit","contact","time","checkout","done","detail"].includes(page) ||
      !/^\d+$/.test(c) || !tasks[Number(c)] ||
      (page !== "services" && (!/^\d+$/.test(t) || !tasks[Number(c)][Number(t)]))) page = "home";
  category = /^\d+$/.test(c) && tasks[Number(c)] ? Number(c) : 0;
  task = /^\d+$/.test(t) && tasks[category][Number(t)] ? Number(t) : 0;
  if (t !== undefined && t !== "guide") restore(category, task);
  if (
    ["time", "contact", "checkout", "done"].includes(page) &&
    (!coverage.has(city) || fit !== "Yes")
  )
    page = "fit";
  if (["time", "checkout", "done"].includes(page) && !hasContact())
    page = "contact";
  if (["checkout", "done"].includes(page) && !slot) page = "time";
  const [name, icon, base, desc, inc, exc, q, add, fee] = tasks[category][task];
  const total = base + (extra ? fee : 0);
  const cards = services
    .map(
      ([n, ic, p, d], j) =>
        `<button class="card" onclick="pick(${j})"><img alt="" src="assets/icons/${ic}.svg"><h3>${n}</h3><p>${j === 0 ? "Set up a computer, connect a printer or diagnose an issue." : d}</p><span class="price">${j === 0 ? "From " : ""}$${Math.min(...tasks[j].map((s) => s[2]))} <small>sample visit price</small> →</span></button>`,
    )
    .join("");
  if (page === "home") {
    root.innerHTML =
      `<section class="hybrid-hero"><div><h1>Get your tech working <span>&amp; get back to what matters.</span></h1><p>Local onsite tech help for your home or home office.</p><button onclick="document.querySelector('.card').focus();document.querySelector('.bar').scrollIntoView()">Choose a service</button></div><div class="founder"><img src="assets/kyle-stephens.png" alt="Kyle Stephens"><div><h2>Hi, I’m Kyle.</h2><p>I’m the owner of Service Boost in Walnut Creek. You’ll work directly with me.</p></div></div></section>` +
      `<div class="bar"><h2>Services</h2><span>Homes &amp; home offices</span></div><div class="cards">${cards}</div>`;
    return;
  }
  if (page === "services") {
    const guide = t === "guide",
      selected =
        page === "services" && t !== undefined && !guide && tasks[category][t];
    const brief = [
      [
        "One new PC or Mac",
        "One printer, one computer",
        "One issue · up to 45 minutes",
      ],
      ["Pair one compatible device"],
      ["Set up one router"],
      ["Set up one phone or tablet"],
    ];
    const cards = tasks[category]
      .map(
        ([title, ic, price], j) =>
          `<button class="pick" aria-expanded="${!!selected && j === task}" onclick="choose(${j})"><img alt="" src="assets/icons/${ic}.svg"><b>${title}</b><small>${brief[category][j]}</small><span>$${price} sample</span></button>`,
      )
      .join("");
    const panel = guide
      ? `<section class="scope"><h2>Find the right visit</h2><p>Compare the requirements for this category.</p>${tasks[category].map(([n, , , , , , question], j) => `<p><b>${n}</b> · ${question}<br>${prep[category][j]} <a href="#services/${category}/${j}">Review this service</a></p>`).join("")}<p></p><p>If the scope still looks uncertain, review it with Kyle before booking. This preview sends no request.</p><a href="#services/${category}">Back to choices</a></section>`
      : selected
        ? `<section class="scope"><h2>${name}</h2><p>${desc}</p><div class="scope-grid"><div><h3>Included</h3><ul>${inc
            .split("|")
            .map((x) => "<li>" + x + "</li>")
            .join(
              "",
            )}</ul></div><div><h3>Outside scope</h3><p>${exc}</p></div></div>${add ? `<label><input type="checkbox" ${extra ? "checked" : ""} onchange="extra=this.checked;render()"> ${add} (+$${fee})</label>` : ""}<button onclick="go('fit')">Continue · $${total} sample</button></section>`
        : "";
    root.innerHTML = `<section class="selection"><div class="path"><a href="#home">All services</a> / Choose a visit</div><h1>${services[category][0]}</h1><p>Select a service to see what Kyle can help with.</p><div class="picker">${cards}<button class="pick" aria-expanded="${guide}" onclick="location.hash='services/'+category+'/guide'"><img alt="" src="assets/icons/message-circle.svg"><b>Not sure</b><small>Get help choosing a visit</small></button></div>${panel}</section>`;
    return;
  }
  const sum = `<aside><div class="kicker">Visit summary</div><h3>${name}</h3><p class="row"><span>One visit</span><b>$${base}</b></p>${extra ? '<p class="row"><span>' + add + "</span><b>$" + fee + "</b></p>" : ""}<div class="rule"></div><div class="row"><span>Sample total</span><strong>$${total}</strong></div>${city ? '<p class="zip-summary">ZIP ' + esc(city) + "</p>" : ""}${slot ? '<p class="slot-summary">' + slot + " · Pacific</p>" : ""}</aside>`;
  let body = "";
  if (page === "detail") {
    location.replace("#services/" + category + "/" + task);
    return;
  }
  if (page === "fit") {
    body = `<p class="kicker">Step 1 of 4 · Visit fit</p><h1>Check your setup</h1><label for="zip">Visit ZIP code</label><input class="entry" id="zip" name="zip" autocomplete="postal-code" aria-describedby="outside" inputmode="numeric" maxlength="5" value="${esc(city)}" oninput="zipChanged(this)"><p class="feedback" id="outside" role="status">${city ? zipError() : ""}</p><label for="fit">${q}</label><select id="fit" onchange="fit=this.value;if(fit!=='Yes')slot='';render()"><option value="">Choose an answer</option>${options(["Yes", "Not sure", "No"], fit)}</select>${fit && fit !== "Yes" ? `<p>${prep[category][task]} <a href="#services/${category}/guide">See setup guidance</a> or return to the choices.</p>` : ""}<p class="feedback" id="fit-error" role="status"></p><div class="actions"><button class="secondary" onclick="location.hash='services/'+category+'/'+task">Back</button><button id="nexttime" onclick="advanceFit()">Contact and visit address →</button></div>`;
  }
  if (page === "time") {
    body = `<p class="kicker">Step 3 of 4 · Visit preference</p><h1>Choose a preferred arrival window</h1><p>Kyle will confirm timing separately. These are preferences, not available appointments. Pacific time · Illustrative visit duration: ${category === 0 && task === 2 ? "up to 45 minutes" : "about 45–60 minutes"}.</p><label for="week">Sample week</label><select id="week" onchange="changeWeek(this.value)">${[dateLabel(0), dateLabel(7), dateLabel(14)].map((w, j) => '<option value="' + j + '" ' + (week === j ? "selected" : "") + ">Week of " + w + "</option>").join("")}</select>${weeks[week].map((s) => '<label class="window"><input type="radio" name="slot" ' + (slot === s ? "checked" : "") + ' onchange="slot=this.value;render()" value="' + s + '"> ' + s + "</label>").join("") || '<p>No suggested windows this week. Choose another week or leave the timing open.</p><button class="secondary" onclick="changeWeek(2)">View next sample week</button><button class="secondary" onclick="useFlexibleTime()">Ask Kyle to suggest a time</button>'}<p id="time-error" role="status" class="feedback"></p><div class="actions"><button class="secondary" onclick="go('contact')">Back</button><button onclick="contactNext()">Review visit →</button></div>`;
  }
  if (page === "contact") {
    body = `<p class="kicker">Step 2 of 4 · Visit details</p><h1>Contact &amp; address</h1><p>Use fictional details for this preview.</p><div class="pair"><div>${field("person", "Name")}</div><div>${field("email", "Email", "email")}</div></div>${field("phone", "Phone (optional)", "tel")}${field("street", "Street address, including unit")}<div class="pair"><div>${field("town", "City")}</div><div><label>Visit ZIP code</label><p>${esc(city)}</p></div></div><a href="#fit/${category}/${task}">Edit visit ZIP</a>${field("arrival", "Arrival notes (optional)")}<div class="actions"><button class="secondary" onclick="go('fit')">Back</button><button id="review" onclick="validateContact()">Choose a preferred window →</button></div>`;
  }
  if (page === "checkout") {
    body = `<p class="kicker">Step 4 of 4 · Request review</p><h1>Review your visit</h1><h3>${name}</h3><p>${desc}</p><p><b>Included</b> · ${inc.split("|").join(" · ")}</p><p><b>Outside scope</b> · ${exc}</p><div class="rule"></div><h3>Preferred arrival window</h3><p>${slot}, Pacific<br>${esc(contact.person)} · ${esc(contact.email)}<br>${esc(contact.street)}, ${esc(contact.town)}, CA ${esc(city)}</p><p><strong>Full illustrative price · $${total}</strong></p><p>Payment is due after the visit. Kyle will confirm accepted payment methods before you agree to the work.<br>Cancellation terms · Pending decision</p>${contact.phone ? "<p>Phone · " + esc(contact.phone) + "</p>" : ""}${contact.arrival ? "<p>Arrival · " + esc(contact.arrival) + "</p>" : ""}<div class="editlinks">${[
      ["services", "Edit scope / add-on"],
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
      )}</div><div class="actions"><button class="secondary" onclick="go('time')">Back</button><button onclick="go('done')">Finish request preview</button></div>`;
  }
  if (page === "done") {
    body =
      "<h1>Preview complete</h1><p>You reached the end of the sample booking. No request was sent, appointment reserved, or payment collected.</p><button onclick=\"go('home')\">Browse services</button>";
  }
  root.innerHTML = `<div class="path"><a href="#home">All services</a> / <a href="#services/${category}">${services[category][0]}</a> / ${name} · ${{ detail: "Scope", fit: "Visit fit", time: "Appointment", contact: "Contact and address", checkout: "Checkout", done: "Complete" }[page]}</div><div class="mobile-total"><b>${name}</b><span>$${total} sample</span></div><div class="layout"><section class="panel">${body}</section>${sum}</div>`;
}
addEventListener("hashchange", () => {
  render();
  scrollTo(0, 0);
});
render();
