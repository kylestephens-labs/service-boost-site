const serviceHeader = document.querySelector(".global-header");
const serviceShortcut = document.querySelector(".service-shortcut");
const mobileNav = matchMedia("(max-width: 760px)");

function updateServiceShortcut() {
  const heroButton = document.getElementById("hero-service-cta");
  const offset = mobileNav.matches ? 0 : serviceHeader.offsetHeight;
  document.documentElement.style.setProperty("--header-offset", offset + "px");
  serviceShortcut.hidden = !heroButton || heroButton.getBoundingClientRect().bottom > offset;
}

document.addEventListener("click", event => {
  if (!event.target.closest('#hero-service-cta, a[href="/#services"]')) return;
  const services = document.getElementById("services");
  if (!services) return;
  event.preventDefault();
  services.querySelector("h2").focus({ preventScroll: true });
  services.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  });
});

document.addEventListener("scroll", updateServiceShortcut, { passive: true, capture: true });
addEventListener("hashchange", updateServiceShortcut);
addEventListener("pageshow", updateServiceShortcut);
addEventListener("resize", updateServiceShortcut);
new ResizeObserver(updateServiceShortcut).observe(serviceHeader);
updateServiceShortcut();
