// scripts/ui/DatePicker.jsx

/**
 * Date/time picker over a native input.
 * `format` (strftime: %Y %m %d %H %M %S) picks native type
 * and is string form of `value`, `.value` and `onChange`.
 *
 * Mutators: .value (formatted string or null), .focus(), .input
 *
 * @param {Object} props
 * @param {string} [props.format="%Y-%m-%d %H:%M"]
 * @param {string|null} [props.value]
 * @param {string} [props.min]   in `format`
 * @param {string} [props.max]   in `format`
 * @param {boolean} [props.utc=false]
 * @param {(value:string|null, e:Event) => void} [props.onChange]
 * @param {(value:string|null, e:KeyboardEvent) => void} [props.onEnter]
 */
const DatePicker = ({ format = "%Y-%m-%d %H:%M", value, min, max, placeholder, disabled,
  utc = false, name, onChange, onEnter, onKeyDown, class: className, ...rest }) => {
  const hasDate = /%Y|%m|%d/.test(format);
  const hasTime = /%H|%M|%S/.test(format);
  const hasSec = /%S/.test(format);
  const type = hasDate && hasTime ? "datetime-local" : hasDate ? "date" : "time";
  const nativeFormat = type === "date" ? "%Y-%m-%d"
    : type === "time" ? (hasSec ? "%H:%M:%S" : "%H:%M")
    : (hasSec ? "%Y-%m-%dT%H:%M:%S" : "%Y-%m-%dT%H:%M");

  const pad = (n) => String(n).padStart(2, "0");
  const parts = (d) => utc
    ? { Y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(),
        H: d.getUTCHours(), M: d.getUTCMinutes(), S: d.getUTCSeconds() }
    : { Y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(),
        H: d.getHours(), M: d.getMinutes(), S: d.getSeconds() };
  const fmt = (date, f) => {
    if(!date || isNaN(date.getTime())) return null;
    const p = parts(date);
    return f.replace(/%([YmdHMS])/g, (_, t) => t === "Y" ? p.Y : pad(p[t]));
  };
  const parse = (str, f) => {
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
    const date = utc ? new Date(Date.UTC(v.Y, v.m - 1, v.d, v.H, v.M, v.S))
      : new Date(v.Y, v.m - 1, v.d, v.H, v.M, v.S);
    if(isNaN(date.getTime())) return null;
    const p = parts(date);
    // Feb 30 would silently become Mar 2; reject it instead
    if(p.Y !== v.Y || p.m !== v.m || p.d !== v.d) return null;
    return date;
  };
  const toNative = (s) => fmt(parse(s, format), nativeFormat);
  const fromNative = () => field.value ? fmt(parse(field.value, nativeFormat), format) : null;

  const field = (
    <input type={type} placeholder={placeholder} name={name} disabled={disabled}
      step={hasSec ? "1" : undefined}
      min={min ? toNative(min) : undefined} max={max ? toNative(max) : undefined} />
  );
  if(value != null) field.value = toNative(value) || "";
  field.addEventListener("change", (e) => onChange?.(fromNative(), e));
  if(onEnter) field.addEventListener("keydown", (e) => {
    if(e.key === "Enter") onEnter(fromNative(), e);
  });
  if(onKeyDown) field.addEventListener("keydown", onKeyDown);
  return _group(field, {
    ...rest, class: ["input-group-date", className],
    accessor: {
      get: fromNative,
      set: (v) => { field.value = v != null ? (toNative(v) || "") : ""; },
    },
  });
};
