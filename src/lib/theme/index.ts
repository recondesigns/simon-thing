import { createTheme } from "@mui/material/styles";
import { antonSC, inter } from "../fonts";
import { tokens } from "./tokens";

const CONTRAST_TEXT = "#0A0A0C"; // bg.surface.fill — dark enough to read on every "fill" main below

declare module "@mui/material/styles" {
  interface Theme {
    tokens: typeof tokens;
  }
  interface ThemeOptions {
    tokens?: typeof tokens;
  }
}

const theme = createTheme({
  cssVariables: true,
  tokens,
  typography: {
    // Inter is the app-wide default. CssBaseline stamps typography.fontFamily
    // onto `body`, so every plain element inherits it without a per-component
    // className — Anton SC is the opt-in display exception layered on top.
    fontFamily: inter.style.fontFamily,
    // Set here rather than overridden per-component. MUI applies
    // typography.button to every Button through Emotion, which beats a plain
    // className — a component-level override has to win a cascade fight it
    // does not need to have. Configuring MUI is safer than fighting it.
    // Button keeps Anton SC because its labels are display copy, not body text.
    button: {
      fontFamily: antonSC.style.fontFamily,
    },
  },
  palette: {
    mode: "dark",
    primary: {
      main: tokens.bg.primary.fill,
      light: tokens.text.primary.lighter,
      dark: tokens.bg.primary["fill-pressed"],
      contrastText: CONTRAST_TEXT,
    },
    success: {
      main: tokens.bg.success.fill,
      light: tokens.text.success.lighter,
      dark: tokens.bg.success["fill-pressed"],
      contrastText: CONTRAST_TEXT,
    },
    error: {
      main: tokens.bg.danger.fill,
      light: tokens.text.danger.lighter,
      dark: tokens.bg.danger["fill-pressed"],
      contrastText: CONTRAST_TEXT,
    },
    warning: {
      main: tokens.bg.warning.fill,
      light: tokens.text.warning.lighter,
      dark: tokens.bg.warning["fill-pressed"],
      contrastText: CONTRAST_TEXT,
    },
    info: {
      main: tokens.bg.info.fill,
      light: tokens.text.info.lighter,
      dark: tokens.bg.info["fill-pressed"],
      contrastText: CONTRAST_TEXT,
    },
    background: {
      default: tokens.bg.surface.fill,
      paper: tokens.bg.surface["fill-light"],
    },
    text: {
      primary: tokens.text.surface.lightest,
      secondary: tokens.text.surface.lighter,
      disabled: tokens.text.surface.default,
    },
    divider: tokens.border.surface.default,
  },
});

export default theme;
