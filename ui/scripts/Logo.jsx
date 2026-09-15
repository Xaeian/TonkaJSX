// scripts/Logo.jsx
//
// The mark of xaeian.svg redrawn on canvas: six shapes of a clipped group (viewBox 0 0 32 32),
// each with its own translate+rotate, clipped by circle(16, 16, r 16). Canvas rather than inline
// SVG because jsx.js builds HTML elements only, so an <svg> written in JSX comes out as unknown
// tags and never renders.
//
// The same file in every app of the house; it leans on nothing but the page: dark or light is
// read off `<html data-theme>` and the system, a change arrives as the `theme:change` event on
// `document`, which every theme switch here fires.

const LOGO_INK = { light: "#398390", dark: "#5cb3c0" };
const LOGO_MID = 16; // centre and clip radius alike, in the viewBox's own units

// The mark's shapes meet rather than overlap, and the artwork leaves two of those contacts
// 0.0035 and 0.0137 units apart, so a join can show as a hairline of background. The outline
// is stroked in the fill's own ink to close it: half a device pixel where a pixel is the
// coarser measure, a tenth of a unit where the drawing is.
const LOGO_WELD = { px: 0.5, unit: 0.1 };

const _logoDark = () => (document.documentElement.dataset.theme
  || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";

/**
 * The mark as one path, built once and reused by every instance and every frame.
 *
 * One rather than six, because two fills of the same ink meeting over a pixel come to
 * 1-(1-a)(1-b) and never to full coverage: the join reads as a pale line. In one path the
 * whole mark is rasterized at once and only its outline is ever partly covered. Every subpath
 * runs the same way round, so nonzero fill cannot cancel an overlap into a hole.
 *
 * Corners are transformed by hand because `addPath(path, matrix)` is unevenly implemented:
 * where the matrix is ignored the bars land unrotated and merge into one blob.
 */
function _markPath() {
  const mark = new Path2D();

  /** An untransformed polyline or polygon: SVG closes both for fill. */
  const poly = (pts) => {
    pts.forEach(([X, Y], i) => { if(i) mark.lineTo(X, Y); else mark.moveTo(X, Y); });
    mark.closePath();
  };

  /** SVG `transform="translate(tx ty) rotate(deg)"` on a rect, corner by corner. */
  const rect = (x, y, w, h, tx, ty, deg) => {
    const a = deg * Math.PI / 180;
    const cos = Math.cos(a), sin = Math.sin(a);
    poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([px, py]) =>
      [tx + px * cos - py * sin, ty + px * sin + py * cos]));
  };

  rect(-3.18, 18.34, 6.08, 6.08, -15.16, 6.17, -45);
  rect(29.09, 7.59, 6.08, 6.08, 1.90, 25.84, -45);
  poly([[16, 9.55], [25.68, -0.13], [32.13, 6.32], [22.46, 16]]);
  rect(12.33, -0.11, 3.04, 36.51, -8.78, 15.11, -45);
  rect(16.63, -4.41, 3.04, 36.51, -4.47, 16.89, -45);
  poly([[16, 22.46], [6.32, 32.14], [-0.13, 25.68], [9.55, 16]]);

  return mark;
}

let _MARK = null;

/**
 * Canvas mark that spins on hover and nudges itself now and then.
 * `._spin()` and `._rest()` let a parent link drive it from its own hover or focus;
 * `._dispose()` stops timers and listeners.
 *
 * @param {object} props
 * @param {number} [props.size=28]  CSS pixels
 */
const Logo = ({ size = 28 }) => {
  const cv = <canvas class="logo" width={size} height={size}
    style={{ width: size + "px", height: size + "px", display: "block" }} />;

  const ctx = cv.getContext ? cv.getContext("2d") : null;
  if(!ctx) return cv; // headless / no canvas: stay an empty box
  if(!_MARK) {
    try { _MARK = _markPath(); }
    catch { return cv; } // no Path2D: stay blank instead of throwing
  }

  let spin = 0; // radians
  let scale = 1;

  /**
   * @param {number} [fade]  0 wipes the frame, >0 dissolves it instead so the previous positions
   *   stay as a motion trail. Without it a fast spin of a near symmetric mark just flickers.
   */
  function paint(fade) {
    const px = cv.width;
    const k = (px / (LOGO_MID * 2 + 1.6)) * scale; // +1.6 leaves a hair of padding
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if(fade > 0) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, px, px);
      ctx.globalCompositeOperation = "source-over";
    }
    else ctx.clearRect(0, 0, px, px);
    ctx.save();
    ctx.translate(px / 2, px / 2);
    ctx.rotate(spin);
    ctx.scale(k, k);
    ctx.translate(-LOGO_MID, -LOGO_MID);
    ctx.beginPath();
    ctx.arc(LOGO_MID, LOGO_MID, LOGO_MID, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = _logoDark() ? LOGO_INK.dark : LOGO_INK.light;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = Math.max(LOGO_WELD.px / k, LOGO_WELD.unit);
    ctx.lineJoin = "round"; // two corners are sharp enough for a miter to grow a spike
    ctx.lineCap = "round";
    ctx.fill(_MARK);
    ctx.stroke(_MARK);
    ctx.restore();
  }

  /**
   * Match the backing store to real device pixels; setting either dimension also clears it, so
   * the caller repaints. Browser zoom and a move to another monitor both change devicePixelRatio
   * and both fire `resize`, which is why one listener is enough.
   */
  function fit() {
    const px = Math.max(1, Math.round(size * (window.devicePixelRatio || 1)));
    if(cv.width === px) return false;
    cv.width = px;
    cv.height = px;
    return true;
  }
  const onZoom = () => { if(fit()) paint(0); };
  window.addEventListener("resize", onZoom);

  // Bursts, not a steady motor: each one whips through whole turns, brakes to a dead stop, waits
  // a beat, then goes again for as long as the pointer stays. Whole turns mean a burst always
  // ends upright, so the mark never has to unwind. Reduced motion keeps a slower single turn and
  // no swelling, because refusing to move at all just reads as broken.
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TURNS = calm ? 1 : 2;
  const BURST = calm ? 0.9 : 0.62;   // seconds per burst
  const PAUSE = 0.13;                // beat between bursts
  const IDLE = 10;                   // seconds between unprompted turns
  const SWELL = calm ? 0 : 0.12;
  const TRAIL = calm ? 0 : 26;       // higher = shorter smear
  const TAU = Math.PI * 2;

  let phase = "rest";   // rest | burst | pause
  let pt = 0;           // seconds spent in the current phase
  let turns = TURNS;    // this burst only: the idle nudge is one turn, a hover burst is TURNS
  let last = 0;
  let raf = 0;
  let hover = false;

  function frame(now) {
    const dt = Math.min((last ? now - last : 16) / 1000, 0.05);
    last = now;
    pt += dt;
    let speed = 0; // share of this burst's launch speed; drives the swell and the smear

    if(phase === "burst") {
      const t = Math.min(pt / BURST, 1);
      // ease-out cubic: launches hard, glides into the stop. Its slope is 3(1-t)^2, which peaks
      // at t = 0, so the same curve normalised gives the speed without measuring frame to frame.
      spin = turns * TAU * (1 - (1 - t) ** 3);
      speed = (1 - t) ** 2;
      if(t >= 1) {
        spin = 0; // a whole number of turns: back where it started
        speed = 0;
        phase = hover ? "pause" : "rest";
        pt = 0;
      }
    }
    // back to the hover length: an idle nudge caught mid-turn would otherwise stay single
    else if(phase === "pause" && (!hover || pt >= PAUSE)) {
      if(hover) { turns = TURNS; phase = "burst"; }
      else phase = "rest";
      pt = 0;
    }

    if(phase === "rest") { raf = 0; last = 0; spin = 0; scale = 1; paint(0); return; }
    scale = 1 + SWELL * speed;
    paint(speed > 0.06 ? 1 - Math.exp(-TRAIL * dt / speed) : 0);
    raf = requestAnimationFrame(frame);
  }

  /** Start a burst of `n` whole turns; a burst already running just keeps going. */
  function launch(n) {
    turns = n;
    phase = "burst";
    pt = 0;
    if(!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }

  const start = () => { hover = true; if(phase === "rest") launch(TURNS); };
  const stop = () => { hover = false; }; // the burst still finishes, so it parks upright

  // One unprompted turn now and then, so a mark that reacts to the pointer says so on its own.
  // Off under reduced motion, where unasked movement is the whole thing being opted out of, and
  // skipped on a hidden tab, where it would only burn frames nobody sees.
  const idle = calm ? 0 : window.setInterval(() => {
    if(!hover && phase === "rest" && !document.hidden) launch(1);
  }, IDLE * 1000);

  cv.addEventListener("pointerenter", start);
  cv.addEventListener("pointerleave", stop);
  cv._spin = start;
  cv._rest = stop;

  const onTheme = () => paint(0);
  document.addEventListener("theme:change", onTheme);

  cv._dispose = () => {
    cancelAnimationFrame(raf);
    window.clearInterval(idle);
    window.removeEventListener("resize", onZoom);
    document.removeEventListener("theme:change", onTheme);
  };

  fit();
  paint(0);
  return cv;
};
