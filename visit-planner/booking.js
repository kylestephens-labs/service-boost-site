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

  const diagnostic = description.includes("unresolved");
  root.innerHTML = `<a class="booking-change" href="#services/${id}">Change service</a>
  <div class="booking-layout">
    <div class="booking-service">
      <p class="booking-owner">Kyle Stephens</p>
      <h2 class="booking-name">${esc(name)}</h2>
      <p class="booking-payment"><strong>$${price}</strong> · Pay after your visit</p>
      <details class="booking-details"><summary>Service details</summary>
        <p>${esc(description)}</p>
        <p>No card required.</p>
        <h2>Included</h2><ul>${included.split("|").map(item => "<li>" + esc(item) + "</li>").join("")}</ul>
        <h2>Outside scope</h2><p>${esc(excluded)}</p>
        <h2>Before booking</h2><p>${esc(requirement)} ${esc(preparation)}</p>
        <h2>Service area</h2><p>${esc(cities.join(", "))}.</p>
        <p>Outside these cities or unsure about your setup? <a href="/request-help">Ask Kyle before booking</a>.</p>
        <p>Extra work requires your approval. Pay after your visit; Kyle will confirm payment options. Use your Google confirmation to cancel, or contact Kyle to change your visit. There is no cancellation fee.</p>
      </details>
    </div>
    <section class="booking-calendar" aria-label="Available arrival times">
      <h1 id="booking-title" tabindex="-1">Choose an arrival time</h1>
      ${diagnostic ? '<p class="booking-important">The visit fee applies even if the issue remains unresolved.</p>' : ""}
      ${enabled ? `<div class="booking-options">
        <a href="${bookingURL("standard", id)}" target="visit-schedule">Tuesday, Friday, Saturday or Sunday</a>
        <a href="${bookingURL("evening", id)}" target="visit-schedule">Monday or Thursday evening · 5–8 PM</a>
      </div>
      <iframe name="visit-schedule" title="Google Calendar appointment times and booking form" src="${bookingURL("standard", id)}"></iframe>
      <details class="booking-details"><summary>Open directly in Google Calendar</summary>
        <p><a href="${bookingURL("standard", id)}">Tuesday, Friday, Saturday or Sunday visits</a></p>
        <p><a href="${bookingURL("evening", id)}">Monday or Thursday evening visits</a></p>
      </details>` : '<p class="booking-disabled">Review preview: scheduling is disabled. No appointment can be booked here.</p>'}
      <p class="booking-help"><a href="/request-help">Not sure? Ask Kyle</a></p>
    </section>
  </div>`;
  root.querySelector?.("#booking-title")?.focus({preventScroll: true});
}
