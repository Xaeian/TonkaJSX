// scripts/ui/FileDrop.jsx

/**
 * File input with click and drag-and-drop, drawn as an `Empty`.
 * Stateless: valid files go to `onFiles` and the zone returns to idle; the caller keeps them.
 *
 * Validation, in order: `accept` (extensions, MIME types, `image/*`), `maxSize`, `maxCount`.
 * The first failure goes to `onError` and nothing reaches `onFiles`.
 *
 * Mutators:
 *   .loading    spinner, no interaction
 *   .selected   File or {name, size?}: shows the file, a click clears it (`onClear`)
 *   .input      the native `<input type="file">`
 *
 * @param {Object} props
 * @param {string} [props.accept]
 * @param {boolean} [props.multiple]
 * @param {number} [props.maxSize]    bytes per file
 * @param {number} [props.maxCount]   files per drop
 * @param {string} [props.icon="upload_file"]
 * @param {string} [props.selectedIcon="description"]
 * @param {string} [props.title="Drop files here"]
 * @param {string} [props.description="or click to browse"]
 * @param {"sm"|"lg"} [props.size]
 * @param {string} [props.height]
 * @param {boolean} [props.fill]
 * @param {(files:File[]) => void} props.onFiles
 * @param {(msg:string) => void} [props.onError]
 * @param {() => void} [props.onClear]
 */
const FileDrop = ({
  accept, multiple, maxSize, maxCount,
  icon = "upload_file", selectedIcon = "description",
  title = "Drop files here", description = "or click to browse",
  onFiles, onError, onClear, class: className, ...rest
}) => {
  const rules = (accept || "").split(",").map(s => s.trim()).filter(Boolean);
  const exts = rules.filter(r => r.startsWith(".")).map(r => r.toLowerCase());
  const mimes = rules.filter(r => !r.startsWith("."));

  const accepts = (file) => {
    if(!rules.length) return true;
    const name = (file.name || "").toLowerCase();
    if(exts.some(e => name.endsWith(e))) return true;
    const type = file.type || "";
    return mimes.some(m => m.endsWith("/*") ? type.startsWith(m.slice(0, -1)) : type === m);
  };
  const fmtBytes = (n) => {
    if(n < 1024) return n + "B";
    if(n < 1048576) return (n / 1024).toFixed(1) + "kB";
    if(n < 1073741824) return (n / 1048576).toFixed(1) + "MB";
    return (n / 1073741824).toFixed(2) + "GB";
  };
  const validate = (files) => {
    if(!files.length) return "No files selected";
    if(!multiple && files.length > 1) return "Only one file allowed";
    if(maxCount && files.length > maxCount) {
      return `Too many files: ${files.length} (max ${maxCount})`;
    }
    for(const f of files) {
      if(!accepts(f)) return `${f.name}: wrong type`;
      if(maxSize && f.size > maxSize) {
        return `${f.name}: too large (${fmtBytes(f.size)}, max ${fmtBytes(maxSize)})`;
      }
    }
    return null;
  };
  const handle = (list) => {
    if(zone.loading) return;
    const files = Array.from(list);
    const err = validate(files);
    if(err) onError?.(err);
    else onFiles(files);
  };

  const input = (
    <input type="file" accept={accept} multiple={!!multiple} hidden onChange={(e) => {
      handle(e.target.files);
      e.target.value = ""; // the same file can be picked again
    }} />
  );
  const zone = (
    <Empty {...rest} class={["file-drop", className]} icon={icon} title={title}
      description={description} tabIndex="0" role="button" aria-label={title}>
      {input}
    </Empty>
  );

  // click and keyboard: clear the selection when one is shown, else open the picker
  const activate = () => {
    if(zone.loading) return;
    if(zone.selected) { zone.selected = null; onClear?.(); }
    else input.click();
  };
  zone.addEventListener("click", (e) => { if(e.target !== input) activate(); });
  zone.addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
  });

  // dragenter/dragleave also fire on children; the depth tells a real exit apart
  let depth = 0;
  zone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    if(zone.loading) return;
    depth++;
    zone.classList.add("file-drop-over");
  });
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = zone.loading ? "none" : "copy";
  });
  zone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    if(--depth <= 0) { depth = 0; zone.classList.remove("file-drop-over"); }
  });
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    depth = 0;
    zone.classList.remove("file-drop-over");
    handle(e.dataTransfer.files);
  });

  let loading = false;
  let selected = null;
  const iconEl = zone.firstChild;
  const showIcon = () => {
    zone.icon = loading ? "progress_activity" : selected ? selectedIcon : icon;
    iconEl.classList.toggle("spinner", loading);
  };
  UI.prop(zone, "loading", () => loading, (v) => {
    loading = !!v;
    zone.classList.toggle("file-drop-loading", loading);
    showIcon();
  });
  UI.prop(zone, "selected", () => selected, (v) => {
    selected = v || null;
    zone.classList.toggle("file-drop-selected", !!selected);
    zone.title = selected ? selected.name || "file" : title;
    zone.description = !selected ? description
      : typeof selected.size === "number" ? `${fmtBytes(selected.size)} • click to clear`
      : "click to clear";
    zone.setAttribute("aria-label", zone.title);
    showIcon();
  });
  zone.input = input;
  return zone;
};
