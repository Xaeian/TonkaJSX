// .tests/shot.js
//
// Opens one panel for a screenshot: `--panel=` names its rail button by the start of its title,
// `--press=` the start of a button to press there (`Login` is the topbar's one),
// and `--scroll=` how far down the content goes, in px.
// The answer fails when no rail button matches `--panel=`.

(async () => {
  const frame = (ms) => new Promise((r) => setTimeout(r, ms));
  const { panel = "Welcome", press, scroll } = window.__ARGS || {};
  // a button's words without its icon, whose ligature is text as well
  const label = (b) => (b.querySelector(".btn-label") ?? b).textContent.trim().toLowerCase();
  const tip = (b) => (b.dataset.tooltip || "").toLowerCase();
  const rail = [...document.querySelectorAll(".sidebar .btn-rail")];
  const nav = rail.find((b) => tip(b).startsWith(panel.toLowerCase()));
  nav?.click();
  await frame(300);
  if(scroll) document.querySelector(".content").scrollTop = Number(scroll);
  if(press) {
    const btns = [...document.querySelectorAll(".content .btn, .topbar .btn")];
    btns.find((b) => b.offsetParent && label(b).startsWith(press.toLowerCase()))?.click();
    await frame(400);
  }
  return nav ? `PASS shot ${nav.dataset.tooltip}` : "FAIL shot of nothing: no such panel";
})();
