import type { Preview } from '@storybook/nextjs-vite'
import React from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from '../src/lib/theme'

const preview: Preview = {
  parameters: {
    options: {
      // Atomic Design order. Without this, the sidebar follows file-discovery
      // order, which puts Pages first because src/app precedes src/components.
      storySort: {
        order: ['Atoms', 'Molecules', 'Organisms', 'Pages'],
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
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;