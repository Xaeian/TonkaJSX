// scripts/ui/theme.js

/**
 * Theme: page follows system until `set` writes `data-theme`.
 * Nothing is stored, so remembering a choice is app's business.
 * Every change fires `theme:change` on `document` with theme name.
 */
const Theme = {
  current: () => document.documentElement.dataset.theme
    || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  set: (t) => {
    document.documentElement.dataset.theme = t;
    document.dispatchEvent(new CustomEvent("theme:change", { detail: t }));
  },
  toggle: () => Theme.set(Theme.current() === "dark" ? "light" : "dark"),
};

// a system change counts only while no explicit choice is set
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if(document.documentElement.dataset.theme) return;
  const t = e.matches ? "dark" : "light";
  document.dispatchEvent(new CustomEvent("theme:change", { detail: t }));
});
