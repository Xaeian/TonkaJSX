// scripts/ui/Confirm.jsx

const _CONFIRM_GRACE_ms = 600;   // a click this soon after arming is ignored
const _CONFIRM_WINDOW_ms = 3000; // the confirm step closes unconfirmed after this

// Three-step click flow on `btn`: idle -> wait -> confirm -> `onConfirm`.
// `show(step)` updates the look.
function _confirmFlow(btn, { show, onArm, onConfirm }) {
  let armed = false;
  let armedAt = 0;
  let graceTimer = null;
  let windowTimer = null;
  function revert() {
    armed = false;
    clearTimeout(graceTimer);
    clearTimeout(windowTimer);
    btn.classList.remove("wait", "confirm");
    show("idle");
  }
  btn.addEventListener("click", () => {
    if(armed) {
      if(Date.now() - armedAt < _CONFIRM_GRACE_ms) return;
      revert();
      onConfirm?.();
      return;
    }
    armed = true;
    armedAt = Date.now();
    btn.classList.add("wait");
    show("wait");
    onArm?.();
    graceTimer = setTimeout(() => {
      btn.classList.replace("wait", "confirm");
      show("confirm");
    }, _CONFIRM_GRACE_ms);
    windowTimer = setTimeout(revert, _CONFIRM_WINDOW_ms);
  });
}

// the tint of the confirm step: `color`, else `ok` on a primary button and `err` on the rest
const _confirmColor = (color, variant) => color || (variant === "primary" ? "ok" : "err");

/**
 * Destructive button that asks for a second click.
 * Hidden copies of every step keep the width constant.
 * The confirm step is tinted by `color`, default `err` (`ok` for the primary variant).
 *
 * Mutators: .title, .loading
 *
 * @param {object} props
 * @param {string} [props.icon="delete"]
 * @param {string} [props.label="Delete"]
 * @param {string} [props.waitLabel="Wait"]
 * @param {string} [props.confirmLabel="Confirm"]
 * @param {"primary"|"danger"|"ghost"|null} [props.variant="danger"]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.color]
 * @param {string} [props.title]
 * @param {() => void} [props.onArm]
 * @param {() => void} [props.onConfirm]
 */
const ConfirmBtn = ({
  icon = "delete", label = "Delete", waitLabel = "Wait", confirmLabel = "Confirm",
  variant = "danger", size, color, onArm, onConfirm,
  class: className, ...rest
}) => {
  const steps = {
    idle:    [icon, label],
    wait:    ["hourglass_top", waitLabel],
    confirm: ["check", confirmLabel],
  };
  const iconEl = <span class="icon" translate={false}>{icon}</span>;
  const labelEl = <span>{label}</span>;
  const btn = (
    <button {...rest} color={_confirmColor(color, variant)}
      class={["btn", variant && "btn-" + variant, size, "btn-confirm", className]}>
      <span>{iconEl}{labelEl}</span>
      {Object.values(steps).map(([ic, lb]) => (
        <span class="confirm-ghost">
          <span class="icon" translate={false}>{ic}</span>
          <span>{lb}</span>
        </span>
      ))}
    </button>
  );
  _confirmFlow(btn, {
    onArm, onConfirm,
    show: (step) => { [iconEl.textContent, labelEl.textContent] = steps[step]; },
  });
  UI.title(btn);
  UI.loading(btn, iconEl);
  return btn;
};

/**
 * Icon-only confirm button for dense rows; same flow as `ConfirmBtn`.
 *
 * Mutators: .title, .loading
 *
 * @param {object} props
 * @param {string} [props.icon="delete"]
 * @param {string} [props.title="Delete"]
 * @param {"primary"|"danger"|"ghost"} [props.variant]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.color]
 * @param {() => void} [props.onArm]
 * @param {() => void} [props.onConfirm]
 */
const IconConfirmBtn = ({
  icon = "delete", title = "Delete", variant, color, onArm, onConfirm,
  class: className, ...rest
}) => {
  const glyph = { idle: icon, wait: "hourglass_top", confirm: "check" };
  const btn = (
    <IconBtn {...rest} icon={icon} title={title} variant={variant}
      class={["btn-confirm", className]} color={_confirmColor(color, variant)} />
  );
  _confirmFlow(btn, {
    onArm, onConfirm,
    show: (step) => { btn.icon = glyph[step]; },
  });
  return btn;
};
