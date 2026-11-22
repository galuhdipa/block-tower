// Part 4: GA4 with Consent Mode (deny by default).
// 1. Create a GA4 property + web data stream, copy the Measurement ID (G-…).
// 2. Paste it below. While it is still "G-XXXXXXXXXX", nothing is sent to Google
//    and events are only printed to the browser console.
const GA_ID = "G-XXXXXXXXXX";

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

gtag("consent", "default", {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied"
});

const GA_ENABLED = GA_ID !== "G-XXXXXXXXXX";
if (GA_ENABLED) {
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);
  gtag("js", new Date());
  gtag("config", GA_ID);
}

// Used by main.js for custom events
window.track = function (name, params = {}) {
  console.log("[analytics]", name, params);
  if (GA_ENABLED) gtag("event", name, params);
};

// Consent banner (choice is remembered for this browser)
(function () {
  const banner = document.getElementById("consent");
  let choice = null;
  try { choice = localStorage.getItem("analytics-consent"); } catch (e) {}

  function apply(value) {
    if (value === "granted") gtag("consent", "update", { analytics_storage: "granted" });
    banner.hidden = true;
    try { localStorage.setItem("analytics-consent", value); } catch (e) {}
  }

  if (choice) { apply(choice); return; }
  banner.hidden = false;
  document.getElementById("consent-accept").addEventListener("click", () => apply("granted"));
  document.getElementById("consent-decline").addEventListener("click", () => apply("denied"));
})();
