import { createTheme } from "@mui/material/styles";
import { spaceGrotesk } from "../fonts";
import { tokens } from "./tokens";

declare module "@mui/material/styles" {
  interface Theme {
    tokens: typeof tokens;
  }
  interface ThemeOptions {
    tokens?: typeof tokens;
  }
}

/**
 * The MUI theme exists for two things now: carrying `tokens` so a `styled()`
 * call can reach them, and giving MUI's behavioural components (Drawer, Modal —
 * focus trap, scroll lock, escape handling) a palette that doesn't fight the
 * design.
 *
 * It is no longer how the app is styled. The visual layer lives in CSS modules
 * reading the custom properties in `app/tokens.css`, because the design is a
 * pill-and-glow system that looks nothing like MUI and styling *through* MUI
 * means winning an Emotion cascade fight on every component.
 */
const theme = createTheme({
  cssVariables: true,
  tokens,
  typography: {
    // Space Grotesk is the app-wide default. CssBaseline stamps
    // typography.fontFamily onto `body`, so every plain element inherits it.
    fontFamily: `var(--font-body, ${spaceGrotesk.style.fontFamily}), sans-serif`,
    // Left at the body face on purpose. This used to force the display face
    // onto every MUI Button through Emotion, which beats a className — so any
    // button that didn't opt out silently shipped in the wrong face. The
    // redesign's buttons set their own type in CSS modules.
    button: {
      fontFamily: `var(--font-body, ${spaceGrotesk.style.fontFamily}), sans-serif`,
      textTransform: "none",
    },
  },
  palette: {
    mode: "dark",
    // `primary` is the cream key colour, not a blue. Anything painted with it
    // needs `text.inverse` on top — white-on-primary is now invisible.
    primary: {
      main: tokens.bg.primary,
      light: tokens.bg["primary-hover"],
      dark: tokens.bg["primary-pressed"],
      contrastText: tokens.text.inverse,
    },
    // The status colours are split: `bg.*` is a deep tinted surface to sit
    // behind things, `text.*` is the bright legible foreground. They are not
    // two shades of one colour, so don't pair `main` with itself.
    success: {
      main: tokens.text.success,
      dark: tokens.bg.success,
      contrastText: tokens.text.inverse,
    },
    error: {
      main: tokens.text.danger,
      dark: tokens.bg.danger,
      contrastText: tokens.text.inverse,
    },
    warning: {
      main: tokens.text.warning,
      dark: tokens.bg.warning,
      contrastText: tokens.text.inverse,
    },
    info: {
      main: tokens.text.info,
      dark: tokens.bg.info,
      contrastText: tokens.text.inverse,
    },
    background: {
      default: tokens.bg.surface,
      paper: tokens.bg["surface-raised"],
    },
    text: {
      primary: tokens.text.surface,
      secondary: tokens.text.secondary,
      disabled: tokens.text.disabled,
    },
    divider: tokens.border.surface,
  },
});

export default theme;
