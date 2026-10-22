// scripts/ui/DatePicker.jsx

/**
 * Date/time picker over a native input.
 * `format` (strftime: %Y %m %d %H %M %S) picks the native type
 * and is the string form of `value`, `.value` and every handler.
 *
 * Mutators: .value (formatted string or null), .disabled, .title, .focus(), .input
 *
 * @param {object} props
 * @param {string} [props.format="%Y-%m-%d %H:%M"]
 * @param {string|null} [props.value]
 * @param {(value:string|null) => void} [props.onChange]
 * @param {(value:string|null) => void} [props.onEnter]
 * @param {(value:string|null) => void} [props.onEscape]
 */
const DatePicker = ({ format = "%Y-%m-%d %H:%M", value, name, onChange, onEnter, onEscape,
  onKeyDown, class: className, ...rest }) => {
  const hasDate = /%Y|%m|%d/.test(format);
  const hasTime = /%H|%M|%S/.test(format);
  const hasSec = /%S/.test(format);
  const type = hasDate && hasTime ? "datetime-local" : hasDate ? "date" : "time";
  const nativeFormat = type === "date" ? "%Y-%m-%d"
    : type === "time" ? (hasSec ? "%H:%M:%S" : "%H:%M")
    : (hasSec ? "%Y-%m-%dT%H:%M:%S" : "%Y-%m-%dT%H:%M");

  const pad = (n) => String(n).padStart(2, "0");
  function parts(d) {
    return {
      Y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(),
      H: d.getHours(), M: d.getMinutes(), S: d.getSeconds(),
    };
  }
  function fmt(date, f) {
    if(!date) return null;
    const p = parts(date);
    return f.replace(/%([YmdHMS])/g, (_, t) => t === "Y" ? p.Y : pad(p[t]));
  }
  function parse(str, f) {
    if(!str) return null;
    const tokens = [];
    const escaped = f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = escaped.replace(/%([YmdHMS])/g, (_, t) => {
      tokens.push(t);
      return t === "Y" ? "(\\d{4})" : "(\\d{2})";
    });
    const m = new RegExp("^" + pattern + "$").exec(str);
    if(!m) return null;
    const v = { Y: 1970, m: 1, d: 1, H: 0, M: 0, S: 0 };
    tokens.forEach((t, i) => { v[t] = parseInt(m[i + 1], 10); });
    const date = new Date(v.Y, v.m - 1, v.d, v.H, v.M, v.S);
    if(isNaN(date.getTime())) return null;
    const p = parts(date);
    // Feb 30 would silently become Mar 2; reject it instead
    if(p.Y !== v.Y || p.m !== v.m || p.d !== v.d) return null;
    return date;
  }
  // an empty or unreadable string parses to null, and `fmt` hands a null back
  const toNative = (s) => fmt(parse(s, format), nativeFormat) || "";
  const fromNative = () => fmt(parse(field.value, nativeFormat), format);

  const field = <input type={type} name={name} step={hasSec && "1"} value={toNative(value)} />;
  const wrap = _group(field, {
    ...rest, class: ["input-group-date", className],
    accessor: { get: fromNative, set: (v) => { field.value = toNative(v); } },
  });
  _keys(wrap, { onEnter, onEscape, onKeyDown });
  if(onChange) field.addEventListener("change", () => onChange(wrap.value));
  return wrap;
};
