const localSchedules = {
  standard: "AcZssZ11-vPts7Z8XtherQk68OGpdr6kyNf4ygdtKsTXzXvO1UsN7A9MkLeUNcm4rYT3WkhtHul2IXEX",
  evening: "AcZssZ2Cakp07wXZmVkZcSjUE6tEE4HXaQcjJhBGgxNIDOG-W9YolZDEP-ivJ7mZ2XqXsRzgnqsu_QwM",
};

function bookingURL(schedule, id) {
  const url = new URL("https://calendar.google.com/calendar/appointments/schedules/" + localSchedules[schedule]);
  url.searchParams.set("utm_source", "serviceboost");
  url.searchParams.set("utm_content", "service-" + id.replace("/", "-"));
  return url.href;
}

function renderBooking(root, service, id, preparation, cities) {
  const [name, , price, description, included, excluded, requirement] = service;
  const enabled = window.SERVICE_BOOST_BOOKING_ENABLED === true;

  if (enabled && window.SERVICE_BOOST_WORKSPACE_BOOKING) {
    const destination = new URL(window.SERVICE_BOOST_WORKSPACE_BOOKING);
    destination.searchParams.set("service", id);
    window.location.replace(destination.href);
    return;
  }

  const diagnostic = description.includes("unresolved");
  root.innerHTML = `<div class="booking-layout">
    <div class="booking-service">
      <a class="booking-change" href="#services/${id}">Change service</a>
      <h1 id="booking-title" tabindex="-1">Choose an arrival time</h1>
      <p class="booking-price"><span>${esc(name)}</span><strong>$${price}</strong></p>
      <p class="booking-payment">Pay after your visit · No card required · Pacific time</p>
      ${diagnostic ? '<p class="booking-important">' + esc(description) + '</p>' : ""}
      <details class="booking-details"><summary>Service details</summary>
        ${diagnostic ? "" : "<p>" + esc(description) + "</p>"}
        <h2>Included</h2><ul>${included.split("|").map(item => "<li>" + esc(item) + "</li>").join("")}</ul>
        <h2>Outside scope</h2><p>${esc(excluded)}</p>
        <h2>Before booking</h2><p>${esc(requirement)} ${esc(preparation)}</p>
        <h2>Service area</h2><p>${esc(cities.join(", "))}.</p>
        <p>Outside these cities or unsure about your setup? <a href="/request-help">Ask Kyle before booking</a>.</p>
        <p>Extra work requires your approval. Pay after your visit; Kyle will confirm payment options. Use your Google confirmation to cancel, or contact Kyle to change your visit. There is no cancellation fee.</p>
      </details>
    </div>
    <section class="booking-calendar" aria-label="Available arrival times">
      ${enabled ? `<div class="booking-options">
        <a href="${bookingURL("standard", id)}">Tuesday, Friday, Saturday or Sunday visits</a>
        <a href="${bookingURL("evening", id)}">Monday or Thursday evening visits</a>
      </div>` : '<p class="booking-disabled">Review preview: scheduling is disabled. No appointment can be booked here.</p>'}
      <p class="booking-help"><a href="/request-help">Not sure? Ask Kyle</a></p>
    </section>
  </div>`;
  root.querySelector?.("#booking-title")?.focus({preventScroll: true});
}
