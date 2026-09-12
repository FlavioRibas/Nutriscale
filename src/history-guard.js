// Keeps the user inside the NutriScale single-page app when they first use the browser Back button.
// main3.jsx still owns normal in-app history states (Home, Recipes, Planner, Shopping, recipe detail).
(function () {
  try {
    const current = window.history.state || {};
    if (!current.nutriscaleRoot && !current.nutriscale) {
      window.history.replaceState({ ...current, nutriscaleRoot: true }, '', window.location.href);
      window.history.pushState({ nutriscaleRoot: true, nutriscaleGuard: true }, '', window.location.href);
    }
  } catch (_) {
    // History support is progressive enhancement; the app must still load if unavailable.
  }
})();
