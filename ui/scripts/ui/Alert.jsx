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
  const STAY_ms = { inf: 2500, ok: 2500, wrn: 3000, err: 10000 }; // unless a call gives its own
  const _open = new Map(); // key -> { el, timer }
  let _max = 5;
  let _stack = null;
  let _askId = 0;

  // `unanswered` is the no of a question, said when it goes without an answer
  function mount(key, el, unanswered) {
    if(!_stack) document.body.appendChild(_stack = <div class="alerts"></div>);
    _stack.appendChild(el);
    _open.set(key, { el, timer: null, unanswered });
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
    _unmount(entry.el);
    // a question pushed out by the limit or by `clear` answers no
    entry.unanswered?.();
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
        <Icon name={ICON[type] || "info"} class="alert-icon" />
        <span class="alert-msg">{msg}</span>
        {buttons}
      </div>
    );
  }

  /** A toast of one type; `ms` 0 keeps it until it is dismissed. */
  function show(type, msg, ms = STAY_ms[type] || 3000) {
    const key = type + "|" + msg;
    if(!_open.has(key)) {
      const el = toast(type, msg,
        <button class="alert-close" aria-label="Dismiss" onClick={() => close(key)}>
          <Icon name="close" />
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
   * Escape answers the question while it is the newest overlay, so a dialog under it stays.
   * A question taken away by the limit or by `clear` answers no as well.
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
      let answered = false;
      function finish(answer) {
        if(answered) return;
        answered = true;
        // the focus goes back from the question alone, never from where the person went since
        const held = el.contains(document.activeElement);
        leave();
        close(key);
        if(held && prev?.isConnected) prev.focus?.();
        resolve(answer);
      }
      const okBtn = (
        <button class="alert-confirm" aria-label="Confirm" onClick={() => finish(true)}>
          <Icon name={ok} />
        </button>
      );
      const el = toast(type, msg, <>
        {okBtn}
        <button class="alert-close" aria-label="Cancel" onClick={() => finish(false)}>
          <Icon name={cancel} />
        </button>
      </>);
      el.setAttribute("role", "alertdialog");
      el.setAttribute("aria-label", msg);
      const leave = _escape(el, () => finish(false));
      mount(key, el, () => finish(false));
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
    /** A toast that informs; `ms` as `show` takes it. */
    inf: (msg, ms) => show("inf", msg, ms),
    /** A toast that says it went well; `ms` as `show` takes it. */
    ok: (msg, ms) => show("ok", msg, ms),
    /** A toast that warns; `ms` as `show` takes it. */
    wrn: (msg, ms) => show("wrn", msg, ms),
    /** A toast that says it failed; `ms` as `show` takes it. */
    err: (msg, ms) => show("err", msg, ms),
  };
})();
