// scripts/ui/Alert.jsx

/**
 * Toasts stacked above the bottom edge.
 * The same type and message refreshes the existing toast; past `max` the oldest goes.
 *
 * API: Alert.inf/ok/wrn/err(msg, ms), Alert.show(type, msg, ms), Alert.ask(type, msg, opts),
 * Alert.clear(), Alert.config({ max })
 */
const Alert = (() => {
  const ICON = { inf: "info", ok: "check_circle", wrn: "warning", err: "error" };
  const STAY_MS = { inf: 2500, ok: 2500, wrn: 3000, err: 10000 }; // unless a call gives its own
  const _open = new Map(); // key -> { el, timer }
  let _max = 5;
  let _stack = null;
  let _askId = 0;

  function mount(key, el) {
    if(!_stack) document.body.appendChild(_stack = <div class="alerts"></div>);
    _stack.appendChild(el);
    _open.set(key, { el, timer: null });
    while(_open.size > _max) close(_open.keys().next().value);
    // a toast pushed out before its first frame never shows
    requestAnimationFrame(() => { if(_open.get(key)?.el === el) el.classList.add("show"); });
  }
  function close(key) {
    const entry = _open.get(key);
    if(!entry) return;
    clearTimeout(entry.timer);
    _open.delete(key);
    entry.el.classList.remove("show");
    UI._unmount(entry.el);
  }
  function arm(key, ms) {
    const entry = _open.get(key);
    if(!entry) return;
    clearTimeout(entry.timer);
    if(ms) entry.timer = setTimeout(() => close(key), ms);
  }
  function toast(type, msg, buttons) {
    return (
      <div class="alert" color={type}>
        <span class="alert-icon icon" translate={false}>{ICON[type] || "info"}</span>
        <span class="alert-msg">{msg}</span>
        {buttons}
      </div>
    );
  }

  /** A toast of one type; `ms` 0 keeps it until it is dismissed. */
  function show(type, msg, ms = STAY_MS[type] || 3000) {
    const key = type + "|" + msg;
    if(!_open.has(key)) {
      const el = toast(type, msg,
        <button class="alert-close" aria-label="Dismiss" onClick={() => close(key)}>
          <span class="icon" translate={false}>close</span>
        </button>);
      const loud = type === "err" || type === "wrn";
      el.setAttribute("role", loud ? "alert" : "status");
      el.setAttribute("aria-live", loud ? "assertive" : "polite");
      mount(key, el);
    }
    arm(key, ms);
  }

  /**
   * A toast asking yes or no, answered by its two buttons, or by Escape, which says no.
   * @param {string} type
   * @param {string} msg
   * @param {object} [opts]
   * @param {string} [opts.ok]  the confirm button's icon
   * @param {string} [opts.cancel]  the cancel button's icon
   * @returns {Promise<boolean>}
   */
  function ask(type, msg, { ok = "check", cancel = "close" } = {}) {
    return new Promise((resolve) => {
      const key = "ask" + (++_askId);
      const prev = document.activeElement;
      function finish(answer) {
        document.removeEventListener("keydown", onKey);
        close(key);
        if(prev?.isConnected) prev.focus?.();
        resolve(answer);
      }
      const onKey = (e) => { if(e.key === "Escape") { e.preventDefault(); finish(false); } };
      const okBtn = (
        <button class="alert-confirm" aria-label="Confirm" onClick={() => finish(true)}>
          <span class="icon" translate={false}>{ok}</span>
        </button>
      );
      const el = toast(type, msg, <>
        {okBtn}
        <button class="alert-close" aria-label="Cancel" onClick={() => finish(false)}>
          <span class="icon" translate={false}>{cancel}</span>
        </button>
      </>);
      el.setAttribute("role", "alertdialog");
      el.setAttribute("aria-label", msg);
      mount(key, el);
      document.addEventListener("keydown", onKey);
      okBtn.focus();
    });
  }

  /** Every toast gone at once. */
  const clear = () => { for(const key of [..._open.keys()]) close(key); };

  /** How many toasts stand at once, `max`. */
  function config({ max } = {}) {
    if(max != null) _max = max;
  }
  return {
    show, ask, clear, config,
    inf: (msg, ms) => show("inf", msg, ms),
    ok:  (msg, ms) => show("ok",  msg, ms),
    wrn: (msg, ms) => show("wrn", msg, ms),
    err: (msg, ms) => show("err", msg, ms),
  };
})();
