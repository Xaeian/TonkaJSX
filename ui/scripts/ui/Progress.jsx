// scripts/ui/Progress.jsx

/**
 * Progress bar: determinate with `value`, indeterminate without.
 * `label` adds a Badge with `value%`, or `value/max` when `max` is not 100.
 * A value past either end stands at that end.
 *
 * Mutators: .value
 *
 * @param {object} props
 * @param {number|null} [props.value]  null or none for indeterminate
 * @param {number} [props.max=100]
 * @param {string} [props.color="inf"]
 * @param {"sm"|"lg"} [props.size]
 * @param {boolean} [props.label]
 */
const Progress = ({ value, max = 100, color = "inf", size, label, class: className,
  ...rest }) => {
  let _value = null;
  function text() {
    return _value == null ? "…"
      : max === 100 ? _value + "%" : _value + "/" + max;
  }
  const fill = <span class="progress-fill"></span>;
  const bar = <span class="progress-bar">{fill}</span>;
  const badge = label && <Badge color={color} variant="tint" mono />;
  const el = (
    <span {...rest} class={["progress", size, className]} color={color}>{bar}{badge}</span>
  );
  UI.prop(el, "value", () => _value, (v) => {
    _value = v == null ? null : Math.max(0, Math.min(max, v));
    bar.classList.toggle("progress-indeterminate", _value == null);
    fill.style.width = _value == null ? "" : _value / max * 100 + "%";
    if(badge) badge.text = text();
  });
  el.value = value;
  return el;
};
