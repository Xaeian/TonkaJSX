// scripts/ui/Alert.jsx

/**
 * Toasts stacked above the bottom edge.
 * The same type and message refreshes the existing toast; past `max` the oldest goes.
 *
 * API:
 *   Alert.inf/ok/wrn/err(msg, ms?)   ms=0 keeps it until dismissed
 *   Alert.show(type, msg, ms?)
 *   Alert.ask(type, msg, opts?) -> Promise<boolean>   opts: { ok, cancel } icon names
 *   Alert.clear()
 *   Alert.config({ max, defaultMs })
 */
const Alert = (() => {
  const ICON = { inf: "info", ok: "check_circle", wrn: "warning", err: "error" };
  const _open = new Map(); // key -> { el, timer }
  let _max = 5;
  let _defaultMs = { inf: 2500, ok: 2500, wrn: 3000, err: 10000 };
  let _stack = null;
  let _askId = 0;

  const mount = (key, el) => {
    if(!_stack) document.body.appendChild(_stack = <div class="alerts"></div>);
    _stack.appendChild(el);
    _open.set(key, { el, timer: null });
    while(_open.size > _max) close(_open.keys().next().value);
    requestAnimationFrame(() => el.classList.add("show"));
  };
  const close = (key) => {
    const entry = _open.get(key);
    if(!entry) return;
    clearTimeout(entry.timer);
    _open.delete(key);
    entry.el.classList.remove("show");
    setTimeout(() => entry.el.remove(), UI.duration(entry.el));
  };
  const arm = (key, ms) => {
    const entry = _open.get(key);
    if(!entry) return;
    clearTimeout(entry.timer);
    if(ms) entry.timer = setTimeout(() => close(key), ms);
  };
  const toast = (type, msg, buttons) => (
    <div class={["alert", "alert-" + type]} color={type}>
      <span class="alert-icon icon">{ICON[type] || "info"}</span>
      <span class="alert-msg">{msg}</span>
      {buttons}
    </div>
  );

  const show = (type, msg, ms = _defaultMs[type] || 3000) => {
    const key = type + "|" + msg;
    if(!_open.has(key)) {
      const el = toast(type, msg,
        <button class="alert-close" aria-label="Dismiss" onClick={() => close(key)}>
          <span class="icon">close</span>
        </button>);
      const loud = type === "err" || type === "wrn";
      el.setAttribute("role", loud ? "alert" : "status");
      el.setAttribute("aria-live", loud ? "assertive" : "polite");
      mount(key, el);
    }
    arm(key, ms);
  };
  const ask = (type, msg, opts = {}) => new Promise((resolve) => {
    const { ok = "check", cancel = "close" } = opts;
    const key = "ask" + (++_askId);
    const prev = document.activeElement;
    const finish = (answer) => {
      document.removeEventListener("keydown", onKey);
      close(key);
      if(prev?.isConnected) prev.focus?.();
      resolve(answer);
    };
    const onKey = (e) => { if(e.key === "Escape") { e.preventDefault(); finish(false); } };
    const okBtn = (
      <button class="alert-confirm" aria-label="Confirm" onClick={() => finish(true)}>
        <span class="icon">{ok}</span>
      </button>
    );
    const el = toast(type, msg, <>
      {okBtn}
      <button class="alert-close" aria-label="Cancel" onClick={() => finish(false)}>
        <span class="icon">{cancel}</span>
      </button>
    </>);
    el.setAttribute("role", "alertdialog");
    el.setAttribute("aria-label", msg);
    mount(key, el);
    document.addEventListener("keydown", onKey);
    okBtn.focus();
  });
  const clear = () => { for(const key of [..._open.keys()]) close(key); };
  const config = ({ max, defaultMs } = {}) => {
    if(max != null) _max = max;
    if(defaultMs) _defaultMs = { ..._defaultMs, ...defaultMs };
  };
  return {
    show, ask, clear, config,
    inf: (msg, ms) => show("inf", msg, ms),
    ok:  (msg, ms) => show("ok",  msg, ms),
    wrn: (msg, ms) => show("wrn", msg, ms),
    err: (msg, ms) => show("err", msg, ms),
  };
})();
