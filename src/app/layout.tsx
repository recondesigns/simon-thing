import type { Metadata, Viewport } from "next";
import ThemeRegistry from "@/providers/ThemeRegistry";
import StoreHydrator from "@/providers/StoreHydrator";
import AppShell from "@/components/organisms/AppShell/AppShell";
import { fontVariables } from "@/lib/fonts";
import { tokens } from "@/lib/theme/tokens";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dots",
  description: "Record a Simon-style memory game",
};

export const viewport: Viewport = {
  // Matches the page background so mobile browser chrome doesn't render a
  // white bar above a dark app.
  themeColor: tokens.bg.surface,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The three font custom properties land on <html> so `var(--font-body)` is
    // resolvable everywhere, including inside portalled MUI overlays.
    <html lang="en" className={fontVariables}>
      <body>
        <ThemeRegistry>
          <StoreHydrator />
          <AppShell>{children}</AppShell>
        </ThemeRegistry>
      </body>
    </html>
  );
}
