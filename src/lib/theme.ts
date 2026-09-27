export type ColorTheme = "bright" | "night";

const KEY = "architect-theme";

export function readTheme(): ColorTheme {
  if (typeof window === "undefined") return "night";
  return window.localStorage.getItem(KEY) === "bright" ? "bright" : "night";
}

export function applyTheme(theme: ColorTheme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(KEY, theme);
  window.dispatchEvent(new Event("architect-theme"));
}
