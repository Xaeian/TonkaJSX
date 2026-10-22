// scripts/ui/Tooltip.jsx

/**
 * One tooltip for the page, driven by `data-tooltip` (the `title` prop in JSX).
 * Event delegation on `document`, so dynamic elements work too.
 * `data-tooltip-pos` picks the placement (see `UI.place`, default bottom);
 * the CSS variables `--tt-x`/`--tt-y` on the trigger or an ancestor nudge it in px.
 * Mouse and pen only: a finger cannot hover, and a tap would leave the tooltip standing.
 * Nothing to call: the attribute is the whole of it.
 */
const Tooltip = (() => {
  const DELAY_ms = 400; // pointer at rest on a trigger before its tooltip shows
  const GAP_px = 2;     // from the trigger
  const MARGIN_px = 4;  // from the window's edge
  let _el = null;
  let _timer = null;
  let _current = null;
  let _raf = null;

  function show(target) {
    const text = target.getAttribute("data-tooltip");
    if(!text) return;
    if(!_el) document.body.appendChild(_el = <div class="tooltip" role="tooltip"></div>);
    function run() {
      const cs = getComputedStyle(target);
      _el.textContent = text;
      _el.style.visibility = "hidden";
      _el.classList.add("show");
      UI.place(_el, target, target.getAttribute("data-tooltip-pos") || "bottom", {
        gap: GAP_px, margin: MARGIN_px,
        dx: parseFloat(cs.getPropertyValue("--tt-x")) || 0,
        dy: parseFloat(cs.getPropertyValue("--tt-y")) || 0,
      });
      _el.style.visibility = "";
      watch();
    }
    clearTimeout(_timer);
    // moving between triggers shows the next one at once
    if(_el.classList.contains("show")) run();
    else _timer = setTimeout(run, DELAY_ms);
  }
  // the trigger may vanish without a pointer event (re-render, hidden): drop with it
  function watch() {
    _raf = requestAnimationFrame(() => {
      if(!_el.classList.contains("show")) return;
      if(!_current?.isConnected || !_current.getClientRects().length) { hide(); return; }
      watch();
    });
  }

  // the tooltip gone, whatever was pointing at it
  function hide() {
    clearTimeout(_timer);
    cancelAnimationFrame(_raf);
    _el?.classList.remove("show");
    _current = null;
  }
  // a tap fires over with no out to follow, so the tooltip would stay until the next tap
  const hovers = (e) => e.pointerType !== "touch";
  function over(e) {
    if(!hovers(e)) return;
    const t = e.target.closest("[data-tooltip]");
    if(!t || t === _current) return;
    _current = t;
    show(t);
  }
  function out(e) {
    if(!hovers(e)) return;
    if(_current && !(e.relatedTarget && _current.contains(e.relatedTarget))) hide();
  }

  document.addEventListener("pointerover", over);
  document.addEventListener("pointerout", out);
  document.addEventListener("scroll", hide, true);
  return {};
})();
