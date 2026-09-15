// scripts/ui/theme.js

/**
 * Theme: the page follows the system until `set` writes `data-theme`, and follows it again
 * once `set("system")` takes that attribute away.
 * Nothing is kept unless `remember` ties the choice to storage; an app holding it in its own
 * state simply calls `set`.
 * Every change fires `theme:change` on `document` with the choice, which may be "system";
 * what is actually showing is always `current()`.
 */
const Theme = (() => {
  const KEY = "theme";
  const root = document.documentElement;
  const media = matchMedia("(prefers-color-scheme: dark)");
  let cache = null;

  /** What is showing now: dark or light, whoever chose it. */
  const current = () => root.dataset.theme || (media.matches ? "dark" : "light");

  /** What was chosen: dark, light, or system while nothing was. */
  const choice = () => root.dataset.theme || "system";

  const isDark = () => current() === "dark";

  const emit = () => document.dispatchEvent(
    new CustomEvent("theme:change", { detail: choice() }));

  /** @param {"dark"|"light"|"system"} t system hands the page back to the operating system */
  const set = (t) => {
    if(t === "system") delete root.dataset.theme;
    else root.dataset.theme = t;
    cache?.set(KEY, t);
    emit();
  };

  const toggle = () => set(isDark() ? "light" : "dark");

  /**
   * Take up the choice kept under `name`, and keep every later one there.
   * @param {string} name storage namespace, the choice lands under `name:theme`
   */
  const remember = (name) => {
    cache = createCache(name);
    const saved = cache.get(KEY);
    if(saved) set(saved);
  };

  /** @returns {() => void} stops listening */
  const onChange = (fn) => {
    document.addEventListener("theme:change", fn);
    return () => document.removeEventListener("theme:change", fn);
  };

  // a system change counts only while no explicit choice is set
  media.addEventListener("change", () => { if(!root.dataset.theme) emit(); });

  return { current, choice, isDark, set, toggle, remember, onChange };
})();
