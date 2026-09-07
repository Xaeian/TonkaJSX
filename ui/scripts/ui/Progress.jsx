// scripts/ui/Progress.jsx

/**
 * Progress bar: determinate with `value`, indeterminate without.
 * `label` adds a Badge with `value%` (or `value/max` when max is not 100).
 *
 * Mutators: .value (null = indeterminate), .max
 *
 * @param {Object} props
 * @param {number} [props.value]
 * @param {number} [props.max=100]
 * @param {string} [props.color="inf"]
 * @param {"sm"|"lg"} [props.size]
 * @param {boolean} [props.label]
 */
const Progress = ({ value, max = 100, color = "inf", size, label, class: className,
  ...rest }) => {
  let _value = value ?? null;
  let _max = max;
  const text = () => _value == null ? "…"
    : _max === 100 ? _value + "%" : _value + "/" + _max;
  const fill = <span class="progress-fill"></span>;
  const bar = <span class="progress-bar">{fill}</span>;
  const badge = label ? <Badge color={color} variant="tint" mono>{text()}</Badge> : null;
  const el = (
    <span {...rest} class={["progress", size, className]} color={color}>{bar}{badge}</span>
  );
  const sync = () => {
    const pct = Math.max(0, Math.min(100, _value / _max * 100));
    bar.classList.toggle("progress-indeterminate", _value == null);
    fill.style.width = _value == null ? "" : pct + "%";
    if(badge) badge.text = text();
  };
  sync();
  UI.prop(el, "value", () => _value, (v) => {
    _value = v == null ? null : Math.max(0, Math.min(_max, v));
    sync();
  });
  UI.prop(el, "max", () => _max, (v) => {
    _max = v;
    if(_value != null && _value > _max) _value = _max;
    sync();
  });
  return el;
};
