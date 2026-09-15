// scripts/ui/Confirm.jsx

/**
 * Three-step click flow on `btn`: idle -> wait -> confirm -> `onConfirm`.
 * A click within `graceMs` of arming is ignored, the confirm window closes after `windowMs`.
 * `show(step)` updates the look, `onRevert` fires only when the window closes unconfirmed.
 */
const _confirmFlow = (btn, { graceMs, windowMs, show, onArm, onConfirm, onRevert }) => {
  let armed = false;
  let armedAt = 0;
  let graceTimer = null;
  let windowTimer = null;
  const revert = (confirmed) => {
    armed = false;
    clearTimeout(graceTimer);
    clearTimeout(windowTimer);
    btn.classList.remove("wait", "confirm");
    show("idle");
    if(!confirmed) onRevert?.();
  };
  btn.addEventListener("click", () => {
    if(armed) {
      if(Date.now() - armedAt < graceMs) return;
      revert(true);
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
    }, graceMs);
    windowTimer = setTimeout(() => revert(false), windowMs);
  });
};

/**
 * Destructive button that asks for a second click.
 * Hidden copies of every step keep the width constant.
 * The confirm step is tinted by `color`, default `err` (`ok` for the primary variant).
 *
 * @param {Object} props
 * @param {string} [props.icon="delete"]
 * @param {string} [props.label="Delete"]
 * @param {string} [props.waitIcon="hourglass_top"]
 * @param {string} [props.waitLabel="Wait"]
 * @param {string} [props.confirmIcon="check"]
 * @param {string} [props.confirmLabel="Confirm"]
 * @param {number} [props.graceMs=600]
 * @param {number} [props.windowMs=3000]
 * @param {"primary"|"danger"|"ghost"|null} [props.variant="danger"]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.color]
 * @param {string} [props.title]
 * @param {() => void} [props.onArm]
 * @param {() => void} [props.onConfirm]
 * @param {() => void} [props.onRevert]
 */
const ConfirmBtn = ({
  icon = "delete", label = "Delete",
  waitIcon = "hourglass_top", waitLabel = "Wait",
  confirmIcon = "check", confirmLabel = "Confirm",
  graceMs = 600, windowMs = 3000,
  variant = "danger", size, color, title, onArm, onConfirm, onRevert,
  class: className, ...rest
}) => {
  const steps = {
    idle:    [icon, label],
    wait:    [waitIcon, waitLabel],
    confirm: [confirmIcon, confirmLabel],
  };
  const iconEl = <span class="icon">{icon}</span>;
  const labelEl = <span>{label}</span>;
  const btn = (
    <button {...rest} title={title}
      class={["btn", variant && "btn-" + variant, size, "btn-confirm", className]}
      color={color || (variant === "primary" ? "ok" : "err")}>
      <span>{iconEl}{labelEl}</span>
      {Object.values(steps).map(([ic, lb]) => (
        <span class="confirm-ghost"><span class="icon">{ic}</span><span>{lb}</span></span>
      ))}
    </button>
  );
  _confirmFlow(btn, {
    graceMs, windowMs, onArm, onConfirm, onRevert,
    show: (step) => { [iconEl.textContent, labelEl.textContent] = steps[step]; },
  });
  UI.title(btn);
  return btn;
};

/**
 * Icon-only confirm button for dense rows; same flow as `ConfirmBtn`.
 *
 * @param {Object} props
 * @param {string} [props.icon="delete"]
 * @param {string} [props.title="Delete"]
 * @param {string} [props.waitIcon="hourglass_top"]
 * @param {string} [props.confirmIcon="check"]
 * @param {number} [props.graceMs=600]
 * @param {number} [props.windowMs=3000]
 * @param {"primary"|"danger"|"ghost"} [props.variant]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.color]
 * @param {() => void} [props.onArm]
 * @param {() => void} [props.onConfirm]
 * @param {() => void} [props.onRevert]
 */
const IconConfirmBtn = ({
  icon = "delete", title = "Delete", waitIcon = "hourglass_top", confirmIcon = "check",
  graceMs = 600, windowMs = 3000, variant, color, onArm, onConfirm, onRevert,
  class: className, ...rest
}) => {
  const glyph = { idle: icon, wait: waitIcon, confirm: confirmIcon };
  const btn = (
    <IconBtn {...rest} icon={icon} title={title} variant={variant}
      class={["btn-confirm", className]}
      color={color || (variant === "primary" ? "ok" : "err")} />
  );
  _confirmFlow(btn, {
    graceMs, windowMs, onArm, onConfirm, onRevert,
    show: (step) => { btn.icon = glyph[step]; },
  });
  return btn;
};
