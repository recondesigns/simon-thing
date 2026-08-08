import type { Preview } from '@storybook/nextjs-vite'
import React from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from '../src/lib/theme'
import { fontVariables } from '../src/lib/fonts'

/*
 * The design tokens, as the app loads them. Without this every custom property
 * — `--game-*`, `--sem-*`, `--size-pad`, the `--type-*` composites and the seven
 * `dots-*` keyframes — is undefined inside a story, and components that paint
 * through them render unstyled while still mounting cleanly.
 *
 * That failure is silent in exactly the way the ThemeProvider one was: smoke
 * tests pass, the component "renders", and only a computed-value assertion
 * notices the colour is missing. Import the same entry point the app does, so
 * the two can't drift.
 */
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    options: {
      // Atomic Design order. Without this, the sidebar follows file-discovery
      // order, which puts Pages first because src/app precedes src/components.
      storySort: {
        order: ['Atoms', 'Molecules', 'Organisms', 'Templates', 'Pages'],
      },
    },

    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/*
          `app/layout.tsx` puts these three font variables on <html>; the type
          composites in tokens.css reference them, so without this every
          `--type-*` rule resolves to a font-family of nothing and falls back.
          Same className the app uses, from the single declaration site.
        */}
        <div className={fontVariables}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
